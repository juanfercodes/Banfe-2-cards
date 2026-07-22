import { createContext, useContext } from 'react';

import type { UseGameResult } from '@/hooks/useGame';

export const GameContext = createContext<UseGameResult | null>(null);

export function useGameContext(): UseGameResult {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used inside GameProvider');
  }
  return context;
}
