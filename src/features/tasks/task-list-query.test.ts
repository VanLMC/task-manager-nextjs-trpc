import { DEFAULT_PAGE_SIZE, TITLE_MAX_LENGTH } from './task.schema';
import { parseSearchQuery, taskListInput } from './task-list-query';

describe('task list query helpers', () => {
  it('builds the list input with an optional search', () => {
    expect(taskListInput()).toEqual({ limit: DEFAULT_PAGE_SIZE });
    expect(taskListInput('')).toEqual({ limit: DEFAULT_PAGE_SIZE });
    expect(taskListInput('plan')).toEqual({ query: 'plan', limit: DEFAULT_PAGE_SIZE });
  });

  it('parses the q search parameter safely', () => {
    expect(parseSearchQuery(undefined)).toBe('');
    expect(parseSearchQuery('  plan  ')).toBe('plan');
    expect(parseSearchQuery(['first', 'second'])).toBe('first');
    expect(parseSearchQuery('x'.repeat(500))).toHaveLength(TITLE_MAX_LENGTH);
  });
});
