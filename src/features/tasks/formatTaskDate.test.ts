import { formatTaskDate } from './formatTaskDate';

describe('formatTaskDate', () => {
  it('formats in a fixed time zone regardless of the machine settings', () => {
    expect(formatTaskDate(new Date('2026-11-24T15:30:00.000Z'))).toBe('Nov 24, 2026, 12:30 PM');
  });
});
