'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toUserMessage } from '@/shared/errors/toUserMessage';
import { useFeedback } from '@/shared/feedback/FeedbackProvider';
import { useTRPC } from '@/trpc/client';
import { toTaskFormValues, useTaskForm } from '../hooks/useTaskForm';
import { useTaskListCache } from '../hooks/useTaskListCache';
import { TaskForm } from './TaskForm';

function isConflict(error: unknown) {
  return error instanceof TRPCClientError && error.data?.code === 'CONFLICT';
}

export function EditTaskForm({ id }: { id: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const cache = useTaskListCache();
  const { notify } = useFeedback();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [hasConflict, setHasConflict] = useState(false);

  const taskQuery = useSuspenseQuery(trpc.task.byId.queryOptions({ id }));
  const task = taskQuery.data;

  const updateTask = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: async (updated) => {
        queryClient.setQueryData(trpc.task.byId.queryKey({ id }), updated);
        await cache.invalidate();
        notify({ severity: 'success', message: 'Task updated.' });
        router.push('/tasks');
      },
      onError: (error) => {
        if (isConflict(error)) return setHasConflict(true);
        if (!form.showServerErrors(error))
          notify({ severity: 'error', message: toUserMessage(error) });
      },
    }),
  );

  const form = useTaskForm({
    initialValues: toTaskFormValues(task),
    onValidSubmit: (input) =>
      updateTask.mutate({ id, expectedUpdatedAt: task.updatedAt, ...input }),
    onInvalid: () => titleInputRef.current?.focus(),
  });

  const reloadLatest = async () => {
    const { data: latest } = await taskQuery.refetch();
    if (!latest) return;
    form.reset(toTaskFormValues(latest));
    setHasConflict(false);
  };

  return (
    <TaskForm
      form={form}
      submitLabel="Save changes"
      isSubmitting={updateTask.isPending}
      titleInputRef={titleInputRef}
      showCompleted
      notice={
        hasConflict && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={reloadLatest}>
                Reload latest
              </Button>
            }
          >
            This task was changed somewhere else. Reload it to see the latest version.
          </Alert>
        )
      }
    />
  );
}
