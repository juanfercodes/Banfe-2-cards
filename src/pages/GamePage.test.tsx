import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import GamePage from './GamePage';
import { renderWithProviders } from '../test/render';

function renderPage(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/play/:patientId" element={<GamePage />} />
    </Routes>,
    { route },
  );
}

describe('<GamePage />', () => {
  it('renders the board with the patient label and 5 stacks', () => {
    renderPage('/play/p1');

    expect(screen.getByText('Paciente: p1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Mazo \d:/ })).toHaveLength(5);
    expect(screen.getByText('0 / 200')).toBeInTheDocument();
    expect(screen.queryByText('Primera sesión: versión corta')).not.toBeInTheDocument();
  });

  it('uses the short game and shows the banner with ?short=1', () => {
    renderPage('/play/p1?short=1');

    expect(screen.getByText('Primera sesión: versión corta')).toBeInTheDocument();
    expect(screen.getByText('0 / 100')).toBeInTheDocument();
  });

  it('has a restart button', () => {
    renderPage('/play/p1');
    expect(screen.getByRole('button', { name: 'Reiniciar' })).toBeInTheDocument();
  });
});
