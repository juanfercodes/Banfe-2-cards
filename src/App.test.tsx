import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test/render';

describe('<App />', () => {
  it('renders the dashboard placeholder route', async () => {
    renderWithProviders(<App />, { route: '/', withRouter: false });
    expect(await screen.findByText('Página en construcción')).toBeInTheDocument();
  });
});
