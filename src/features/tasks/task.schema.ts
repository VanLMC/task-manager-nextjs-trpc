import { z } from 'zod';

export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`);

const descriptionSchema = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
  .optional();

export const taskIdSchema = z.uuid('Invalid task id');

export const taskCursorSchema = z.object({ createdAt: z.date(), id: taskIdSchema });

export const createTaskInput = z.object({ title: titleSchema, description: descriptionSchema });

export const updateTaskInput = z.object({
  id: taskIdSchema,
  expectedUpdatedAt: z.date(),
  title: titleSchema.optional(),
  description: descriptionSchema,
  completed: z.boolean().optional(),
});

export const listTasksInput = z.object({
  query: z.string().trim().max(TITLE_MAX_LENGTH).optional(),
  cursor: taskCursorSchema.nullish(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type CreateTaskInput = z.infer<typeof createTaskInput>;
export type UpdateTaskInput = z.infer<typeof updateTaskInput>;
export type ListTasksInput = z.input<typeof listTasksInput>;
export type TaskCursor = z.infer<typeof taskCursorSchema>;

export type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};
