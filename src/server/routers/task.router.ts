import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  createTaskInput,
  listTasksInput,
  type Task,
  taskIdSchema,
  updateTaskInput,
} from '@/features/tasks/task.schema';
import { appProcedure } from '../procedures';
import type { TaskRepository } from '../tasks/task.repository';
import { router } from '../trpc';

export const MAX_STORED_TASKS = 500;

const byIdInput = z.object({ id: taskIdSchema });

function taskNotFound(id: string) {
  return new TRPCError({ code: 'NOT_FOUND', message: `Task ${id} was not found.` });
}

function foundOrThrow(task: Task | null, id: string): Task {
  if (!task) throw taskNotFound(id);
  return task;
}

async function assertStoreHasRoom(repository: TaskRepository) {
  if ((await repository.count()) >= MAX_STORED_TASKS) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: `The task list is full (${MAX_STORED_TASKS} tasks). Delete a task to add a new one.`,
    });
  }
}

export const taskRouter = router({
  list: appProcedure
    .input(listTasksInput)
    .query(({ ctx, input }) => ctx.taskRepository.list(input)),

  byId: appProcedure
    .input(byIdInput)
    .query(async ({ ctx, input }) =>
      foundOrThrow(await ctx.taskRepository.findById(input.id), input.id),
    ),

  create: appProcedure.input(createTaskInput).mutation(async ({ ctx, input }) => {
    await assertStoreHasRoom(ctx.taskRepository);
    return ctx.taskRepository.create(input);
  }),

  update: appProcedure.input(updateTaskInput).mutation(async ({ ctx, input }) => {
    const { id, expectedUpdatedAt, ...changes } = input;
    const result = await ctx.taskRepository.update(id, expectedUpdatedAt, changes);
    switch (result.status) {
      case 'updated':
        return result.task;
      case 'not_found':
        throw taskNotFound(id);
      case 'conflict':
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This task was changed somewhere else. Reload it to see the latest version.',
        });
    }
  }),

  delete: appProcedure.input(byIdInput).mutation(async ({ ctx, input }) => {
    foundOrThrow(await ctx.taskRepository.delete(input.id), input.id);
    return { id: input.id };
  }),

  restore: appProcedure
    .input(byIdInput)
    .mutation(async ({ ctx, input }) =>
      foundOrThrow(await ctx.taskRepository.restore(input.id), input.id),
    ),
});
