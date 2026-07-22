import { GameContext } from './GameContext';
import { useGame } from '@/hooks/useGame';

export interface GameProviderProps {
  totalTurns?: number | undefined;
  deckSizePerStack?: number | undefined;
  maxDurationMs?: number | undefined;
  children: React.ReactNode;
}

export function GameProvider({ totalTurns, deckSizePerStack, maxDurationMs, children }: GameProviderProps) {
  const game = useGame({ totalTurns, deckSizePerStack, maxDurationMs });
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}
