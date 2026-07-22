import { SHORT_BLOCKS, SHORT_TOTAL_TURNS } from '@/lib/protocol';

export function shouldUseShortMode(priorSessionCount: number): boolean {
  return priorSessionCount === 0;
}

export function firstSessionHint(): { totalTurns: number; blocks: number } {
  return { totalTurns: SHORT_TOTAL_TURNS, blocks: SHORT_BLOCKS };
}
