import { describe, expect, it } from 'vitest';
import {
  ADVANTAGEOUS_STACKS,
  CONTINGENCIES,
  DEFAULT_GAME_VERSION,
  DISADVANTAGEOUS_STACKS,
  GAME_VERSIONS,
  STACK_COUNT,
  buildDeck,
  getGameVersion,
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

describe('game versions', () => {
  it('defines exactly the standard, extended and short presets', () => {
    expect(GAME_VERSIONS.map((v) => v.id)).toEqual(['standard', 'extended', 'short']);
  });

  it('standard is the 90-card / 50-draw game', () => {
    const standard = getGameVersion('standard');
    expect(standard.deckSizePerStack).toBe(18);
    expect(standard.totalTurns).toBe(50);
    expect(standard.deckSizePerStack * STACK_COUNT).toBe(90);
  });

  it('the player draws fewer cards than the 90 in play', () => {
    const standard = getGameVersion('standard');
    expect(standard.totalTurns).toBeLessThan(standard.deckSizePerStack * STACK_COUNT);
  });

  it('standard is the default version', () => {
    expect(DEFAULT_GAME_VERSION.id).toBe('standard');
  });

  it('extended is the legacy 200-turn game', () => {
    const extended = getGameVersion('extended');
    expect(extended.deckSizePerStack).toBe(40);
    expect(extended.totalTurns).toBe(200);
  });

  it('short is the legacy 100-turn game', () => {
    const short = getGameVersion('short');
    expect(short.deckSizePerStack).toBe(40);
    expect(short.totalTurns).toBe(100);
  });

  it('every version has an i18n label key', () => {
    for (const version of GAME_VERSIONS) {
      expect(version.labelKey).toMatch(/^game\.version\./);
    }
  });

  it('getGameVersion throws for an unknown id', () => {
    expect(() => getGameVersion('bogus' as never)).toThrow();
  });
});

describe('constants', () => {
  it('STACK_COUNT is 5', () => {
    expect(STACK_COUNT).toBe(5);
  });

  it('ADVANTAGEOUS_STACKS is [1, 2]', () => {
    expect(ADVANTAGEOUS_STACKS).toEqual([1, 2]);
  });

  it('DISADVANTAGEOUS_STACKS is [4, 5]', () => {
    expect(DISADVANTAGEOUS_STACKS).toEqual([4, 5]);
  });
});

describe('buildDeck', () => {
  it('produces exactly the requested number of cards', () => {
    const rng = createRng(42);
    expect(buildDeck(1, 18, rng)).toHaveLength(18);
    expect(buildDeck(1, 40, rng)).toHaveLength(40);
  });

  it('every card carries the correct stack and reward', () => {
    const rng = createRng(42);
    const deck = buildDeck(3, 18, rng);
    for (const card of deck) {
      expect(card.stack).toBe(3);
      expect(card.reward).toBe(3);
    }
  });

  it('stack 1 (prob 0) has no penalties', () => {
    const rng = createRng(42);
    const deck = buildDeck(1, 18, rng);
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
    const deck = buildDeck(4, 18, rng);
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
    const a = buildDeck(2, 18, createRng(77));
    const b = buildDeck(2, 18, createRng(77));
    expect(a).toEqual(b);
  });
});
