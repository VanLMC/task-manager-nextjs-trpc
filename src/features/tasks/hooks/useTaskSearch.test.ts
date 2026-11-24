import { act, renderHook } from '@testing-library/react';
import { SEARCH_DEBOUNCE_MS, searchHref, useTaskSearch } from './useTaskSearch';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/tasks',
}));

beforeEach(() => {
  replace.mockReset();
  vi.useFakeTimers();
});

afterEach(() => vi.useRealTimers());

describe('useTaskSearch', () => {
  it('updates the URL once, after the user stops typing', () => {
    const { result } = renderHook(() => useTaskSearch(''));

    act(() => result.current.setValue('rep'));
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    act(() => result.current.setValue('report '));
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/tasks?q=report', { scroll: false });
  });

  it('clears the query parameter when the search is emptied', () => {
    const { result } = renderHook(() => useTaskSearch('report'));

    act(() => result.current.setValue('  '));
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    expect(replace).toHaveBeenCalledWith('/tasks', { scroll: false });
  });

  it('follows the URL when it changes through navigation', () => {
    const { result, rerender } = renderHook(({ query }) => useTaskSearch(query), {
      initialProps: { query: 'first' },
    });

    rerender({ query: 'second' });

    expect(result.current.value).toBe('second');
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('searchHref', () => {
  it('encodes the query', () => {
    expect(searchHref('/tasks', 'café & co')).toBe('/tasks?q=caf%C3%A9%20%26%20co');
  });
});
