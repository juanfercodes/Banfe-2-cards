import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { auth: mockAuth },
  getSupabase: () => ({ auth: mockAuth }),
}));

import { useAuth } from '../useAuth';

function makeUser(id: string, email: string) {
  return { id, email, app_metadata: {}, user_metadata: {}, aud: 'authenticated' };
}

function makeSession(user: ReturnType<typeof makeUser>) {
  return {
    access_token: 'at',
    refresh_token: 'rt',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
}

function resetAuthMocks() {
  mockAuth.getSession.mockReset();
  mockAuth.getUser.mockReset();
  mockAuth.signInWithPassword.mockReset();
  mockAuth.signUp.mockReset();
  mockAuth.signOut.mockReset();
  mockAuth.onAuthStateChange.mockReset();
  mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mockAuth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
}

describe('useAuth', () => {
  beforeEach(() => {
    resetAuthMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts in loading state and clears it once the session is known', async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('exposes the signed-in user when a session is present', async () => {
    const user = makeUser('u-1', 'doc@clinic.test');
    const session = makeSession(user);
    mockAuth.getSession.mockResolvedValue({ data: { session }, error: null });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user).toEqual({ id: 'u-1', email: 'doc@clinic.test' });
    expect(result.current.session).toBe(session);
  });

  it('signIn delegates to supabase.auth.signInWithPassword', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signIn('doc@clinic.test', 'pw');
    });
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'doc@clinic.test',
      password: 'pw',
    });
  });

  it('signIn rethrows auth errors', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid credentials', name: 'AuthError' },
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(act(async () => result.current.signIn('x@y.z', 'bad'))).rejects.toThrow(
      'Invalid credentials',
    );
  });

  it('signUp delegates to supabase.auth.signUp', async () => {
    mockAuth.signUp.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signUp('new@clinic.test', 'pw');
    });
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'new@clinic.test',
      password: 'pw',
    });
  });

  it('signOut delegates to supabase.auth.signOut', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signOut();
    });
    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('unsubscribes from onAuthStateChange on unmount', async () => {
    const unsubscribe = vi.fn();
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    const { unmount } = renderHook(() => useAuth());
    await waitFor(() => expect(mockAuth.onAuthStateChange).toHaveBeenCalled());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
