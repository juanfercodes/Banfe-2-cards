import type { ReactNode } from 'react';

import { useAuth as useSupabaseAuth } from '@/hooks';

import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
