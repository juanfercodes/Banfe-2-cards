import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DiscardPile } from './DiscardPile';
import type { TurnEvent } from '@/lib/gameEngine';
import { renderWithProviders } from '../../test/render';

function makeEvent(turn: number, hadPenalty: boolean): TurnEvent {
  return {
    turn,
    stack: 4,
    reward: 4,
    hadPenalty,
    penalty: hadPenalty ? -6 : 0,
    net: hadPenalty ? -2 : 4,
    runningTotal: 0,
  };
}

describe('<DiscardPile />', () => {
  it('announces an empty pile in the sr-only summary', () => {
    renderWithProviders(<DiscardPile stack={4} events={[]} />, { withRouter: false });
    expect(screen.getByTestId('discard-pile-summary-4')).toHaveTextContent(
      'Mazo 4: 0 cartas robadas, 0 con penalización',
    );
  });

  it('accumulates drawn cards: count and penalties in the summary', () => {
    const events = [makeEvent(1, false), makeEvent(2, true), makeEvent(3, true)];
    renderWithProviders(<DiscardPile stack={4} events={events} />, { withRouter: false });

    expect(screen.getByTestId('discard-pile-summary-4')).toHaveTextContent(
      'Mazo 4: 3 cartas robadas, 2 con penalización',
    );
  });

  it('shows the visible count badge and the penalty badge', () => {
    const events = [makeEvent(1, false), makeEvent(2, true)];
    renderWithProviders(<DiscardPile stack={4} events={events} />, { withRouter: false });

    expect(screen.getByTestId('discard-pile-4').textContent).toContain('2');
    expect(screen.getByTestId('discard-pile-penalties-4')).toHaveTextContent('1');
  });

  it('shows the last drawn card face-up with its reward', () => {
    const events = [makeEvent(1, false), makeEvent(2, true)];
    renderWithProviders(<DiscardPile stack={4} events={events} />, { withRouter: false });

    expect(screen.getByTestId('card-reward')).toHaveTextContent('+4');
    expect(screen.getByTestId('penalty-chip')).toHaveTextContent('-6');
  });

  it('renders no penalty badge when no penalty hit', () => {
    renderWithProviders(<DiscardPile stack={4} events={[makeEvent(1, false)]} />, {
      withRouter: false,
    });
    expect(screen.queryByTestId('discard-pile-penalties-4')).not.toBeInTheDocument();
  });
});
