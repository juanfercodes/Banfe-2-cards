import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test/render';

describe('<App />', () => {
  it('redirects an unauthenticated visitor from / to /login', async () => {
    renderWithProviders(<App />, { route: '/', withRouter: false });
    expect(await screen.findByRole('tab', { name: /iniciar sesión|sign in/i })).toBeInTheDocument();
  });
});
