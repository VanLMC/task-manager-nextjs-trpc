import Container from '@mui/material/Container';
import { TaskList } from '@/features/tasks/components/TaskList';
import { taskListInput, taskListPaging } from '@/features/tasks/task-list-query';
import { getQueryClient, HydrateClient, trpc } from '@/trpc/server';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  await getQueryClient().prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(taskListInput(), taskListPaging),
  );

  return (
    <Container maxWidth="md" component="main" sx={{ py: 4 }}>
      <HydrateClient>
        <TaskList />
      </HydrateClient>
    </Container>
  );
}
