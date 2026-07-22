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

export function computeTrend(learningCurve: number[]): Trend {
  if (learningCurve.length < 2) return 'stable';
  const first = learningCurve[0]!;
  const last = learningCurve[learningCurve.length - 1]!;
  const diff = last - first;
  if (diff > 0) return 'improving';
  if (diff < 0) return 'declining';
  return 'stable';
}

export function interpret(summary: ScoreSummary): Interpretation {
  const tendency = computeTendency(summary.advantageDisadvantageIndex);
  const trend = computeTrend(summary.learningCurve);
  return {
    tendency,
    trend,
    textKey: `results.interpretation.${tendency}_${trend}`,
  };
}
