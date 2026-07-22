import { describe, expect, it } from 'vitest';
import {
  ADVANTAGEOUS_STACKS,
  CONTINGENCIES,
  DECK_SIZE_PER_STACK,
  DISADVANTAGEOUS_STACKS,
  GAME_DURATION_MS,
  STACK_COUNT,
  TOTAL_CARDS,
  TOTAL_TURNS,
  buildDeck,
} from '@/lib/protocol';

describe('CONTINGENCIES', () => {
  it('has exactly 5 entries', () => {
    expect(CONTINGENCIES).toHaveLength(5);
  });

  it('matches the T8 deterministic penalty schedule verbatim', () => {
    expect(CONTINGENCIES[0]).toEqual({
      stack: 1,
      reward: 1,
      penalty: -2,
      penaltyPositions: [5, 14],
    });
    expect(CONTINGENCIES[1]).toEqual({
      stack: 2,
      reward: 2,
      penalty: -3,
      penaltyPositions: [4, 8, 12, 16],
    });
    expect(CONTINGENCIES[2]).toEqual({
      stack: 3,
      reward: 3,
      penalty: -5,
      penaltyPositions: [3, 6, 9, 12, 15, 18],
    });
    expect(CONTINGENCIES[3]).toEqual({
      stack: 4,
      reward: 4,
      penalty: -8,
      penaltyPositions: [2, 4, 6, 8, 10, 12, 14, 16, 18],
    });
    expect(CONTINGENCIES[4]).toEqual({
      stack: 5,
      reward: 5,
      penalty: -12,
      penaltyPositions: [2, 4, 5, 7, 9, 10, 12, 14, 15, 17],
    });
  });
});

describe('single game constants', () => {
  it('STACK_COUNT is 5', () => {
    expect(STACK_COUNT).toBe(5);
  });

  it('DECK_SIZE_PER_STACK is 18', () => {
    expect(DECK_SIZE_PER_STACK).toBe(18);
  });

  it('TOTAL_TURNS is 50', () => {
    expect(TOTAL_TURNS).toBe(50);
  });

  it('TOTAL_CARDS is 90', () => {
    expect(TOTAL_CARDS).toBe(90);
  });

  it('GAME_DURATION_MS is 5 minutes', () => {
    expect(GAME_DURATION_MS).toBe(5 * 60 * 1000);
  });
});

describe('constants', () => {
  it('ADVANTAGEOUS_STACKS is [1, 2]', () => {
    expect(ADVANTAGEOUS_STACKS).toEqual([1, 2]);
  });

  it('DISADVANTAGEOUS_STACKS is [4, 5]', () => {
    expect(DISADVANTAGEOUS_STACKS).toEqual([4, 5]);
  });
});

describe('buildDeck', () => {
  it('produces exactly 18 cards per deck', () => {
    for (const stack of [1, 2, 3, 4, 5] as const) {
      expect(buildDeck(stack)).toHaveLength(18);
    }
  });

  it('every card carries the correct stack and reward', () => {
    const deck = buildDeck(3);
    for (const card of deck) {
      expect(card.stack).toBe(3);
      expect(card.reward).toBe(3);
    }
  });

  it('places penalties at the exact schedule positions', () => {
    const deck = buildDeck(4);
    const penalizedPositions = deck
      .map((card, index) => (card.hasPenalty ? index + 1 : null))
      .filter((p): p is number => p !== null);
    expect(penalizedPositions).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18]);
  });

  it('penalized cards carry the correct penalty value', () => {
    const deck = buildDeck(5);
    for (const card of deck) {
      if (card.hasPenalty) {
        expect(card.penalty).toBe(-12);
      } else {
        expect(card.penalty).toBe(0);
      }
    }
  });

  it('is deterministic — same stack always yields the same deck', () => {
    expect(buildDeck(2)).toEqual(buildDeck(2));
  });
});
