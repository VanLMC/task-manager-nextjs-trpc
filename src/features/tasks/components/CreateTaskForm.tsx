'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toUserMessage } from '@/shared/errors/toUserMessage';
import { useFeedback } from '@/shared/feedback/FeedbackProvider';
import { useTRPC } from '@/trpc/client';
import { emptyTaskFormValues, useTaskForm } from '../hooks/useTaskForm';
import { useTaskListCache } from '../hooks/useTaskListCache';
import { TaskForm } from './TaskForm';

export function CreateTaskForm() {
  const trpc = useTRPC();
  const router = useRouter();
  const cache = useTaskListCache();
  const { notify } = useFeedback();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const createTask = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: async () => {
        await cache.invalidate();
        notify({ severity: 'success', message: 'Task created.' });
        router.push('/tasks');
      },
      onError: (error) => {
        if (!form.showServerErrors(error))
          notify({ severity: 'error', message: toUserMessage(error) });
      },
    }),
  );

  const form = useTaskForm({
    initialValues: emptyTaskFormValues,
    onValidSubmit: ({ title, description }) => createTask.mutate({ title, description }),
    onInvalid: () => titleInputRef.current?.focus(),
  });

  return (
    <TaskForm
      form={form}
      submitLabel="Create task"
      isSubmitting={createTask.isPending}
      titleInputRef={titleInputRef}
    />
  );
}
