import type { ScoreSummary } from '@/lib/scoring';

export type Tendency = 'advantageous' | 'disadvantageous' | 'neutral';
export type Trend = 'improving' | 'declining' | 'stable';

export interface Interpretation {
  tendency: Tendency;
  trend: Trend;
  textKey: string;
}

export function computeTendency(advantageDisadvantageIndex: number): Tendency {
  if (advantageDisadvantageIndex > 0) return 'advantageous';
  if (advantageDisadvantageIndex < 0) return 'disadvantageous';
  return 'neutral';
}

export function computeTrend(cumulative: number[]): Trend {
  if (cumulative.length < 2) return 'stable';
  const mid = Math.floor(cumulative.length / 2);
  const firstHalfGain = cumulative[mid - 1]!;
  const secondHalfGain = cumulative[cumulative.length - 1]! - firstHalfGain;
  const diff = secondHalfGain - firstHalfGain;
  if (diff > 0) return 'improving';
  if (diff < 0) return 'declining';
  return 'stable';
}

export function interpret(summary: ScoreSummary, cumulative: number[]): Interpretation {
  const tendency = computeTendency(summary.advantageDisadvantageIndex);
  const trend = computeTrend(cumulative);
  return {
    tendency,
    trend,
    textKey: `results.interpretation.${tendency}_${trend}`,
  };
}
