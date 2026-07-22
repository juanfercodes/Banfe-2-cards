export type StackId = 1 | 2 | 3 | 4 | 5;

export type Contingency = {
  stack: StackId;
  reward: number;
  penalty: number;
  penaltyPositions: readonly number[];
};

export const STACK_COUNT = 5;
export const DECK_SIZE_PER_STACK = 18;
export const TOTAL_TURNS = 50;
export const TOTAL_CARDS = STACK_COUNT * DECK_SIZE_PER_STACK;
export const GAME_DURATION_MS = 5 * 60 * 1000;

export const CONTINGENCIES: readonly Contingency[] = [
  { stack: 1, reward: 1, penalty: -2, penaltyPositions: [5, 14] as const },
  { stack: 2, reward: 2, penalty: -3, penaltyPositions: [4, 8, 12, 16] as const },
  { stack: 3, reward: 3, penalty: -5, penaltyPositions: [3, 6, 9, 12, 15, 18] as const },
  { stack: 4, reward: 4, penalty: -8, penaltyPositions: [2, 4, 6, 8, 10, 12, 14, 16, 18] as const },
  {
    stack: 5,
    reward: 5,
    penalty: -12,
    penaltyPositions: [2, 4, 5, 7, 9, 10, 12, 14, 15, 17] as const,
  },
] as const;

export const ADVANTAGEOUS_STACKS: readonly StackId[] = [1, 2] as const;
export const DISADVANTAGEOUS_STACKS: readonly StackId[] = [4, 5] as const;

export type StackCard = {
  stack: StackId;
  reward: number;
  hasPenalty: boolean;
  penalty: number;
};

export function buildDeck(stack: StackId): StackCard[] {
  const contingency = CONTINGENCIES.find((c) => c.stack === stack);
  if (!contingency) {
    throw new Error(`Unknown stack: ${stack}`);
  }

  return Array.from({ length: DECK_SIZE_PER_STACK }, (_, i) => {
    const position = i + 1;
    const hasPenalty = contingency.penaltyPositions.includes(position);
    return {
      stack,
      reward: contingency.reward,
      hasPenalty,
      penalty: hasPenalty ? contingency.penalty : 0,
    };
  });
}
