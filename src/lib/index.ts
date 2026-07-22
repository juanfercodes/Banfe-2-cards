export { createRng, seedFromTimestamp } from '@/lib/rng';
export {
  type StackId,
  type Contingency,
  type StackCard,
  CONTINGENCIES,
  DECK_SIZE,
  TOTAL_TURNS,
  SHORT_TOTAL_TURNS,
  SHORT_BLOCKS,
  BLOCK_SIZE,
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
} from '@/lib/gameEngine';
export { type ScoreSummary, summarize } from '@/lib/scoring';
export * from './dataAccess';
export { supabase, getSupabase, type Supabase } from './supabaseClient';
export { shouldUseShortMode, firstSessionHint } from './onboarding';
export {
  exportSessions,
  downloadWorkbook,
  exportSessionsToFile,
  type ExportLocale,
  type SessionExportRow,
} from './export';
