import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock('./useAuth', () => ({ useAuth: useAuthMock }));

import { I18nextProvider } from 'react-i18next';

import i18n from '@/i18n/index';
import { LanguageProvider } from '@/i18n/LanguageProvider';

import { ProtectedRoute } from './ProtectedRoute';

function LoginStub() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from;
  return <div data-testid="login-stub">login:{from?.pathname ?? 'none'}</div>;
}

function renderRoute(initialEntry: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<LoginStub />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>protected content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </I18nextProvider>,
  );
}

describe('<ProtectedRoute />', () => {
  it('renders a centered spinner while auth is loading', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true, signOut: vi.fn() });
    renderRoute('/dashboard');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login preserving the intended location when there is no user', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, signOut: vi.fn() });
    renderRoute('/dashboard');

    expect(screen.getByTestId('login-stub')).toHaveTextContent('login:/dashboard');
  });

  it('renders the outlet when a user is present', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u-1', email: 'doc@clinic.test' },
      loading: false,
      signOut: vi.fn(),
    });
    renderRoute('/dashboard');

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
