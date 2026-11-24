import type { Task, TaskCursor } from '@/features/tasks/task.schema';

type OrderKey = Pick<Task, 'createdAt' | 'id'>;

export function compareNewestFirst(a: OrderKey, b: OrderKey): number {
  const byDate = b.createdAt.getTime() - a.createdAt.getTime();
  if (byDate !== 0) return byDate;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

export function comesAfterCursor(task: OrderKey, cursor: TaskCursor): boolean {
  return compareNewestFirst(cursor, task) < 0;
}

export function toCursor(task: OrderKey): TaskCursor {
  return { createdAt: task.createdAt, id: task.id };
}

export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
