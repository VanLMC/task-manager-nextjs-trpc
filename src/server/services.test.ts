import { createServices, getServices } from './services';

describe('services', () => {
  it('seeds demo tasks by default', async () => {
    const { taskRepository } = createServices({ NODE_ENV: 'test' });

    expect(await taskRepository.count()).toBeGreaterThan(0);
  });

  it('starts empty when SEED_TASKS is "false"', async () => {
    const { taskRepository } = createServices({ NODE_ENV: 'test', SEED_TASKS: 'false' });

    expect(await taskRepository.count()).toBe(0);
  });

  it('uses the configured mutation rate limit', () => {
    const { rateLimiter } = createServices({ NODE_ENV: 'test', RATE_LIMIT_PER_MINUTE: '1' });

    expect([rateLimiter.tryConsume('ip'), rateLimiter.tryConsume('ip')]).toEqual([true, false]);
  });

  it('returns the same instance on every call within a process', () => {
    expect(getServices()).toBe(getServices());
  });
});
