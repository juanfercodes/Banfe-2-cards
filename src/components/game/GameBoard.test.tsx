import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GameBoard } from './GameBoard';
import { GameProvider } from './GameProvider';
import { renderWithProviders } from '../../test/render';

function renderBoard({
  totalTurns,
  deckSizePerStack,
  onFinish,
}: {
  totalTurns?: number;
  deckSizePerStack?: number;
  onFinish?: (summary: unknown, events: unknown) => void;
} = {}) {
  return renderWithProviders(
    <GameProvider totalTurns={totalTurns} deckSizePerStack={deckSizePerStack}>
      <GameBoard onFinish={onFinish} />
    </GameProvider>,
    { route: '/' },
  );
}

describe('<GameBoard />', () => {
  it('renders the five stacks and defaults to the 90/50 game', () => {
    renderBoard();
    const stacks = screen.getAllByRole('button', { name: /^Mazo \d:/ });
    expect(stacks).toHaveLength(5);
    expect(screen.getByText('0 / 50')).toBeInTheDocument();
    expect(screen.getByTestId('timer-value')).toHaveTextContent('05:00');
  });

  it('does not show the running total during play', () => {
    renderBoard();
    expect(screen.queryByTestId('score-value')).not.toBeInTheDocument();
    expect(screen.queryByText(/Puntaje/)).not.toBeInTheDocument();
  });

  it('renders a discard pile per stack, empty at start', () => {
    renderBoard();
    for (const stack of [1, 2, 3, 4, 5]) {
      expect(screen.getByTestId(`discard-pile-summary-${stack}`)).toHaveTextContent(
        `Mazo ${stack}: 0 cartas robadas, 0 con penalización`,
      );
    }
  });

  it('a draw lands on that stack’s discard pile', async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole('button', { name: /^Mazo 1:/ }));

    expect(screen.getByTestId('discard-pile-summary-1')).toHaveTextContent(
      'Mazo 1: 1 carta robada, 0 con penalización',
    );
    expect(screen.getByTestId('discard-pile-summary-2')).toHaveTextContent(
      'Mazo 2: 0 cartas robadas, 0 con penalización',
    );
  });

  it('shows the finish button at isFinished and calls onFinish with summary and events', async () => {
    const onFinish = vi.fn();
    const user = userEvent.setup();
    renderBoard({ totalTurns: 1, onFinish });

    expect(screen.queryByRole('button', { name: 'Ver resultados' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Mazo 1:/ }));

    const finishButton = screen.getByRole('button', { name: 'Ver resultados' });
    await user.click(finishButton);

    expect(onFinish).toHaveBeenCalledTimes(1);
    const [summary, events] = onFinish.mock.calls[0] as [
      { totalNet: number; penalizations: number },
      { turn: number; stack: number; net: number }[],
    ];
    expect(events).toHaveLength(1);
    expect(events[0]!.stack).toBe(1);
    expect(summary.totalNet).toBe(events[0]!.net);
    expect(typeof summary.penalizations).toBe('number');
  });

  it('does not show the final score on the finish card', async () => {
    const user = userEvent.setup();
    renderBoard({ totalTurns: 1 });

    await user.click(screen.getByRole('button', { name: /^Mazo 1:/ }));

    expect(screen.getByRole('button', { name: 'Ver resultados' })).toBeInTheDocument();
    expect(screen.queryByText(/Puntaje final/)).not.toBeInTheDocument();
  });

  it('restart resets the game and empties the discard piles', async () => {
    const user = userEvent.setup();
    renderBoard({ totalTurns: 5 });

    await user.click(screen.getByRole('button', { name: /^Mazo 3:/ }));
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(screen.getByTestId('discard-pile-summary-3')).toHaveTextContent(
      'Mazo 3: 1 carta robada',
    );

    await user.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
    expect(screen.getByTestId('discard-pile-summary-3')).toHaveTextContent(
      'Mazo 3: 0 cartas robadas',
    );
    expect(screen.getByTestId('timer-value')).toHaveTextContent('05:00');
  });

  it('marks a stack as exhausted after drawing its whole 18-card deck', async () => {
    const user = userEvent.setup();
    renderBoard();

    const stack1 = screen.getByRole('button', { name: /^Mazo 1:/ });
    for (let i = 0; i < 18; i++) {
      await user.click(stack1);
    }

    expect(screen.getByRole('button', { name: /^Mazo 1:/ })).toBeDisabled();
    expect(screen.getByText('Vacío')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Mazo 2:/ })).toBeEnabled();
    expect(screen.getByTestId('discard-pile-summary-1')).toHaveTextContent(
      'Mazo 1: 18 cartas robadas',
    );
  });
});
