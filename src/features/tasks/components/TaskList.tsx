'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef } from 'react';
import { useDeleteTask } from '@/features/tasks/hooks/useDeleteTask';
import { useInView } from '@/features/tasks/hooks/useInView';
import { useToggleTask } from '@/features/tasks/hooks/useToggleTask';
import { taskListInput, taskListPaging } from '@/features/tasks/task-list-query';
import { toUserMessage } from '@/shared/errors/toUserMessage';
import { useTRPC } from '@/trpc/client';
import { TaskCard } from './TaskCard';
import { TaskSearch } from './TaskSearch';

export function TaskList({ query = '' }: { query?: string }) {
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
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = tasksQuery;
  const canLoadMore = hasNextPage && !isFetchingNextPage && !tasksQuery.isFetchNextPageError;
  const sentinelRef = useInView<HTMLDivElement>(() => fetchNextPage(), {
    enabled: canLoadMore,
    resetKey: tasks.length,
  });

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

      <TaskSearch query={query} />

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

      <Box ref={sentinelRef} sx={{ display: 'flex', justifyContent: 'center', minHeight: 40 }}>
        {isFetchingNextPage && <CircularProgress size={28} aria-label="Loading more tasks" />}
        {canLoadMore && (
          <Button variant="outlined" onClick={() => fetchNextPage()}>
            Load more
          </Button>
        )}
        {!hasNextPage && tasksQuery.data && tasksQuery.data.pages.length > 1 && (
          <Typography variant="body2" color="text.secondary">
            You have reached the end of the list.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
