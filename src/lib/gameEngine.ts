import {
  type StackCard,
  type StackId,
  DECK_SIZE,
  TOTAL_TURNS,
  buildDeck,
} from '@/lib/protocol';
import { createRng } from '@/lib/rng';

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
  runningTotal: number;
  decks: Record<StackId, StackCard[]>;
  events: TurnEvent[];
  status: 'idle' | 'playing' | 'finished';
  seed: number;
};

const ALL_STACKS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function createGame(opts: {
  totalTurns?: number;
  seed?: number;
  rng?: () => number;
} = {}): GameState {
  const seed = opts.seed ?? 0;
  const rng = opts.rng ?? createRng(seed);
  const totalTurns = opts.totalTurns ?? TOTAL_TURNS;

  const decks = {} as Record<StackId, StackCard[]>;
  for (const stack of ALL_STACKS) {
    decks[stack] = buildDeck(stack, DECK_SIZE, rng);
  }

  return {
    turn: 0,
    totalTurns,
    runningTotal: 0,
    decks,
    events: [],
    status: 'idle',
    seed,
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

  const card = deck[deck.length - 1]!;
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
  newDecks[stack] = deck.slice(0, -1);

  const allEmpty = ALL_STACKS.every((s) => newDecks[s].length === 0);
  const reachedTotalTurns = newTurn >= state.totalTurns;
  const newStatus: GameState['status'] = reachedTotalTurns || allEmpty ? 'finished' : 'playing';

  return {
    turn: newTurn,
    totalTurns: state.totalTurns,
    runningTotal: newRunningTotal,
    decks: newDecks,
    events: [...state.events, event],
    status: newStatus,
    seed: state.seed,
  };
}
