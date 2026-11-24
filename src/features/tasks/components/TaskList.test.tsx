import { screen, waitFor, within } from '@testing-library/react';
import { createInMemoryTaskRepository } from '@/server/tasks/in-memory-task.repository';
import { renderWithProviders } from '@/test/renderWithProviders';
import { createTestContext } from '@/test/server-context';
import { TaskList } from './TaskList';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/tasks',
}));

function createTickingClock() {
  let now = Date.parse('2026-01-01T12:00:00.000Z');
  return () => {
    now += 1_000;
    return new Date(now);
  };
}

async function renderWithTasks(titles: string[]) {
  const context = createTestContext({
    taskRepository: createInMemoryTaskRepository({ now: createTickingClock() }),
  });
  for (const title of titles) await context.taskRepository.create({ title });
  const rendered = renderWithProviders(<TaskList />, context);
  await screen.findByRole('heading', { name: titles.at(-1) });
  return rendered;
}

const card = (title: string) => screen.getByRole('article', { name: title });

describe('TaskList', () => {
  it('shows tasks newest first', async () => {
    await renderWithTasks(['Older task', 'Newer task']);

    const headings = within(screen.getByRole('region', { name: 'Task list' })).getAllByRole(
      'heading',
    );
    expect(headings.map((heading) => heading.textContent)).toEqual(['Newer task', 'Older task']);
  });

  it('shows an empty state when there are no tasks', async () => {
    renderWithProviders(<TaskList />);

    expect(await screen.findByText('No tasks yet.')).toBeInTheDocument();
  });

  it('marks a task as completed', async () => {
    const { user, context } = await renderWithTasks(['Water the plants']);

    await user.click(
      screen.getByRole('checkbox', { name: 'Mark "Water the plants" as completed' }),
    );

    await waitFor(async () => {
      const [stored] = (await context.taskRepository.list({ limit: 1 })).items;
      expect(stored?.completed).toBe(true);
    });
    expect(screen.getByRole('checkbox', { name: /Water the plants/ })).toBeChecked();
  });

  it('reverts the checkbox and explains why when the update fails', async () => {
    const { user, context } = await renderWithTasks(['Shared task']);
    vi.spyOn(context.taskRepository, 'update').mockResolvedValue({ status: 'not_found' });

    await user.click(screen.getByRole('checkbox', { name: /Shared task/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/was not found/);
    expect(screen.getByRole('checkbox', { name: /Shared task/ })).not.toBeChecked();
  });

  it('deletes a task and lets the user undo it', async () => {
    const { user } = await renderWithTasks(['Keep', 'Remove me']);

    await user.click(within(card('Remove me')).getByRole('button', { name: 'Delete "Remove me"' }));

    expect(screen.queryByRole('article', { name: 'Remove me' })).not.toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Task deleted.');
    expect(screen.getByRole('heading', { name: 'Tasks' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(await screen.findByRole('article', { name: 'Remove me' })).toBeInTheDocument();
    expect(await screen.findByText('Task restored.')).toBeInTheDocument();
  });

  it('brings the task back and shows an error when the delete fails', async () => {
    const { user, context } = await renderWithTasks(['Stubborn task']);
    vi.spyOn(context.taskRepository, 'delete').mockResolvedValue(null);

    await user.click(screen.getByRole('button', { name: 'Delete "Stubborn task"' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/was not found/);
    expect(card('Stubborn task')).toBeInTheDocument();
  });

  it('shows the API error with a retry when the list cannot load', async () => {
    const context = createTestContext();
    vi.spyOn(context.taskRepository, 'list').mockRejectedValueOnce(new Error('storage down'));
    const { user } = renderWithProviders(<TaskList />, context);

    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('No tasks yet.')).toBeInTheDocument();
  });
});

describe('TaskList paging and search', () => {
  it('loads the next page with the Load more fallback', async () => {
    const titles = Array.from({ length: 12 }, (_, index) => `Task ${index + 1}`);
    const { user } = await renderWithTasks(titles);
    expect(screen.getAllByRole('article')).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('article', { name: 'Task 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(12);
    expect(screen.getByText('You have reached the end of the list.')).toBeInTheDocument();
  });

  it('shows only matching tasks and a search-specific empty state', async () => {
    const context = createTestContext();
    await context.taskRepository.create({ title: 'Plan the trip' });
    await context.taskRepository.create({ title: 'Buy milk' });
    const { unmount } = renderWithProviders(<TaskList query="plan" />, context);

    expect(await screen.findByRole('article', { name: 'Plan the trip' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Buy milk' })).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<TaskList query="nothing" />, context);
    expect(await screen.findByText('No tasks match “nothing”.')).toBeInTheDocument();
  });
});
