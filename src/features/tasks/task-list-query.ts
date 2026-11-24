import { DEFAULT_PAGE_SIZE, type TaskCursor, TITLE_MAX_LENGTH } from './task.schema';

export function taskListInput(query?: string) {
  return query ? { query, limit: DEFAULT_PAGE_SIZE } : { limit: DEFAULT_PAGE_SIZE };
}

export const taskListPaging = {
  getNextPageParam: (lastPage: { nextCursor: TaskCursor | null }) => lastPage.nextCursor,
};

export function parseSearchQuery(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim().slice(0, TITLE_MAX_LENGTH);
}
