import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { summarize } from '@/lib/scoring';
import { GAME_DURATION_MS } from '@/lib/protocol';
import { useGame } from '../useGame';

describe('useGame', () => {
  it('starts idle with the supplied totalTurns', () => {
    const { result } = renderHook(() => useGame({ totalTurns: 10 }));

    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.turn).toBe(0);
    expect(result.current.state.totalTurns).toBe(10);
    expect(result.current.isFinished).toBe(false);
  });

  it('defaults to the standard 90/50 version', () => {
    const { result } = renderHook(() => useGame({}));

    expect(result.current.state.totalTurns).toBe(50);
    expect(result.current.state.deckSizePerStack).toBe(18);
    expect(result.current.remaining(1)).toBe(18);
    expect(result.current.state.maxDurationMs).toBe(GAME_DURATION_MS);
  });

  it('draw updates running total and events immutably', () => {
    const { result } = renderHook(() => useGame({ totalTurns: 10 }));
    const before = result.current.state;

    act(() => {
      result.current.draw(1);
    });

    const after = result.current.state;
    expect(after).not.toBe(before);
    expect(before.events).toHaveLength(0);
    expect(before.turn).toBe(0);
    expect(after.events).toHaveLength(1);
    expect(after.turn).toBe(1);
    expect(after.events[0]!.stack).toBe(1);
    expect(after.runningTotal).toBe(after.events[0]!.runningTotal);
  });

  it('isFinished flips at totalTurns and further draws are no-ops', () => {
    const { result } = renderHook(() => useGame({ totalTurns: 3 }));

    act(() => {
      result.current.draw(1);
      result.current.draw(2);
      result.current.draw(3);
    });

    expect(result.current.isFinished).toBe(true);
    expect(result.current.state.turn).toBe(3);
    expect(result.current.canDraw(1)).toBe(false);

    const finished = result.current.state;
    act(() => {
      result.current.draw(1);
    });

    expect(result.current.state).toBe(finished);
    expect(result.current.state.turn).toBe(3);
    expect(result.current.state.events).toHaveLength(3);
  });

  it('reset produces a fresh idle state', () => {
    const { result } = renderHook(() => useGame({ totalTurns: 5 }));

    act(() => {
      result.current.draw(1);
      result.current.reset();
    });

    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.turn).toBe(0);
    expect(result.current.state.events).toHaveLength(0);
    expect(result.current.state.totalTurns).toBe(5);
    expect(result.current.state.timeRemainingMs).toBe(GAME_DURATION_MS);
  });

  it('is deterministic: same draw sequence yield identical events', () => {
    const sequence = [1, 5, 3, 5, 2, 4, 4, 1] as const;

    const a = renderHook(() => useGame({ totalTurns: 20 }));
    const b = renderHook(() => useGame({ totalTurns: 20 }));

    act(() => {
      for (const stack of sequence) {
        a.result.current.draw(stack);
        b.result.current.draw(stack);
      }
    });

    expect(a.result.current.state.events).toEqual(b.result.current.state.events);
    expect(a.result.current.state.runningTotal).toBe(b.result.current.state.runningTotal);
  });

  it('summary matches summarize(events) after draws', () => {
    const { result } = renderHook(() => useGame({ totalTurns: 10 }));

    act(() => {
      result.current.draw(5);
      result.current.draw(5);
      result.current.draw(1);
    });

    const expected = summarize(result.current.state.events);
    expect(result.current.summary).toEqual(expected);
    expect(result.current.summary.drawsPerStack[5]).toBe(2);
    expect(result.current.summary.drawsPerStack[1]).toBe(1);
  });

  it('canDraw and remaining reflect the current decks', () => {
    const { result } = renderHook(() => useGame({}));

    expect(result.current.canDraw(3)).toBe(true);
    expect(result.current.remaining(3)).toBe(18);

    act(() => {
      result.current.draw(3);
    });

    expect(result.current.remaining(3)).toBe(17);
  });
});
