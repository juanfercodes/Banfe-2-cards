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
  it('starts the game directly without a version selector', () => {
    renderPage('/play/p1');

    expect(screen.queryByRole('heading', { name: 'Versión de la sesión' })).not.toBeInTheDocument();
    expect(screen.getByText('Paciente: p1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Mazo \d:/ })).toHaveLength(5);
    expect(screen.getByText('0 / 50')).toBeInTheDocument();
    expect(screen.getByTestId('timer-value')).toHaveTextContent('05:00');
  });

  it('starts the default 90/50 game', () => {
    renderPage('/play/p1');

    expect(screen.getByText('Paciente: p1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Mazo \d:/ })).toHaveLength(5);
    expect(screen.getByText('0 / 50')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /quedan 18 cartas/ })).toHaveLength(5);
  });

  it('has a restart button once the game starts', () => {
    renderPage('/play/p1');
    expect(screen.getByRole('button', { name: 'Reiniciar' })).toBeInTheDocument();
  });

});
