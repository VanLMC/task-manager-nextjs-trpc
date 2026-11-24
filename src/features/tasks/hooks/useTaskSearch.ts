'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export const SEARCH_DEBOUNCE_MS = 300;

export function searchHref(pathname: string, query: string) {
  return query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname;
}

export function useTaskSearch(activeQuery: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(activeQuery);
  const [isSearching, startTransition] = useTransition();

  useEffect(() => {
    setValue((current) => (current.trim() === activeQuery ? current : activeQuery));
  }, [activeQuery]);

  useEffect(() => {
    const query = value.trim();
    if (query === activeQuery) return;
    const timer = setTimeout(
      () => startTransition(() => router.replace(searchHref(pathname, query), { scroll: false })),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [value, activeQuery, pathname, router]);

  return { value, setValue, isSearching };
}
