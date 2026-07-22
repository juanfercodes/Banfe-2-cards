import type { TurnEvent, StackId } from '@/lib/gameEngine';
import { ADVANTAGEOUS_STACKS, BLOCK_SIZE, DISADVANTAGEOUS_STACKS } from '@/lib/protocol';

export type ScoreSummary = {
  totalNet: number;
  perStack: Record<StackId, number>;
  penalizations: number;
  learningCurve: number[];
  advantageDisadvantageIndex: number;
  drawsPerStack: Record<StackId, number>;
};

const ALL_STACKS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function summarize(events: TurnEvent[], totalTurns: number): ScoreSummary {
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

  const blockCount = Math.ceil(totalTurns / BLOCK_SIZE);
  const learningCurve: number[] = Array.from({ length: blockCount }, () => 0);
  for (const ev of events) {
    const blockIdx = Math.floor((ev.turn - 1) / BLOCK_SIZE);
    if (blockIdx >= 0 && blockIdx < blockCount) {
      learningCurve[blockIdx]! += ev.net;
    }
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
    learningCurve,
    advantageDisadvantageIndex: advDraws - disDraws,
    drawsPerStack,
  };
}
