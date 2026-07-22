import { describe, expect, it } from 'vitest';

import type { ScoreSummary } from '@/lib/scoring';

import { computeTendency, computeTrend, interpret } from './interpret';

function baseSummary(overrides: Partial<ScoreSummary> = {}): ScoreSummary {
  return {
    totalNet: 0,
    perStack: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    penalizations: 0,
    advantageDisadvantageIndex: 0,
    drawsPerStack: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    ...overrides,
  };
}

describe('computeTendency', () => {
  it('returns advantageous when the index favors low stacks', () => {
    expect(computeTendency(10)).toBe('advantageous');
  });

  it('returns disadvantageous when the index favors high stacks', () => {
    expect(computeTendency(-10)).toBe('disadvantageous');
  });

  it('returns neutral when the index is zero', () => {
    expect(computeTendency(0)).toBe('neutral');
  });
});

describe('computeTrend (cumulative net series)', () => {
  it('returns stable when both halves gain the same', () => {
    expect(computeTrend([1, 2, 3, 4])).toBe('stable');
  });

  it('returns improving when the second half gains more', () => {
    expect(computeTrend([-5, -10, -5, 10])).toBe('improving');
  });

  it('returns declining when the second half gains less', () => {
    expect(computeTrend([10, 20, 15, 5])).toBe('declining');
  });

  it('returns stable for an empty or single-point series', () => {
    expect(computeTrend([])).toBe('stable');
    expect(computeTrend([5])).toBe('stable');
  });
});

describe('interpret', () => {
  it('reports an advantageous tendency for a summary favoring low stacks', () => {
    const result = interpret(baseSummary({ advantageDisadvantageIndex: 8 }), [1, 2, 3, 4]);
    expect(result.tendency).toBe('advantageous');
    expect(result.textKey).toBe('results.interpretation.advantageous_stable');
  });

  it('reports a disadvantageous tendency for a summary favoring high stacks', () => {
    const result = interpret(baseSummary({ advantageDisadvantageIndex: -8 }), [1, 2, 3, 4]);
    expect(result.tendency).toBe('disadvantageous');
    expect(result.textKey).toBe('results.interpretation.disadvantageous_stable');
  });

  it('combines tendency and trend into the textKey', () => {
    const result = interpret(baseSummary({ advantageDisadvantageIndex: 8 }), [-5, -8, 0, 10]);
    expect(result.trend).toBe('improving');
    expect(result.textKey).toBe('results.interpretation.advantageous_improving');
  });
});
