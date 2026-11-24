import Container from '@mui/material/Container';
import { TaskList } from '@/features/tasks/components/TaskList';
import { parseSearchQuery, taskListInput, taskListPaging } from '@/features/tasks/task-list-query';
import { getQueryClient, HydrateClient, trpc } from '@/trpc/server';

export const dynamic = 'force-dynamic';

type TasksPageProps = { searchParams: Promise<{ q?: string | string[] }> };

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const query = parseSearchQuery((await searchParams).q);
  await getQueryClient().prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(taskListInput(query), taskListPaging),
  );

  return (
    <Container maxWidth="md" component="main" sx={{ py: 4 }}>
      <HydrateClient>
        <TaskList query={query} />
      </HydrateClient>
    </Container>
  );
}
