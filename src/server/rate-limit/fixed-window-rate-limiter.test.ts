import { createFixedWindowRateLimiter } from './fixed-window-rate-limiter';

describe('createFixedWindowRateLimiter', () => {
  const createLimiter = () => {
    let now = 0;
    const limiter = createFixedWindowRateLimiter({ limit: 2, windowMs: 1_000, now: () => now });
    return { limiter, advance: (ms: number) => (now += ms) };
  };

  it('allows up to the limit within a window, then rejects', () => {
    const { limiter } = createLimiter();

    expect([1, 2, 3].map(() => limiter.tryConsume('client'))).toEqual([true, true, false]);
  });

  it('starts a fresh window once the previous one expires', () => {
    const { limiter, advance } = createLimiter();
    limiter.tryConsume('client');
    limiter.tryConsume('client');

    advance(1_000);

    expect(limiter.tryConsume('client')).toBe(true);
  });

  it('counts each client separately', () => {
    const { limiter } = createLimiter();
    limiter.tryConsume('a');
    limiter.tryConsume('a');

    expect(limiter.tryConsume('b')).toBe(true);
  });
});

describe('createFixedWindowRateLimiter memory', () => {
  it('forgets expired clients once many have been tracked', () => {
    let now = 0;
    const limiter = createFixedWindowRateLimiter({ limit: 1, windowMs: 1_000, now: () => now });
    limiter.tryConsume('returning-client');
    for (let index = 0; index < 1_001; index++) limiter.tryConsume(`client-${index}`);

    now = 1_000;

    expect(limiter.tryConsume('another-client')).toBe(true);
    expect(limiter.tryConsume('returning-client')).toBe(true);
  });
});
