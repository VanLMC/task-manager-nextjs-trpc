import { createJsonLogger } from './logger';

describe('createJsonLogger', () => {
  it('writes one JSON line with a timestamp per event', () => {
    const lines: string[] = [];
    const logger = createJsonLogger((line) => lines.push(line));

    logger.log({ event: 'test.event', durationMs: 3 });

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      time: expect.any(String),
      event: 'test.event',
      durationMs: 3,
    });
  });
});
