import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test/render';

vi.mock('@/lib/dataAccess', async () => {
  const actual = await vi.importActual<typeof import('@/lib/dataAccess')>('@/lib/dataAccess');
  return {
    ...actual,
    listPatients: vi.fn(() => Promise.resolve([])),
    listAllSessions: vi.fn(() => Promise.resolve([])),
  };
});

describe('<App />', () => {
  it('redirects an unauthenticated visitor from / to /login', async () => {
    renderWithProviders(<App />, { route: '/', withRouter: false });
    expect(await screen.findByRole('tab', { name: /iniciar sesión|sign in/i })).toBeInTheDocument();
  });
});
