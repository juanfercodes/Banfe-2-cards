import { describe, expect, it } from 'vitest';

import { SHORT_BLOCKS, SHORT_TOTAL_TURNS } from '@/lib/protocol';

import { firstSessionHint, shouldUseShortMode } from '../onboarding';

describe('shouldUseShortMode', () => {
  it('is true when the patient has no prior sessions', () => {
    expect(shouldUseShortMode(0)).toBe(true);
  });

  it('is false once the patient has at least one prior session', () => {
    expect(shouldUseShortMode(1)).toBe(false);
    expect(shouldUseShortMode(5)).toBe(false);
  });
});

describe('firstSessionHint', () => {
  it('returns the short-mode constants from the protocol', () => {
    expect(firstSessionHint()).toEqual({
      totalTurns: SHORT_TOTAL_TURNS,
      blocks: SHORT_BLOCKS,
    });
  });
});
