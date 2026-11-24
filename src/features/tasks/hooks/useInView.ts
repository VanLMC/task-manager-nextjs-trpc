'use client';

import { useEffect, useRef } from 'react';

type InViewOptions = {
  enabled?: boolean;
  rootMargin?: string;
  /** Re-observing after the list grows re-triggers onEnter if the sentinel is still visible. */
  resetKey?: unknown;
};

export function useInView<T extends Element>(
  onEnter: () => void,
  { enabled = true, rootMargin = '200px', resetKey }: InViewOptions = {},
) {
  const elementRef = useRef<T>(null);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  // biome-ignore lint/correctness/useExhaustiveDependencies: resetKey intentionally re-creates the observer
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onEnterRef.current();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, rootMargin, resetKey]);

  return elementRef;
}
