import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GameBoard } from './GameBoard';
import { GameProvider } from './GameProvider';
import { SHORT_TOTAL_TURNS, TOTAL_TURNS } from '@/lib/protocol';
import { renderWithProviders } from '../../test/render';

function renderBoard({
  totalTurns = TOTAL_TURNS,
  onFinish,
}: {
  totalTurns?: number;
  onFinish?: (summary: unknown, events: unknown, seed: number) => void;
} = {}) {
  return renderWithProviders(
    <GameProvider totalTurns={totalTurns} seed={42}>
      <GameBoard onFinish={onFinish} />
    </GameProvider>,
    { route: '/' },
  );
}

describe('<GameBoard />', () => {
  it('renders the five stacks', () => {
    renderBoard();
    const stacks = screen.getAllByRole('button', { name: /^Mazo \d:/ });
    expect(stacks).toHaveLength(5);
  });

  it('shows the finish button at isFinished and calls onFinish with summary, events and seed', async () => {
    const onFinish = vi.fn();
    const user = userEvent.setup();
    renderBoard({ totalTurns: 1, onFinish });

    expect(screen.queryByRole('button', { name: 'Ver resultados' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Mazo 1:/ }));

    const finishButton = screen.getByRole('button', { name: 'Ver resultados' });
    await user.click(finishButton);

    expect(onFinish).toHaveBeenCalledTimes(1);
    const [summary, events, seed] = onFinish.mock.calls[0] as [
      { totalNet: number; penalizations: number },
      { turn: number; stack: number; net: number }[],
      number,
    ];
    expect(events).toHaveLength(1);
    expect(events[0]!.stack).toBe(1);
    expect(seed).toBe(42);
    expect(summary.totalNet).toBe(events[0]!.net);
    expect(typeof summary.penalizations).toBe('number');
  });

  it('restart resets the game', async () => {
    const user = userEvent.setup();
    renderBoard({ totalTurns: 5 });

    await user.click(screen.getByRole('button', { name: /^Mazo 3:/ }));
    expect(screen.getByText('1 / 5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
  });

  it('shows the short-mode banner only when totalTurns is the short value', () => {
    const { unmount } = renderBoard({ totalTurns: SHORT_TOTAL_TURNS });
    expect(screen.getByText('Primera sesión: versión corta')).toBeInTheDocument();
    unmount();

    renderBoard({ totalTurns: TOTAL_TURNS });
    expect(screen.queryByText('Primera sesión: versión corta')).not.toBeInTheDocument();
  });
});
