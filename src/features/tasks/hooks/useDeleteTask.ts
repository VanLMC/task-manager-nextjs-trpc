'use client';

import { useMutation } from '@tanstack/react-query';
import type { Task } from '@/features/tasks/task.schema';
import { toUserMessage } from '@/shared/errors/toUserMessage';
import { useFeedback } from '@/shared/feedback/FeedbackProvider';
import { useTRPC } from '@/trpc/client';
import { useTaskListCache } from './useTaskListCache';

export function useDeleteTask({ onRemoved }: { onRemoved?: () => void } = {}) {
  const trpc = useTRPC();
  const cache = useTaskListCache();
  const { notify } = useFeedback();

  const notifyError = (error: unknown) =>
    notify({ severity: 'error', message: toUserMessage(error) });

  const restore = useMutation(
    trpc.task.restore.mutationOptions({
      onSuccess: () => notify({ severity: 'success', message: 'Task restored.' }),
      onError: notifyError,
      onSettled: () => cache.invalidate(),
    }),
  );

  const remove = useMutation(
    trpc.task.delete.mutationOptions({
      onMutate: async ({ id }) => {
        const snapshot = await cache.snapshot();
        cache.removeTask(id);
        onRemoved?.();
        return { snapshot };
      },
      onSuccess: ({ id }) =>
        notify({
          severity: 'success',
          message: 'Task deleted.',
          action: { label: 'Undo', onClick: () => restore.mutate({ id }) },
        }),
      onError: (error, _input, context) => {
        if (context) cache.rollback(context.snapshot);
        notifyError(error);
      },
    }),
  );

  return {
    deleteTask: (task: Task) => remove.mutate({ id: task.id }),
    pendingTaskId: remove.isPending ? remove.variables?.id : undefined,
  };
}
