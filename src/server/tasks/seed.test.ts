import { taskIdSchema } from '@/features/tasks/task.schema';
import { buildSeedTasks, shouldSeedTasks } from './seed';

describe('seed', () => {
  it('builds valid fictional tasks spread over the past, newest first', () => {
    const now = new Date('2026-06-01T12:00:00.000Z');

    const tasks = buildSeedTasks(now);

    expect(tasks.length).toBeGreaterThan(20);
    for (const task of tasks) {
      expect(taskIdSchema.safeParse(task.id).success).toBe(true);
      expect(task.createdAt.getTime()).toBeLessThan(now.getTime());
    }
    const timestamps = tasks.map((task) => task.createdAt.getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });

  it('seeds unless SEED_TASKS is "false"', () => {
    expect(shouldSeedTasks({})).toBe(true);
    expect(shouldSeedTasks({ SEED_TASKS: 'true' })).toBe(true);
    expect(shouldSeedTasks({ SEED_TASKS: 'false' })).toBe(false);
  });
});
