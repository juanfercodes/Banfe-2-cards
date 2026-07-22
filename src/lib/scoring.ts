import type { TurnEvent, StackId } from '@/lib/gameEngine';
import { ADVANTAGEOUS_STACKS, DISADVANTAGEOUS_STACKS } from '@/lib/protocol';

export type ScoreSummary = {
  totalNet: number;
  perStack: Record<StackId, number>;
  penalizations: number;
  advantageDisadvantageIndex: number;
  drawsPerStack: Record<StackId, number>;
};

const ALL_STACKS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function summarize(events: TurnEvent[]): ScoreSummary {
  let totalNet = 0;
  let penalizations = 0;

  const perStack = {} as Record<StackId, number>;
  const drawsPerStack = {} as Record<StackId, number>;
  for (const s of ALL_STACKS) {
    perStack[s] = 0;
    drawsPerStack[s] = 0;
  }

  for (const ev of events) {
    totalNet += ev.net;
    perStack[ev.stack] += ev.net;
    drawsPerStack[ev.stack]++;
    if (ev.hadPenalty) penalizations++;
  }

  let advDraws = 0;
  let disDraws = 0;
  for (const s of ADVANTAGEOUS_STACKS) {
    advDraws += drawsPerStack[s];
  }
  for (const s of DISADVANTAGEOUS_STACKS) {
    disDraws += drawsPerStack[s];
  }

  return {
    totalNet,
    perStack,
    penalizations,
    advantageDisadvantageIndex: advDraws - disDraws,
    drawsPerStack,
  };
}

export function cumulativeNet(events: TurnEvent[]): number[] {
  const series: number[] = [];
  let total = 0;
  for (const ev of events) {
    total += ev.net;
    series.push(total);
  }
  return series;
}
