import type { Task } from '@/features/tasks/task.schema';

const SAMPLE_TASKS: Array<Pick<Task, 'title' | 'description'>> = [
  { title: 'Plan the quarterly roadmap', description: 'Draft goals and milestones for the team.' },
  { title: 'Review pull requests', description: 'Go through the open reviews before lunch.' },
  { title: 'Update project documentation' },
  { title: 'Prepare the sprint demo', description: 'Pick two features and rehearse the flow.' },
  { title: 'Fix flaky integration test' },
  { title: 'Organize the team retrospective', description: 'Collect topics in advance.' },
  { title: 'Refactor the settings page' },
  { title: 'Write release notes', description: 'Summarize fixes and new features.' },
  { title: 'Book the meeting room for Friday' },
  { title: 'Research caching strategies', description: 'Compare HTTP caching and CDN options.' },
  { title: 'Clean up unused feature flags' },
  { title: 'Draft the onboarding checklist', description: 'Steps for the first week.' },
  { title: 'Benchmark the search endpoint' },
  { title: 'Set up error monitoring alerts' },
  { title: 'Design the empty states', description: 'Lists, search results and errors.' },
  { title: 'Translate the help center articles' },
  { title: 'Archive old project boards' },
  { title: 'Audit accessibility on forms', description: 'Labels, focus order and contrast.' },
  { title: 'Schedule one-on-one meetings' },
  { title: 'Upgrade build dependencies' },
  { title: 'Order new office supplies' },
  { title: 'Sketch the mobile layout', description: 'Focus on the task list first.' },
  { title: 'Rotate staging credentials' },
  { title: 'Collect customer feedback', description: 'Summarize the top five requests.' },
  { title: 'Prepare the budget proposal' },
  { title: 'Test the backup restore process' },
  { title: 'Write the API usage guide', description: 'Examples for each procedure.' },
  { title: 'Plan the team offsite' },
  { title: 'Review the security checklist' },
  { title: 'Celebrate the release with the team' },
];

const ONE_HOUR_MS = 3_600_000;

export function buildSeedTasks(now: Date = new Date()): Task[] {
  return SAMPLE_TASKS.map((sample, index) => {
    const createdAt = new Date(now.getTime() - (index + 1) * ONE_HOUR_MS);
    return {
      id: crypto.randomUUID(),
      ...sample,
      completed: index % 4 === 3,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

export function shouldSeedTasks(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.SEED_TASKS !== 'false';
}
