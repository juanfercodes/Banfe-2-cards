import { type StackCard, type StackId, DECK_SIZE_PER_STACK, GAME_DURATION_MS, TOTAL_TURNS, buildDeck } from '@/lib/protocol';

export type { StackId } from '@/lib/protocol';

export type TurnEvent = {
  turn: number;
  stack: StackId;
  reward: number;
  hadPenalty: boolean;
  penalty: number;
  net: number;
  runningTotal: number;
};

export type GameState = {
  turn: number;
  totalTurns: number;
  deckSizePerStack: number;
  runningTotal: number;
  decks: Record<StackId, StackCard[]>;
  events: TurnEvent[];
  status: 'idle' | 'playing' | 'finished';
  maxDurationMs: number;
  timeRemainingMs: number;
};

const ALL_STACKS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function createGame(
  opts: {
    totalTurns?: number;
    deckSizePerStack?: number;
    maxDurationMs?: number;
  } = {},
): GameState {
  const totalTurns = opts.totalTurns ?? TOTAL_TURNS;
  const deckSizePerStack = opts.deckSizePerStack ?? DECK_SIZE_PER_STACK;
  const maxDurationMs = opts.maxDurationMs ?? GAME_DURATION_MS;

  const decks = {} as Record<StackId, StackCard[]>;
  for (const stack of ALL_STACKS) {
    decks[stack] = buildDeck(stack).slice(0, deckSizePerStack);
  }

  return {
    turn: 0,
    totalTurns,
    deckSizePerStack,
    runningTotal: 0,
    decks,
    events: [],
    status: 'idle',
    maxDurationMs,
    timeRemainingMs: maxDurationMs,
  };
}

export function canDraw(state: GameState, stack: StackId): boolean {
  if (state.status === 'finished') return false;
  return state.decks[stack].length > 0;
}

export function remaining(state: GameState, stack: StackId): number {
  return state.decks[stack].length;
}

export function draw(state: GameState, stack: StackId): GameState {
  if (state.status === 'finished') {
    throw new Error('Cannot draw: game is finished');
  }

  const deck = state.decks[stack];
  if (deck.length === 0) {
    throw new Error(`Cannot draw: stack ${stack} is empty`);
  }

  const card = deck[0]!;
  const penalty = card.hasPenalty ? card.penalty : 0;
  const net = card.reward + penalty;
  const newRunningTotal = state.runningTotal + net;
  const newTurn = state.turn + 1;

  const event: TurnEvent = {
    turn: newTurn,
    stack,
    reward: card.reward,
    hadPenalty: card.hasPenalty,
    penalty,
    net,
    runningTotal: newRunningTotal,
  };

  const newDecks = { ...state.decks };
  newDecks[stack] = deck.slice(1);

  const allEmpty = ALL_STACKS.every((s) => newDecks[s].length === 0);
  const reachedTotalTurns = newTurn >= state.totalTurns;
  const newStatus: GameState['status'] = reachedTotalTurns || allEmpty ? 'finished' : 'playing';

  return {
    turn: newTurn,
    totalTurns: state.totalTurns,
    deckSizePerStack: state.deckSizePerStack,
    runningTotal: newRunningTotal,
    decks: newDecks,
    events: [...state.events, event],
    status: newStatus,
    maxDurationMs: state.maxDurationMs,
    timeRemainingMs: state.timeRemainingMs,
  };
}

export function tick(state: GameState, deltaMs: number): GameState {
  if (state.status === 'finished') return state;

  const timeRemainingMs = Math.max(state.timeRemainingMs - deltaMs, 0);
  const status: GameState['status'] = timeRemainingMs === 0 ? 'finished' : state.status;

  return {
    ...state,
    timeRemainingMs,
    status,
  };
}
