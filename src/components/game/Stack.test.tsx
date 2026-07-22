import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Stack } from './Stack';
import type { TurnEvent } from '@/lib/gameEngine';
import { renderWithProviders } from '../../test/render';

const baseProps = {
  stack: 2 as const,
  reward: 2,
  remaining: 40,
  canDraw: true,
  onDraw: vi.fn(),
  lastEvent: null,
};

describe('<Stack />', () => {
  it('exposes an aria-label with stack number, reward and remaining', () => {
    renderWithProviders(<Stack {...baseProps} onDraw={vi.fn()} />, { withRouter: false });
    expect(
      screen.getByRole('button', {
        name: 'Mazo 2: recompensa 2 puntos, quedan 40 cartas',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('40 cartas')).toBeInTheDocument();
  });

  it('click draws a card', async () => {
    const onDraw = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Stack {...baseProps} onDraw={onDraw} />, { withRouter: false });

    await user.click(screen.getByRole('button', { name: /Mazo 2/ }));

    expect(onDraw).toHaveBeenCalledTimes(1);
    expect(onDraw).toHaveBeenCalledWith(2);
  });

  it('is disabled and does not draw when canDraw is false', async () => {
    const onDraw = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <Stack {...baseProps} canDraw={false} remaining={0} onDraw={onDraw} />,
      { withRouter: false },
    );

    const button = screen.getByRole('button', { name: /Mazo 2/ });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onDraw).not.toHaveBeenCalled();
  });

  it('draws with keyboard Enter and Space', async () => {
    const onDraw = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Stack {...baseProps} onDraw={onDraw} />, { withRouter: false });

    const button = screen.getByRole('button', { name: /Mazo 2/ });
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onDraw).toHaveBeenCalledTimes(2);
    expect(onDraw).toHaveBeenNthCalledWith(1, 2);
    expect(onDraw).toHaveBeenNthCalledWith(2, 2);
  });

  it('reveals the drawn card when lastEvent is provided', () => {
    const lastEvent: TurnEvent = {
      turn: 5,
      stack: 2,
      reward: 2,
      hadPenalty: true,
      penalty: -1,
      net: 1,
      runningTotal: 7,
    };
    renderWithProviders(<Stack {...baseProps} remaining={35} lastEvent={lastEvent} />, {
      withRouter: false,
    });

    expect(screen.getByTestId('card-reward')).toHaveTextContent('+2');
    expect(screen.getByTestId('penalty-chip')).toHaveTextContent('-1');
  });

  it('shows the empty state when the pile is exhausted', () => {
    renderWithProviders(
      <Stack {...baseProps} remaining={0} canDraw={false} onDraw={vi.fn()} />,
      { withRouter: false },
    );
    expect(screen.getByText('Vacío')).toBeInTheDocument();
  });
});
