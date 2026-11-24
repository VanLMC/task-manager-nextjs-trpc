'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef } from 'react';
import { useDeleteTask } from '@/features/tasks/hooks/useDeleteTask';
import { useToggleTask } from '@/features/tasks/hooks/useToggleTask';
import { taskListInput, taskListPaging } from '@/features/tasks/task-list-query';
import { toUserMessage } from '@/shared/errors/toUserMessage';
import { useTRPC } from '@/trpc/client';
import { TaskCard } from './TaskCard';

export function TaskList({ query }: { query?: string }) {
  const trpc = useTRPC();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tasksQuery = useInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(taskListInput(query), taskListPaging),
  );
  const { toggleTask, pendingTaskId: togglingId } = useToggleTask();
  const { deleteTask, pendingTaskId: deletingId } = useDeleteTask({
    onRemoved: () => headingRef.current?.focus(),
  });

  const tasks = tasksQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          ref={headingRef}
          tabIndex={-1}
          variant="h4"
          component="h1"
          sx={{ outline: 'none' }}
        >
          Tasks
        </Typography>
        <Button component={Link} href="/tasks/new" variant="contained">
          New task
        </Button>
      </Stack>

      {tasksQuery.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => tasksQuery.refetch()}>
              Retry
            </Button>
          }
        >
          {toUserMessage(tasksQuery.error)}
        </Alert>
      )}

      {tasksQuery.isSuccess && tasks.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography>{query ? `No tasks match “${query}”.` : 'No tasks yet.'}</Typography>
        </Paper>
      )}

      <Stack component="section" aria-label="Task list" spacing={2}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isBusy={task.id === togglingId || task.id === deletingId}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        ))}
      </Stack>
    </Stack>
  );
}
