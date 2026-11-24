'use client';

import { useMutation } from '@tanstack/react-query';
import type { Task } from '@/features/tasks/task.schema';
import { toUserMessage } from '@/shared/errors/toUserMessage';
import { useFeedback } from '@/shared/feedback/FeedbackProvider';
import { useTRPC } from '@/trpc/client';
import { useTaskListCache } from './useTaskListCache';

export function useToggleTask() {
  const trpc = useTRPC();
  const cache = useTaskListCache();
  const { notify } = useFeedback();

  const mutation = useMutation(
    trpc.task.update.mutationOptions({
      onMutate: async ({ id, completed }) => {
        const snapshot = await cache.snapshot();
        const current = snapshot
          .flatMap(([, data]) => data?.pages.flatMap((page) => page.items) ?? [])
          .find((task) => task.id === id);
        if (current && completed !== undefined) cache.replaceTask({ ...current, completed });
        return { snapshot };
      },
      onSuccess: (task) => cache.replaceTask(task),
      onError: (error, _input, context) => {
        if (context) cache.rollback(context.snapshot);
        notify({ severity: 'error', message: toUserMessage(error) });
      },
    }),
  );

  return {
    toggleTask: (task: Task) =>
      mutation.mutate({
        id: task.id,
        expectedUpdatedAt: task.updatedAt,
        completed: !task.completed,
      }),
    pendingTaskId: mutation.isPending ? mutation.variables?.id : undefined,
  };
}
