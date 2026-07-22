import { describe, expect, it } from 'vitest';
import { canDraw, createGame, draw, remaining, tick } from '@/lib/gameEngine';
import type { GameState, StackId } from '@/lib/gameEngine';
import { DECK_SIZE_PER_STACK, GAME_DURATION_MS, TOTAL_TURNS } from '@/lib/protocol';

function playFullGame(
  opts: { totalTurns?: number; deckSizePerStack?: number; maxDurationMs?: number } = {},
): GameState {
  let state = createGame(opts);
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
  it('defaults to the 90/50 version: 5 decks of 18 cards', () => {
    const state = createGame();
    for (const s of [1, 2, 3, 4, 5] as StackId[]) {
      expect(remaining(state, s)).toBe(18);
    }
    expect(state.totalTurns).toBe(50);
    expect(state.deckSizePerStack).toBe(DECK_SIZE_PER_STACK);
  });

  it('starts with idle status', () => {
    const state = createGame();
    expect(state.status).toBe('idle');
  });

  it('starts with full time remaining', () => {
    const state = createGame();
    expect(state.timeRemainingMs).toBe(GAME_DURATION_MS);
    expect(state.maxDurationMs).toBe(GAME_DURATION_MS);
  });

  it('starts with zero running total and no events', () => {
    const state = createGame();
    expect(state.runningTotal).toBe(0);
    expect(state.events).toHaveLength(0);
    expect(state.turn).toBe(0);
  });
});

describe('draw', () => {
  it('is immutable — previous state untouched', () => {
    const before = createGame();
    const snapshot: GameState = JSON.parse(JSON.stringify(before)) as GameState;
    draw(before, 1);
    expect(before).toEqual(snapshot);
  });

  it('advances turn and appends an event', () => {
    let state = createGame();
    state = draw(state, 1);
    expect(state.turn).toBe(1);
    expect(state.events).toHaveLength(1);
    expect(state.status).toBe('playing');
  });

  it('event has correct structure', () => {
    let state = createGame();
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
    let state = createGame();
    const stacks: StackId[] = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      state = draw(state, stacks[i % 5]!);
      const sumNets = state.events.reduce((acc, e) => acc + e.net, 0);
      expect(state.runningTotal).toBe(sumNets);
    }
  });

  it('a standard game ends finished with exactly 50 events, decks not exhausted', () => {
    const state = playFullGame();
    expect(state.status).toBe('finished');
    expect(state.events).toHaveLength(TOTAL_TURNS);
    const cardsLeft = ([1, 2, 3, 4, 5] as StackId[]).reduce((n, s) => n + remaining(state, s), 0);
    expect(cardsLeft).toBe(90 - 50);
  });

  it('determinism — same draw sequence → identical events', () => {
    const seq: StackId[] = [];
    let s1 = createGame();
    const stacks: StackId[] = [1, 2, 3, 4, 5];
    for (let i = 0; i < 20; i++) {
      const st = stacks[i % 5]!;
      seq.push(st);
      s1 = draw(s1, st);
    }

    let s2 = createGame();
    for (const st of seq) {
      s2 = draw(s2, st);
    }

    expect(s2.events).toEqual(s1.events);
  });

  it('a single stack exhausts after 18 draws and further draws are rejected', () => {
    let state = createGame();
    for (let i = 0; i < 18; i++) {
      state = draw(state, 1);
    }
    expect(remaining(state, 1)).toBe(0);
    expect(state.status).toBe('playing');
    expect(() => draw(state, 1)).toThrow();
    expect(canDraw(state, 2)).toBe(true);
  });

  it('drawing after finished is rejected', () => {
    const state = playFullGame();
    expect(state.status).toBe('finished');
    expect(() => draw(state, 1)).toThrow();
  });

  it('transitions from idle to playing on first draw', () => {
    let state = createGame();
    expect(state.status).toBe('idle');
    state = draw(state, 1);
    expect(state.status).toBe('playing');
  });
});

describe('canDraw', () => {
  it('returns true for a stack with remaining cards', () => {
    const state = createGame();
    expect(canDraw(state, 1)).toBe(true);
  });

  it('returns false for an exhausted stack while the game continues', () => {
    let state = createGame();
    for (let i = 0; i < 18; i++) {
      state = draw(state, 1);
    }
    expect(canDraw(state, 1)).toBe(false);
    expect(state.status).toBe('playing');
  });

  it('returns false when game is finished', () => {
    const state = playFullGame();
    expect(canDraw(state, 1)).toBe(false);
  });
});

describe('remaining', () => {
  it('decreases after a draw', () => {
    let state = createGame();
    expect(remaining(state, 1)).toBe(18);
    state = draw(state, 1);
    expect(remaining(state, 1)).toBe(17);
  });
});

describe('tick', () => {
  it('reduces time remaining', () => {
    let state = createGame();
    state = tick(state, 1000);
    expect(state.timeRemainingMs).toBe(GAME_DURATION_MS - 1000);
  });

  it('does not go below zero', () => {
    let state = createGame();
    state = tick(state, GAME_DURATION_MS + 1000);
    expect(state.timeRemainingMs).toBe(0);
  });

  it('finishes the game when time runs out', () => {
    let state = createGame();
    state = tick(state, GAME_DURATION_MS);
    expect(state.status).toBe('finished');
  });

  it('has no effect once finished', () => {
    let state = createGame();
    state = tick(state, GAME_DURATION_MS);
    const finished = state;
    state = tick(state, 10000);
    expect(state).toEqual(finished);
  });
});
