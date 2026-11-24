'use client';

import { type InfiniteData, useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/features/tasks/task.schema';
import type { TaskPage } from '@/server/tasks/task.repository';
import { useTRPC } from '@/trpc/client';

type TaskListData = InfiniteData<TaskPage, unknown>;

function mapItems(data: TaskListData | undefined, transform: (items: Task[]) => Task[]) {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => ({ ...page, items: transform(page.items) })) };
}

export function useTaskListCache() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listFilter = trpc.task.list.pathFilter();

  const updateAllLists = (transform: (items: Task[]) => Task[]) =>
    queryClient.setQueriesData<TaskListData>(listFilter, (data) => mapItems(data, transform));

  return {
    async snapshot() {
      await queryClient.cancelQueries(listFilter);
      return queryClient.getQueriesData<TaskListData>(listFilter);
    },
    rollback(snapshot: Array<[readonly unknown[], TaskListData | undefined]>) {
      for (const [queryKey, data] of snapshot) queryClient.setQueryData(queryKey, data);
    },
    removeTask(id: string) {
      updateAllLists((items) => items.filter((task) => task.id !== id));
    },
    replaceTask(task: Task) {
      updateAllLists((items) => items.map((item) => (item.id === task.id ? task : item)));
    },
    invalidate() {
      return queryClient.invalidateQueries(listFilter);
    },
  };
}
