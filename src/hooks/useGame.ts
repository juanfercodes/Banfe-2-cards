import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type GameState,
  type StackId,
  canDraw as engineCanDraw,
  createGame,
  draw as engineDraw,
  remaining as engineRemaining,
  tick as engineTick,
} from '@/lib/gameEngine';
import { DECK_SIZE_PER_STACK, GAME_DURATION_MS, TOTAL_TURNS } from '@/lib/protocol';
import { type ScoreSummary, summarize } from '@/lib/scoring';

export interface UseGameOptions {
  totalTurns?: number | undefined;
  deckSizePerStack?: number | undefined;
  maxDurationMs?: number | undefined;
}

export interface UseGameResult {
  state: GameState;
  summary: ScoreSummary;
  isFinished: boolean;
  draw: (stack: StackId) => void;
  reset: () => void;
  canDraw: (stack: StackId) => boolean;
  remaining: (stack: StackId) => number;
}

const TICK_MS = 1000;

export function useGame(options: UseGameOptions = {}): UseGameResult {
  const {
    totalTurns = TOTAL_TURNS,
    deckSizePerStack = DECK_SIZE_PER_STACK,
    maxDurationMs = GAME_DURATION_MS,
  } = options;

  const [state, setState] = useState<GameState>(() =>
    createGame({ totalTurns, deckSizePerStack, maxDurationMs }),
  );

  const summary = useMemo(() => summarize(state.events), [state.events]);

  useEffect(() => {
    if (state.status === 'finished') return;

    const id = setInterval(() => {
      setState((prev) => engineTick(prev, TICK_MS));
    }, TICK_MS);

    return () => clearInterval(id);
  }, [state.status]);

  const draw = useCallback((stack: StackId) => {
    setState((prev) => (engineCanDraw(prev, stack) ? engineDraw(prev, stack) : prev));
  }, []);

  const reset = useCallback(() => {
    setState(createGame({ totalTurns, deckSizePerStack, maxDurationMs }));
  }, [totalTurns, deckSizePerStack, maxDurationMs]);

  const canDraw = useCallback((stack: StackId) => engineCanDraw(state, stack), [state]);

  const remaining = useCallback((stack: StackId) => engineRemaining(state, stack), [state]);

  return {
    state,
    summary,
    isFinished: state.status === 'finished',
    draw,
    reset,
    canDraw,
    remaining,
  };
}
