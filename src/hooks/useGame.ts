import { useCallback, useMemo, useState } from 'react';

import {
  type GameState,
  type StackId,
  canDraw as engineCanDraw,
  createGame,
  draw as engineDraw,
  remaining as engineRemaining,
} from '@/lib/gameEngine';
import { DEFAULT_GAME_VERSION } from '@/lib/protocol';
import { type ScoreSummary, summarize } from '@/lib/scoring';

export interface UseGameOptions {
  totalTurns?: number | undefined;
  deckSizePerStack?: number | undefined;
  seed?: number | undefined;
}

export interface UseGameResult {
  state: GameState;
  summary: ScoreSummary;
  seed: number;
  isFinished: boolean;
  draw: (stack: StackId) => void;
  reset: (seed?: number) => void;
  canDraw: (stack: StackId) => boolean;
  remaining: (stack: StackId) => number;
}

function randomSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}

export function useGame(options: UseGameOptions = {}): UseGameResult {
  const {
    totalTurns = DEFAULT_GAME_VERSION.totalTurns,
    deckSizePerStack = DEFAULT_GAME_VERSION.deckSizePerStack,
    seed,
  } = options;

  const [state, setState] = useState<GameState>(() =>
    createGame({ totalTurns, deckSizePerStack, seed: seed ?? randomSeed() }),
  );

  const summary = useMemo(() => summarize(state.events), [state.events]);

  const draw = useCallback((stack: StackId) => {
    setState((prev) => (engineCanDraw(prev, stack) ? engineDraw(prev, stack) : prev));
  }, []);

  const reset = useCallback(
    (nextSeed?: number) => {
      setState(createGame({ totalTurns, deckSizePerStack, seed: nextSeed ?? randomSeed() }));
    },
    [totalTurns, deckSizePerStack],
  );

  const canDraw = useCallback((stack: StackId) => engineCanDraw(state, stack), [state]);

  const remaining = useCallback((stack: StackId) => engineRemaining(state, stack), [state]);

  return {
    state,
    summary,
    seed: state.seed,
    isFinished: state.status === 'finished',
    draw,
    reset,
    canDraw,
    remaining,
  };
}
