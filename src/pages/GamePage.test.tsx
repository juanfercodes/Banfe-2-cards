import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('first shows the version selector with standard preselected', () => {
    renderPage('/play/p1');

    expect(screen.getByRole('heading', { name: 'Versión de la sesión' })).toBeInTheDocument();
    expect(screen.getByText('Paciente: p1')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Estándar/ })).toBeChecked();
    expect(screen.queryByRole('button', { name: /^Mazo \d:/ })).not.toBeInTheDocument();
  });

  it('starts the default 90/50 game after confirming the selector', async () => {
    const user = userEvent.setup();
    renderPage('/play/p1');

    await user.click(screen.getByRole('button', { name: 'Comenzar sesión' }));

    expect(screen.getByText('Paciente: p1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Mazo \d:/ })).toHaveLength(5);
    expect(screen.getByText('0 / 50')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /quedan 18 cartas/ })).toHaveLength(5);
  });

  it('starts a legacy extended game when selected', async () => {
    const user = userEvent.setup();
    renderPage('/play/p1');

    await user.click(screen.getByRole('radio', { name: /Extendida/ }));
    await user.click(screen.getByRole('button', { name: 'Comenzar sesión' }));

    expect(screen.getByText('0 / 200')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /quedan 40 cartas/ })).toHaveLength(5);
  });

  it('has a restart button once the game starts', async () => {
    const user = userEvent.setup();
    renderPage('/play/p1');
    await user.click(screen.getByRole('button', { name: 'Comenzar sesión' }));
    expect(screen.getByRole('button', { name: 'Reiniciar' })).toBeInTheDocument();
  });
});
