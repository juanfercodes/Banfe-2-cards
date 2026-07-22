import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function canQuery(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => (canQuery() ? window.matchMedia(QUERY).matches : false));

  useEffect(() => {
    if (!canQuery()) return undefined;
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);
    const onChange = (event: MediaQueryListEvent | { matches: boolean }) => {
      setReduced(event.matches);
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    return undefined;
  }, []);

  return reduced;
}
