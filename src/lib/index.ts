export { createRng, seedFromTimestamp } from '@/lib/rng';
export {
  type StackId,
  type Contingency,
  type StackCard,
  CONTINGENCIES,
  STACK_COUNT,
  DECK_SIZE_PER_STACK,
  TOTAL_TURNS,
  TOTAL_CARDS,
  GAME_DURATION_MS,
  ADVANTAGEOUS_STACKS,
  DISADVANTAGEOUS_STACKS,
  buildDeck,
} from '@/lib/protocol';
export {
  type TurnEvent,
  type GameState,
  createGame,
  draw,
  canDraw,
  remaining,
  tick,
} from '@/lib/gameEngine';
export { type ScoreSummary, summarize, cumulativeNet } from '@/lib/scoring';
export * from './dataAccess';
export { supabase, getSupabase, type Supabase } from './supabaseClient';
export {
  exportSessions,
  downloadWorkbook,
  exportSessionsToFile,
  type ExportLocale,
  type SessionExportRow,
} from './export';
