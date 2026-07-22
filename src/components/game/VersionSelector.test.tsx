import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VersionSelector } from './VersionSelector';
import { renderWithProviders } from '../../test/render';

describe('<VersionSelector />', () => {
  it('lists the three versions with card/turn details', () => {
    renderWithProviders(<VersionSelector onStart={vi.fn()} />, { withRouter: false });

    expect(screen.getByRole('radio', { name: /Estándar/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Extendida/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Corta/ })).toBeInTheDocument();
    expect(screen.getByText('90 cartas · 50 turnos')).toBeInTheDocument();
    expect(screen.getByText('200 cartas · 200 turnos')).toBeInTheDocument();
    expect(screen.getByText('200 cartas · 100 turnos')).toBeInTheDocument();
  });

  it('preselects the standard version', () => {
    renderWithProviders(<VersionSelector onStart={vi.fn()} />, { withRouter: false });
    expect(screen.getByRole('radio', { name: /Estándar/ })).toBeChecked();
  });

  it('starts with the standard 90/50 version by default', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<VersionSelector onStart={onStart} />, { withRouter: false });

    await user.click(screen.getByRole('button', { name: 'Comenzar sesión' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'standard', deckSizePerStack: 18, totalTurns: 50 }),
    );
  });

  it('starts with another version after selecting it', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<VersionSelector onStart={onStart} />, { withRouter: false });

    await user.click(screen.getByRole('radio', { name: /Extendida/ }));
    await user.click(screen.getByRole('button', { name: 'Comenzar sesión' }));

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'extended', deckSizePerStack: 40, totalTurns: 200 }),
    );
  });

  it('shows the subtitle when provided', () => {
    renderWithProviders(<VersionSelector subtitle="Paciente: p1" onStart={vi.fn()} />, {
      withRouter: false,
    });
    expect(screen.getByText('Paciente: p1')).toBeInTheDocument();
  });
});
