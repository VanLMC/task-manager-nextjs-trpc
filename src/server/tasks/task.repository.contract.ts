import fc from 'fast-check';
import type { Task } from '@/features/tasks/task.schema';
import { TRASH_RETENTION_MS } from './in-memory-task.repository';
import type { Clock, TaskRepository } from './task.repository';
import { compareNewestFirst } from './task-ordering';

export type RepositoryFactory = (clock: Clock) => TaskRepository;

type ManualClock = Clock & { advance(ms: number): void };

function createManualClock(start = Date.parse('2026-01-01T12:00:00.000Z')): ManualClock {
  let current = start;
  return Object.assign(() => new Date(current), {
    advance: (ms: number) => {
      current += ms;
    },
  });
}

async function readAllPages(repository: TaskRepository, limit: number, query?: string) {
  const ids: string[] = [];
  let cursor = null;
  do {
    const page: Awaited<ReturnType<TaskRepository['list']>> = await repository.list({
      query,
      cursor,
      limit,
    });
    ids.push(...page.items.map((task) => task.id));
    cursor = page.nextCursor;
  } while (cursor);
  return ids;
}

const idsNewestFirst = (tasks: Task[]) => [...tasks].sort(compareNewestFirst).map((t) => t.id);

export function describeTaskRepositoryContract(name: string, createRepository: RepositoryFactory) {
  describe(`${name} (TaskRepository contract)`, () => {
    let clock: ManualClock;
    let repository: TaskRepository;

    beforeEach(() => {
      clock = createManualClock();
      repository = createRepository(clock);
    });

    describe('create', () => {
      it('assigns an id, timestamps and an open status', async () => {
        const task = await repository.create({ title: 'Write tests', description: 'Cover edges' });

        expect(task).toEqual({
          id: expect.any(String),
          title: 'Write tests',
          description: 'Cover edges',
          completed: false,
          createdAt: clock(),
          updatedAt: clock(),
        });
      });

      it('stores an empty description as no description', async () => {
        const task = await repository.create({ title: 'No details', description: '' });

        expect(task.description).toBeUndefined();
      });

      it('generates unique ids', async () => {
        const first = await repository.create({ title: 'First' });
        const second = await repository.create({ title: 'Second' });

        expect(first.id).not.toBe(second.id);
      });
    });

    describe('findById', () => {
      it('returns the stored task or null', async () => {
        const task = await repository.create({ title: 'Find me' });

        expect(await repository.findById(task.id)).toEqual(task);
        expect(await repository.findById(crypto.randomUUID())).toBeNull();
      });

      it('returns copies that cannot change the stored task', async () => {
        const task = await repository.create({ title: 'Original' });
        const found = await repository.findById(task.id);
        if (!found) throw new Error('expected task');

        found.title = 'Mutated';
        found.createdAt.setFullYear(1999);

        expect(await repository.findById(task.id)).toEqual(task);
      });
    });

    describe('list', () => {
      it('returns tasks newest first', async () => {
        const older = await repository.create({ title: 'Older' });
        clock.advance(1_000);
        const newer = await repository.create({ title: 'Newer' });

        const page = await repository.list({ limit: 10 });

        expect(page.items.map((task) => task.id)).toEqual([newer.id, older.id]);
        expect(page.nextCursor).toBeNull();
      });

      it('breaks ties on identical timestamps by id', async () => {
        const tasks = await Promise.all(
          ['A', 'B', 'C'].map((title) => repository.create({ title })),
        );

        expect(await readAllPages(repository, 1)).toEqual(idsNewestFirst(tasks));
      });

      it('returns a cursor only when more tasks remain', async () => {
        for (const title of ['One', 'Two', 'Three']) {
          await repository.create({ title });
          clock.advance(1);
        }

        const firstPage = await repository.list({ limit: 2 });
        const lastPage = await repository.list({ limit: 2, cursor: firstPage.nextCursor });

        expect(firstPage.items).toHaveLength(2);
        expect(firstPage.nextCursor).toEqual({
          id: firstPage.items[1]?.id,
          createdAt: firstPage.items[1]?.createdAt,
        });
        expect(lastPage.items).toHaveLength(1);
        expect(lastPage.nextCursor).toBeNull();
      });

      it('keeps paging correctly after the cursor task is deleted', async () => {
        const created: Task[] = [];
        for (let index = 0; index < 5; index++) {
          created.push(await repository.create({ title: `Task ${index}` }));
          clock.advance(1);
        }
        const firstPage = await repository.list({ limit: 2 });
        const cursorTask = firstPage.items.at(-1);
        if (!cursorTask) throw new Error('expected a cursor task');

        await repository.delete(cursorTask.id);
        const secondPage = await repository.list({ limit: 2, cursor: firstPage.nextCursor });

        expect(secondPage.items.map((task) => task.title)).toEqual(['Task 2', 'Task 1']);
      });

      it('filters by title ignoring case and accents', async () => {
        await repository.create({ title: 'Revisar relatório' });
        await repository.create({ title: 'RELATORIO final' });
        await repository.create({ title: 'Unrelated' });

        const page = await repository.list({ limit: 10, query: 'relatorio' });

        expect(page.items.map((task) => task.title).sort()).toEqual([
          'RELATORIO final',
          'Revisar relatório',
        ]);
      });

      it('pages through search results without gaps', async () => {
        const matching: Task[] = [];
        for (let index = 0; index < 7; index++) {
          const task = await repository.create({ title: index % 2 ? `Match ${index}` : 'Other' });
          if (index % 2) matching.push(task);
          clock.advance(1);
        }

        expect(await readAllPages(repository, 2, 'match')).toEqual(idsNewestFirst(matching));
      });
    });

    describe('update', () => {
      it('applies changes and moves updatedAt forward', async () => {
        const task = await repository.create({ title: 'Draft', description: 'Old' });
        clock.advance(500);

        const result = await repository.update(task.id, task.updatedAt, {
          title: 'Final',
          completed: true,
        });

        expect(result).toEqual({
          status: 'updated',
          task: { ...task, title: 'Final', completed: true, updatedAt: clock() },
        });
      });

      it('keeps fields that were not sent and clears an empty description', async () => {
        const task = await repository.create({ title: 'Keep me', description: 'Remove me' });

        const result = await repository.update(task.id, task.updatedAt, { description: '' });

        expect(result).toMatchObject({
          status: 'updated',
          task: { title: 'Keep me', description: undefined, createdAt: task.createdAt },
        });
      });

      it('gives every update a distinct version, even in the same millisecond', async () => {
        const task = await repository.create({ title: 'Fast edits' });
        const first = await repository.update(task.id, task.updatedAt, { completed: true });
        if (first.status !== 'updated') throw new Error('expected update');

        const stale = await repository.update(task.id, task.updatedAt, { completed: false });

        expect(first.task.updatedAt.getTime()).toBeGreaterThan(task.updatedAt.getTime());
        expect(stale.status).toBe('conflict');
      });

      it('reports a conflict when the task changed since it was read', async () => {
        const task = await repository.create({ title: 'Shared' });
        await repository.update(task.id, task.updatedAt, { title: 'Changed in another tab' });

        const result = await repository.update(task.id, task.updatedAt, { title: 'Mine' });

        expect(result).toMatchObject({
          status: 'conflict',
          current: { title: 'Changed in another tab' },
        });
      });

      it('reports a missing task', async () => {
        const result = await repository.update(crypto.randomUUID(), clock(), { title: 'Ghost' });

        expect(result).toEqual({ status: 'not_found' });
      });
    });

    describe('delete and restore', () => {
      it('removes the task and returns it', async () => {
        const task = await repository.create({ title: 'Temporary' });

        expect(await repository.delete(task.id)).toEqual(task);
        expect(await repository.findById(task.id)).toBeNull();
        expect(await repository.count()).toBe(0);
      });

      it('returns null when deleting a missing task', async () => {
        expect(await repository.delete(crypto.randomUUID())).toBeNull();
      });

      it('restores a deleted task unchanged within the retention window', async () => {
        const task = await repository.create({ title: 'Oops' });
        await repository.delete(task.id);
        clock.advance(TRASH_RETENTION_MS - 1);

        expect(await repository.restore(task.id)).toEqual(task);
        expect(await readAllPages(repository, 10)).toEqual([task.id]);
      });

      it('cannot restore after the retention window or twice', async () => {
        const expired = await repository.create({ title: 'Too late' });
        const restored = await repository.create({ title: 'Only once' });
        await repository.delete(expired.id);
        await repository.delete(restored.id);

        expect(await repository.restore(restored.id)).not.toBeNull();
        expect(await repository.restore(restored.id)).toBeNull();
        clock.advance(TRASH_RETENTION_MS);
        expect(await repository.restore(expired.id)).toBeNull();
      });
    });

    describe('pagination properties', () => {
      const operation = fc.oneof(
        fc.record({ kind: fc.constant('create' as const), tick: fc.integer({ min: 0, max: 2 }) }),
        fc.record({ kind: fc.constant('delete' as const), pick: fc.nat() }),
      );

      it('returns every remaining task exactly once, newest first, for any history', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(operation, { maxLength: 40 }),
            fc.integer({ min: 1, max: 7 }),
            async (operations, limit) => {
              const localClock = createManualClock();
              const subject = createRepository(localClock);
              const alive: Task[] = [];
              for (const op of operations) {
                if (op.kind === 'create') {
                  localClock.advance(op.tick);
                  alive.push(await subject.create({ title: 'Generated' }));
                } else if (alive.length > 0) {
                  const [removed] = alive.splice(op.pick % alive.length, 1);
                  if (removed) await subject.delete(removed.id);
                }
              }

              expect(await readAllPages(subject, limit)).toEqual(idsNewestFirst(alive));
            },
          ),
        );
      });

      it('never skips or repeats tasks when already-seen tasks are deleted while paging', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.integer({ min: 0, max: 2 }), { minLength: 1, maxLength: 30 }),
            fc.integer({ min: 1, max: 5 }),
            fc.array(fc.boolean(), { maxLength: 30 }),
            async (ticks, limit, deleteSeen) => {
              const localClock = createManualClock();
              const subject = createRepository(localClock);
              const created: Task[] = [];
              for (const tick of ticks) {
                localClock.advance(tick);
                created.push(await subject.create({ title: 'Generated' }));
              }

              const seen: string[] = [];
              let cursor = null;
              let decision = 0;
              do {
                const page: Awaited<ReturnType<TaskRepository['list']>> = await subject.list({
                  cursor,
                  limit,
                });
                seen.push(...page.items.map((task) => task.id));
                for (const task of page.items) {
                  if (deleteSeen[decision++ % Math.max(deleteSeen.length, 1)]) {
                    await subject.delete(task.id);
                  }
                }
                cursor = page.nextCursor;
              } while (cursor);

              expect(seen).toEqual(idsNewestFirst(created));
            },
          ),
        );
      });
    });
  });
}
