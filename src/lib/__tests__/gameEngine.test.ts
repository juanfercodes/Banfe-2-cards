import { describe, expect, it } from 'vitest';
import {
  canDraw,
  createGame,
  draw,
  remaining,
} from '@/lib/gameEngine';
import type { GameState, StackId } from '@/lib/gameEngine';
import {
  DECK_SIZE,
  SHORT_TOTAL_TURNS,
  TOTAL_TURNS,
} from '@/lib/protocol';

function playFullGame(totalTurns = TOTAL_TURNS, seed = 42): GameState {
  let state = createGame({ totalTurns, seed });
  const stacks: StackId[] = [1, 2, 3, 4, 5];
  let idx = 0;
  while (state.status === 'playing' || state.status === 'idle') {
    const stack = stacks[idx % 5]!;
    if (!canDraw(state, stack)) {
      const available = stacks.find((s) => canDraw(state, s));
      if (!available) break;
      state = draw(state, available);
    } else {
      state = draw(state, stack);
    }
    idx++;
  }
  return state;
}

describe('createGame', () => {
  it('builds 5 non-empty decks', () => {
    const state = createGame({ seed: 1 });
    for (const s of [1, 2, 3, 4, 5] as StackId[]) {
      expect(remaining(state, s)).toBe(DECK_SIZE);
    }
  });

  it('starts with idle status', () => {
    const state = createGame({ seed: 1 });
    expect(state.status).toBe('idle');
  });

  it('stores the seed', () => {
    const state = createGame({ seed: 999 });
    expect(state.seed).toBe(999);
  });

  it('defaults to TOTAL_TURNS', () => {
    const state = createGame({ seed: 1 });
    expect(state.totalTurns).toBe(TOTAL_TURNS);
  });

  it('accepts custom totalTurns', () => {
    const state = createGame({ totalTurns: SHORT_TOTAL_TURNS, seed: 1 });
    expect(state.totalTurns).toBe(SHORT_TOTAL_TURNS);
  });

  it('starts with zero running total and no events', () => {
    const state = createGame({ seed: 1 });
    expect(state.runningTotal).toBe(0);
    expect(state.events).toHaveLength(0);
    expect(state.turn).toBe(0);
  });
});

describe('draw', () => {
  it('is immutable — previous state untouched', () => {
    const before = createGame({ seed: 42 });
    const snapshot: GameState = JSON.parse(JSON.stringify(before)) as GameState;
    draw(before, 1);
    expect(before).toEqual(snapshot);
  });

  it('advances turn and appends an event', () => {
    let state = createGame({ seed: 42 });
    state = draw(state, 1);
    expect(state.turn).toBe(1);
    expect(state.events).toHaveLength(1);
    expect(state.status).toBe('playing');
  });

  it('event has correct structure', () => {
    let state = createGame({ seed: 42 });
    state = draw(state, 1);
    const ev = state.events[0]!;
    expect(ev.turn).toBe(1);
    expect(ev.stack).toBe(1);
    expect(ev.reward).toBe(1);
    expect(typeof ev.hadPenalty).toBe('boolean');
    expect(typeof ev.penalty).toBe('number');
    expect(typeof ev.net).toBe('number');
    expect(typeof ev.runningTotal).toBe('number');
  });

  it('running total equals sum of event nets at every step', () => {
    let state = createGame({ seed: 42 });
    const stacks: StackId[] = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      state = draw(state, stacks[i % 5]!);
      const sumNets = state.events.reduce((acc, e) => acc + e.net, 0);
      expect(state.runningTotal).toBe(sumNets);
    }
  });

  it('a full 200-turn game ends in finished with exactly TOTAL_TURNS events', () => {
    const state = playFullGame();
    expect(state.status).toBe('finished');
    expect(state.events).toHaveLength(TOTAL_TURNS);
  });

  it('determinism — same seed + same draw sequence → identical events', () => {
    const seq: StackId[] = [];
    let s1 = createGame({ seed: 42 });
    const stacks: StackId[] = [1, 2, 3, 4, 5];
    for (let i = 0; i < 20; i++) {
      const st = stacks[i % 5]!;
      seq.push(st);
      s1 = draw(s1, st);
    }

    let s2 = createGame({ seed: 42 });
    for (const st of seq) {
      s2 = draw(s2, st);
    }

    expect(s2.events).toEqual(s1.events);
  });

  it('drawing from an empty stack is rejected', () => {
    let state = createGame({ totalTurns: SHORT_TOTAL_TURNS, seed: 42 });
    for (let i = 0; i < DECK_SIZE; i++) {
      state = draw(state, 1);
    }
    expect(remaining(state, 1)).toBe(0);
    expect(() => draw(state, 1)).toThrow();
  });

  it('drawing after finished is rejected', () => {
    const state = playFullGame();
    expect(state.status).toBe('finished');
    expect(() => draw(state, 1)).toThrow();
  });

  it('stack 1 never has penalties', () => {
    let state = createGame({ seed: 42 });
    for (let i = 0; i < DECK_SIZE; i++) {
      state = draw(state, 1);
    }
    const penalties = state.events.filter((e) => e.hadPenalty);
    expect(penalties).toHaveLength(0);
  });

  it('transitions from idle to playing on first draw', () => {
    let state = createGame({ seed: 42 });
    expect(state.status).toBe('idle');
    state = draw(state, 1);
    expect(state.status).toBe('playing');
  });
});

describe('canDraw', () => {
  it('returns true for a stack with remaining cards', () => {
    const state = createGame({ seed: 42 });
    expect(canDraw(state, 1)).toBe(true);
  });

  it('returns false for an exhausted stack', () => {
    let state = createGame({ totalTurns: SHORT_TOTAL_TURNS, seed: 42 });
    for (let i = 0; i < DECK_SIZE; i++) {
      state = draw(state, 1);
    }
    expect(canDraw(state, 1)).toBe(false);
  });

  it('returns false when game is finished', () => {
    const state = playFullGame();
    expect(canDraw(state, 1)).toBe(false);
  });
});

describe('remaining', () => {
  it('decreases after a draw', () => {
    let state = createGame({ seed: 42 });
    expect(remaining(state, 1)).toBe(DECK_SIZE);
    state = draw(state, 1);
    expect(remaining(state, 1)).toBe(DECK_SIZE - 1);
  });
});

describe('easy mode (SHORT_TOTAL_TURNS)', () => {
  it('finishes at 100 turns', () => {
    const state = playFullGame(SHORT_TOTAL_TURNS);
    expect(state.status).toBe('finished');
    expect(state.events).toHaveLength(SHORT_TOTAL_TURNS);
  });
});
