import { screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { MAX_STORED_TASKS } from '@/server/routers/task.router';
import { renderWithProviders } from '@/test/renderWithProviders';
import { createTestContext } from '@/test/server-context';
import { CreateTaskForm } from './CreateTaskForm';
import { EditTaskForm } from './EditTaskForm';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

beforeEach(() => push.mockReset());

describe('CreateTaskForm', () => {
  it('blocks an empty title without calling the API and focuses the field', async () => {
    const { user, context } = renderWithProviders(<CreateTaskForm />);

    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveFocus();
    expect(await context.taskRepository.count()).toBe(0);
  });

  it('creates the task, confirms it and returns to the list', async () => {
    const { user, context } = renderWithProviders(<CreateTaskForm />);

    await user.type(screen.getByRole('textbox', { name: /Title/ }), 'Call the plumber');
    await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Kitchen sink');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/tasks'));
    expect(await screen.findByText('Task created.')).toBeInTheDocument();
    const { items } = await context.taskRepository.list({ limit: 1 });
    expect(items[0]).toMatchObject({ title: 'Call the plumber', description: 'Kitchen sink' });
  });

  it('keeps the typed values and shows the server error when saving fails', async () => {
    const context = createTestContext();
    vi.spyOn(context.taskRepository, 'count').mockResolvedValue(MAX_STORED_TASKS);
    const { user } = renderWithProviders(<CreateTaskForm />, context);

    await user.type(screen.getByRole('textbox', { name: /Title/ }), 'Will not fit');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/task list is full/);
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('Will not fit');
    expect(push).not.toHaveBeenCalled();
  });
});

describe('EditTaskForm', () => {
  async function renderEditForm() {
    const context = createTestContext();
    const task = await context.taskRepository.create({ title: 'Original', description: 'Notes' });
    const rendered = renderWithProviders(
      <Suspense fallback="Loading">
        <EditTaskForm id={task.id} />
      </Suspense>,
      context,
    );
    await screen.findByDisplayValue('Original');
    return { ...rendered, task };
  }

  it('saves changes including the completed status', async () => {
    const { user, context, task } = await renderEditForm();

    await user.clear(screen.getByRole('textbox', { name: /Title/ }));
    await user.type(screen.getByRole('textbox', { name: /Title/ }), 'Renamed');
    await user.click(screen.getByRole('checkbox', { name: 'Completed' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/tasks'));
    expect(await context.taskRepository.findById(task.id)).toMatchObject({
      title: 'Renamed',
      description: 'Notes',
      completed: true,
    });
  });

  it('warns about a conflicting change and reloads the latest version', async () => {
    const { user, context, task } = await renderEditForm();
    await context.taskRepository.update(task.id, task.updatedAt, { title: 'Changed elsewhere' });

    await user.type(screen.getByRole('textbox', { name: /Title/ }), ' (mine)');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(/changed somewhere else/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Reload latest' }));

    expect(await screen.findByDisplayValue('Changed elsewhere')).toBeInTheDocument();
    expect(screen.queryByText(/changed somewhere else/)).not.toBeInTheDocument();
  });
});
