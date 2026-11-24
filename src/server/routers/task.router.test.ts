import { TRPCError } from '@trpc/server';
import type { LogEvent, Logger } from '@/server/observability/logger';
import { createFixedWindowRateLimiter } from '@/server/rate-limit/fixed-window-rate-limiter';
import { createCaller, createInProcessClient, createTestContext } from '@/test/server-context';
import { MAX_STORED_TASKS } from './task.router';

const missingId = '00000000-0000-4000-8000-000000000000';

async function expectTrpcError(promise: Promise<unknown>, code: TRPCError['code']) {
  await expect(promise).rejects.toSatisfy(
    (error: unknown) => error instanceof TRPCError && error.code === code,
  );
}

describe('task router', () => {
  it('creates, reads, lists, updates and deletes a task', async () => {
    const api = createCaller(createTestContext());

    const created = await api.task.create({ title: '  Buy coffee  ', description: 'Dark roast' });
    const updated = await api.task.update({
      id: created.id,
      expectedUpdatedAt: created.updatedAt,
      completed: true,
    });

    expect(created.title).toBe('Buy coffee');
    expect(await api.task.byId({ id: created.id })).toEqual(updated);
    expect((await api.task.list({})).items).toEqual([updated]);
    expect(await api.task.delete({ id: created.id })).toEqual({ id: created.id });
    expect((await api.task.list({})).items).toEqual([]);
  });

  it('rejects a task without a title', async () => {
    const api = createCaller(createTestContext());

    await expectTrpcError(api.task.create({ title: '   ' }), 'BAD_REQUEST');
  });

  it('returns NOT_FOUND for a missing task on read, update, delete and restore', async () => {
    const api = createCaller(createTestContext());

    await expectTrpcError(api.task.byId({ id: missingId }), 'NOT_FOUND');
    await expectTrpcError(
      api.task.update({ id: missingId, expectedUpdatedAt: new Date(), title: 'Ghost' }),
      'NOT_FOUND',
    );
    await expectTrpcError(api.task.delete({ id: missingId }), 'NOT_FOUND');
    await expectTrpcError(api.task.restore({ id: missingId }), 'NOT_FOUND');
  });

  it('returns CONFLICT when updating from a stale version', async () => {
    const api = createCaller(createTestContext());
    const task = await api.task.create({ title: 'Shared' });
    await api.task.update({ id: task.id, expectedUpdatedAt: task.updatedAt, title: 'Tab A' });

    await expectTrpcError(
      api.task.update({ id: task.id, expectedUpdatedAt: task.updatedAt, title: 'Tab B' }),
      'CONFLICT',
    );
  });

  it('restores a deleted task', async () => {
    const api = createCaller(createTestContext());
    const task = await api.task.create({ title: 'Undo me' });
    await api.task.delete({ id: task.id });

    expect(await api.task.restore({ id: task.id })).toEqual(task);
  });

  it('refuses new tasks once the store is full', async () => {
    const context = createTestContext();
    vi.spyOn(context.taskRepository, 'count').mockResolvedValue(MAX_STORED_TASKS);

    await expectTrpcError(
      createCaller(context).task.create({ title: 'One too many' }),
      'PRECONDITION_FAILED',
    );
  });

  it('rate-limits mutations per client but never queries', async () => {
    const api = createCaller(
      createTestContext({
        rateLimiter: createFixedWindowRateLimiter({ limit: 1, windowMs: 60_000 }),
      }),
    );
    await api.task.create({ title: 'Allowed' });

    await expectTrpcError(api.task.create({ title: 'Blocked' }), 'TOO_MANY_REQUESTS');
    await expect(api.task.list({})).resolves.toBeDefined();
    await expect(api.task.list({})).resolves.toBeDefined();
  });

  it('logs one structured event per call, including the error code', async () => {
    const events: LogEvent[] = [];
    const logger: Logger = { log: (event) => events.push(event) };
    const api = createCaller(createTestContext({ logger, requestId: 'req-42' }));

    await api.task.list({});
    await api.task.byId({ id: missingId }).catch(() => {});

    expect(events).toEqual([
      expect.objectContaining({
        event: 'trpc.request',
        requestId: 'req-42',
        path: 'task.list',
        type: 'query',
        ok: true,
        durationMs: expect.any(Number),
      }),
      expect.objectContaining({ path: 'task.byId', ok: false, code: 'NOT_FOUND' }),
    ]);
  });
});

describe('task API over HTTP', () => {
  it('returns field errors for invalid input', async () => {
    const client = createInProcessClient(createTestContext());

    await expect(client.task.create.mutate({ title: '' })).rejects.toMatchObject({
      data: { code: 'BAD_REQUEST', httpStatus: 400, fieldErrors: { title: ['Title is required'] } },
    });
  });

  it('keeps dates as Date objects across the wire', async () => {
    const client = createInProcessClient(createTestContext());

    const task = await client.task.create.mutate({ title: 'Typed dates' });

    expect(task.createdAt).toBeInstanceOf(Date);
  });

  it('echoes the request id in the response headers', async () => {
    const context = createTestContext({ requestId: 'req-from-client' });
    const { createInProcessFetch } = await import('@/test/server-context');

    const response = await createInProcessFetch(context)('/api/trpc/task.list?input=%7B%7D');

    expect(response.headers.get('x-request-id')).toBe('req-from-client');
  });
});
