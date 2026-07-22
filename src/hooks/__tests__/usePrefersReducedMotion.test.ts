import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePrefersReducedMotion } from '../usePrefersReducedMotion';

type Listener = (event: { matches: boolean }) => void;

function stubMatchMedia(matches: boolean) {
  const listeners: Listener[] = [];
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_type: string, listener: Listener) => {
      listeners.push(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: Listener) => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
    dispatchEvent: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
  return {
    emit(next: boolean) {
      mql.matches = next;
      for (const listener of [...listeners]) listener({ matches: next });
    },
  };
}

afterEach(() => {
  stubMatchMedia(false);
});

describe('usePrefersReducedMotion', () => {
  it('returns false when the media query does not match', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion: reduce matches', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('reacts to media query changes', () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      media.emit(true);
    });

    expect(result.current).toBe(true);
  });
});
