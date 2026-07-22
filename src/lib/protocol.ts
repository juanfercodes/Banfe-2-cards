export type StackId = 1 | 2 | 3 | 4 | 5;

export type Contingency = {
  stack: StackId;
  reward: number;
  penalty: number;
  penaltyProbability: number;
};

export const CONTINGENCIES: readonly Contingency[] = [
  { stack: 1, reward: 1, penalty: 0, penaltyProbability: 0 },
  { stack: 2, reward: 2, penalty: -1, penaltyProbability: 0.25 },
  { stack: 3, reward: 3, penalty: -3, penaltyProbability: 0.5 },
  { stack: 4, reward: 4, penalty: -6, penaltyProbability: 0.5 },
  { stack: 5, reward: 5, penalty: -10, penaltyProbability: 0.6 },
] as const;

export const DECK_SIZE = 40;
export const TOTAL_TURNS = 200;
export const SHORT_TOTAL_TURNS = 100;
export const SHORT_BLOCKS = 2;
export const BLOCK_SIZE = 40;

export const ADVANTAGEOUS_STACKS: readonly StackId[] = [1, 2] as const;
export const DISADVANTAGEOUS_STACKS: readonly StackId[] = [4, 5] as const;

export type StackCard = {
  stack: StackId;
  reward: number;
  hasPenalty: boolean;
  penalty: number;
};

export function buildDeck(stack: StackId, size: number = DECK_SIZE, rng: () => number): StackCard[] {
  const contingency = CONTINGENCIES.find((c) => c.stack === stack);
  if (!contingency) {
    throw new Error(`Unknown stack: ${stack}`);
  }

  let penaltyCount = 0;
  for (let i = 0; i < size; i++) {
    if (rng() < contingency.penaltyProbability) penaltyCount++;
  }

  const penaltyFlags = distributePenalties(size, penaltyCount, rng);

  return penaltyFlags.map((hasPenalty) => ({
    stack,
    reward: contingency.reward,
    hasPenalty,
    penalty: hasPenalty ? contingency.penalty : 0,
  }));
}

function distributePenalties(total: number, count: number, rng: () => number): boolean[] {
  const result = new Array<boolean>(total).fill(false);
  if (count <= 0) return result;
  if (count >= total) return result.fill(true);

  const segmentSize = total / count;
  for (let i = 0; i < count; i++) {
    const segStart = Math.floor(i * segmentSize);
    const segEnd = Math.floor((i + 1) * segmentSize);
    const pos = segStart + Math.floor(rng() * (segEnd - segStart));
    let p = pos;
    while (result[p]) {
      p = (p + 1) % total;
    }
    result[p] = true;
  }
  return result;
}
