import { createInMemoryTaskRepository } from './in-memory-task.repository';
import { describeTaskRepositoryContract } from './task.repository.contract';

describeTaskRepositoryContract('InMemoryTaskRepository', (clock) =>
  createInMemoryTaskRepository({ now: clock }),
);

describe('InMemoryTaskRepository initial tasks', () => {
  it('starts with the given tasks without sharing references', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const seeded = {
      id: crypto.randomUUID(),
      title: 'Seeded',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    };
    const repository = createInMemoryTaskRepository({ initialTasks: [seeded] });

    seeded.title = 'Changed outside';

    expect(await repository.findById(seeded.id)).toMatchObject({ title: 'Seeded' });
  });
});
