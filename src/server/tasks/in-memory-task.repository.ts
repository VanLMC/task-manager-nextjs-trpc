import type { Task } from '@/features/tasks/task.schema';
import type {
  Clock,
  NewTask,
  TaskChanges,
  TaskListOptions,
  TaskPage,
  TaskRepository,
  UpdateResult,
} from './task.repository';
import {
  comesAfterCursor,
  compareNewestFirst,
  normalizeForSearch,
  toCursor,
} from './task-ordering';

export const TRASH_RETENTION_MS = 10_000;

type InMemoryOptions = {
  now?: Clock;
  initialTasks?: Task[];
  generateId?: () => string;
};

type TrashedTask = { task: Task; deletedAt: number };

export function createInMemoryTaskRepository({
  now = () => new Date(),
  initialTasks = [],
  generateId = () => crypto.randomUUID(),
}: InMemoryOptions = {}): TaskRepository {
  const tasks = new Map(initialTasks.map((task) => [task.id, structuredClone(task)]));
  const trash = new Map<string, TrashedTask>();

  const copy = (task: Task) => structuredClone(task);

  // Strictly increasing, so two edits in the same millisecond still produce distinct versions.
  const nextUpdatedAt = (previous: Date) =>
    new Date(Math.max(now().getTime(), previous.getTime() + 1));

  const isWithinRetention = (trashed: TrashedTask) =>
    now().getTime() - trashed.deletedAt < TRASH_RETENTION_MS;

  const purgeExpiredTrash = () => {
    for (const [id, trashed] of trash) {
      if (!isWithinRetention(trashed)) trash.delete(id);
    }
  };

  const matchesQuery = (query: string | undefined) => {
    if (!query) return () => true;
    const needle = normalizeForSearch(query);
    return (task: Task) => normalizeForSearch(task.title).includes(needle);
  };

  return {
    async create({ title, description }: NewTask) {
      const createdAt = now();
      const task: Task = {
        id: generateId(),
        title,
        description: description || undefined,
        completed: false,
        createdAt,
        updatedAt: createdAt,
      };
      tasks.set(task.id, task);
      return copy(task);
    },

    async findById(id) {
      const task = tasks.get(id);
      return task ? copy(task) : null;
    },

    async list({ query, cursor, limit }: TaskListOptions): Promise<TaskPage> {
      const remaining = [...tasks.values()]
        .filter(matchesQuery(query))
        .filter((task) => !cursor || comesAfterCursor(task, cursor))
        .sort(compareNewestFirst);
      const items = remaining.slice(0, limit);
      const lastItem = items.at(-1);
      const hasMore = remaining.length > limit;
      return {
        items: items.map(copy),
        nextCursor: hasMore && lastItem ? toCursor(lastItem) : null,
      };
    },

    async update(id, expectedUpdatedAt, changes: TaskChanges): Promise<UpdateResult> {
      const task = tasks.get(id);
      if (!task) return { status: 'not_found' };
      if (task.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return { status: 'conflict', current: copy(task) };
      }
      const updated: Task = {
        ...task,
        title: changes.title ?? task.title,
        description:
          changes.description === undefined ? task.description : changes.description || undefined,
        completed: changes.completed ?? task.completed,
        updatedAt: nextUpdatedAt(task.updatedAt),
      };
      tasks.set(id, updated);
      return { status: 'updated', task: copy(updated) };
    },

    async delete(id) {
      const task = tasks.get(id);
      if (!task) return null;
      tasks.delete(id);
      purgeExpiredTrash();
      trash.set(id, { task, deletedAt: now().getTime() });
      return copy(task);
    },

    async restore(id) {
      const trashed = trash.get(id);
      trash.delete(id);
      if (!trashed || !isWithinRetention(trashed)) return null;
      tasks.set(id, trashed.task);
      return copy(trashed.task);
    },

    async count() {
      return tasks.size;
    },
  };
}
