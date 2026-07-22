import { describe, expect, it } from 'vitest';
import {
  ADVANTAGEOUS_STACKS,
  BLOCK_SIZE,
  CONTINGENCIES,
  DECK_SIZE,
  DISADVANTAGEOUS_STACKS,
  SHORT_BLOCKS,
  SHORT_TOTAL_TURNS,
  TOTAL_TURNS,
  buildDeck,
} from '@/lib/protocol';
import { createRng } from '@/lib/rng';

describe('CONTINGENCIES', () => {
  it('has exactly 5 entries', () => {
    expect(CONTINGENCIES).toHaveLength(5);
  });

  it('matches §3 row-for-row', () => {
    expect(CONTINGENCIES[0]).toEqual({ stack: 1, reward: 1, penalty: 0, penaltyProbability: 0 });
    expect(CONTINGENCIES[1]).toEqual({
      stack: 2,
      reward: 2,
      penalty: -1,
      penaltyProbability: 0.25,
    });
    expect(CONTINGENCIES[2]).toEqual({ stack: 3, reward: 3, penalty: -3, penaltyProbability: 0.5 });
    expect(CONTINGENCIES[3]).toEqual({ stack: 4, reward: 4, penalty: -6, penaltyProbability: 0.5 });
    expect(CONTINGENCIES[4]).toEqual({
      stack: 5,
      reward: 5,
      penalty: -10,
      penaltyProbability: 0.6,
    });
  });
});

describe('constants', () => {
  it('DECK_SIZE is 40', () => {
    expect(DECK_SIZE).toBe(40);
  });

  it('TOTAL_TURNS is 200', () => {
    expect(TOTAL_TURNS).toBe(200);
  });

  it('SHORT_TOTAL_TURNS is 100', () => {
    expect(SHORT_TOTAL_TURNS).toBe(100);
  });

  it('SHORT_BLOCKS is 2', () => {
    expect(SHORT_BLOCKS).toBe(2);
  });

  it('BLOCK_SIZE is 40', () => {
    expect(BLOCK_SIZE).toBe(40);
  });

  it('ADVANTAGEOUS_STACKS is [1, 2]', () => {
    expect(ADVANTAGEOUS_STACKS).toEqual([1, 2]);
  });

  it('DISADVANTAGEOUS_STACKS is [4, 5]', () => {
    expect(DISADVANTAGEOUS_STACKS).toEqual([4, 5]);
  });
});

describe('buildDeck', () => {
  it('produces DECK_SIZE cards', () => {
    const rng = createRng(42);
    const deck = buildDeck(1, DECK_SIZE, rng);
    expect(deck).toHaveLength(DECK_SIZE);
  });

  it('every card carries the correct stack and reward', () => {
    const rng = createRng(42);
    const deck = buildDeck(3, DECK_SIZE, rng);
    for (const card of deck) {
      expect(card.stack).toBe(3);
      expect(card.reward).toBe(3);
    }
  });

  it('stack 1 (prob 0) has no penalties', () => {
    const rng = createRng(42);
    const deck = buildDeck(1, DECK_SIZE, rng);
    const penalized = deck.filter((c) => c.hasPenalty);
    expect(penalized).toHaveLength(0);
  });

  it('penalty count ≈ penaltyProbability * size within tolerance', () => {
    const rng = createRng(42);
    const size = 400;
    const deck = buildDeck(5, size, rng);
    const penalized = deck.filter((c) => c.hasPenalty).length;
    const expected = 0.6 * size;
    expect(penalized).toBeGreaterThan(expected - 40);
    expect(penalized).toBeLessThan(expected + 40);
  });

  it('penalized cards carry the correct penalty value', () => {
    const rng = createRng(42);
    const deck = buildDeck(4, DECK_SIZE, rng);
    for (const card of deck) {
      if (card.hasPenalty) {
        expect(card.penalty).toBe(-6);
      } else {
        expect(card.penalty).toBe(0);
      }
    }
  });

  it('penalties are spread — no run of > 5 consecutive penalties', () => {
    const rng = createRng(42);
    const deck = buildDeck(5, 400, rng);
    let maxRun = 0;
    let run = 0;
    for (const card of deck) {
      if (card.hasPenalty) {
        run++;
        maxRun = Math.max(maxRun, run);
      } else {
        run = 0;
      }
    }
    expect(maxRun).toBeLessThanOrEqual(5);
  });

  it('is deterministic with the same rng seed', () => {
    const a = buildDeck(2, DECK_SIZE, createRng(77));
    const b = buildDeck(2, DECK_SIZE, createRng(77));
    expect(a).toEqual(b);
  });
});
