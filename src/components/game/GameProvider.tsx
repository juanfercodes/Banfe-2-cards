import { GameContext } from './GameContext';
import { useGame } from '@/hooks/useGame';

export interface GameProviderProps {
  totalTurns?: number | undefined;
  deckSizePerStack?: number | undefined;
  seed?: number | undefined;
  children: React.ReactNode;
}

export function GameProvider({ totalTurns, deckSizePerStack, seed, children }: GameProviderProps) {
  const game = useGame({ totalTurns, deckSizePerStack, seed });
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}
