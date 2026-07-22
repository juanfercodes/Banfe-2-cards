import { createContext, useContext } from 'react';

import type { UseAuthResult } from '@/hooks';

export const AuthContext = createContext<UseAuthResult | null>(null);

export function useAuth(): UseAuthResult {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
