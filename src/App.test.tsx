import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('<App />', () => {
  it('renders the dashboard placeholder route', async () => {
    render(<App />);
    expect(await screen.findByText('Página en construcción')).toBeInTheDocument();
  });
});
