import type { Task, TaskCursor } from '@/features/tasks/task.schema';

export type Clock = () => Date;

export type NewTask = { title: string; description?: string };

export type TaskChanges = { title?: string; description?: string; completed?: boolean };

export type TaskListOptions = { query?: string; cursor?: TaskCursor | null; limit: number };

export type TaskPage = { items: Task[]; nextCursor: TaskCursor | null };

export type UpdateResult =
  | { status: 'updated'; task: Task }
  | { status: 'not_found' }
  | { status: 'conflict'; current: Task };

export interface TaskRepository {
  create(task: NewTask): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  list(options: TaskListOptions): Promise<TaskPage>;
  update(id: string, expectedUpdatedAt: Date, changes: TaskChanges): Promise<UpdateResult>;
  delete(id: string): Promise<Task | null>;
  restore(id: string): Promise<Task | null>;
  count(): Promise<number>;
}
