import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    await Promise.resolve(password);
    setUser({ id: 'placeholder', email });
  }, []);

  const logout = useCallback(async () => {
    await Promise.resolve();
    setUser(null);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    await Promise.resolve(password);
    setUser({ id: 'placeholder', email });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      signup,
    }),
    [user, login, logout, signup],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
