import { GameContext } from './GameContext';
import { useGame } from '@/hooks/useGame';

export interface GameProviderProps {
  totalTurns?: number | undefined;
  seed?: number | undefined;
  children: React.ReactNode;
}

export function GameProvider({ totalTurns, seed, children }: GameProviderProps) {
  const game = useGame({ totalTurns, seed });
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}
