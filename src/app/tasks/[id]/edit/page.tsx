import { TRPCError } from '@trpc/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditTaskForm } from '@/features/tasks/components/EditTaskForm';
import { taskIdSchema } from '@/features/tasks/task.schema';
import { FormPage } from '@/shared/ui/FormPage';
import { getQueryClient, HydrateClient, trpc } from '@/trpc/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Edit task · Task Manager' };

async function prefetchTaskOrNotFound(id: string) {
  if (!taskIdSchema.safeParse(id).success) notFound();
  try {
    await getQueryClient().fetchQuery(trpc.task.byId.queryOptions({ id }));
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }
}

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prefetchTaskOrNotFound(id);

  return (
    <FormPage title="Edit task">
      <HydrateClient>
        <EditTaskForm id={id} />
      </HydrateClient>
    </FormPage>
  );
}
