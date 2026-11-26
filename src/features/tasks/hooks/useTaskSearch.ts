'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

export const SEARCH_DEBOUNCE_MS = 300;

export function searchHref(pathname: string, query: string) {
  return query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname;
}

export function useTaskSearch(activeQuery: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(activeQuery);
  const [isSearching, startTransition] = useTransition();
  const lastSentQuery = useRef(activeQuery);

  // Only external navigation (back/forward, links) should overwrite the input. When the URL
  // catches up with a query this hook sent, the user may already have typed more.
  useEffect(() => {
    if (activeQuery === lastSentQuery.current) return;
    lastSentQuery.current = activeQuery;
    setValue(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    const query = value.trim();
    if (query === activeQuery) return;
    const timer = setTimeout(() => {
      lastSentQuery.current = query;
      startTransition(() => router.replace(searchHref(pathname, query), { scroll: false }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, activeQuery, pathname, router]);

  return { value, setValue, isSearching };
}
