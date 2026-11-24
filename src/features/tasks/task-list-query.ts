import type { TaskCursor } from './task.schema';
import { DEFAULT_PAGE_SIZE } from './task.schema';

export function taskListInput(query?: string) {
  return query ? { query, limit: DEFAULT_PAGE_SIZE } : { limit: DEFAULT_PAGE_SIZE };
}

export const taskListPaging = {
  getNextPageParam: (lastPage: { nextCursor: TaskCursor | null }) => lastPage.nextCursor,
};
