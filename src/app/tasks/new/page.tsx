import type { Metadata } from 'next';
import { CreateTaskForm } from '@/features/tasks/components/CreateTaskForm';
import { FormPage } from '@/shared/ui/FormPage';

export const metadata: Metadata = { title: 'New task · Task Manager' };

export default function NewTaskPage() {
  return (
    <FormPage title="New task">
      <CreateTaskForm />
    </FormPage>
  );
}
