import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ScoreBar } from './ScoreBar';
import { renderWithProviders } from '../../test/render';

describe('<ScoreBar />', () => {
  it('shows the countdown timer and turn counter', () => {
    renderWithProviders(<ScoreBar timeRemainingMs={3 * 60 * 1000 + 45000} turn={12} totalTurns={50} />, {
      withRouter: false,
    });

    expect(screen.getByTestId('timer-value')).toHaveTextContent('03:45');
    expect(screen.getByTestId('turn-count')).toHaveTextContent('12 / 50');
  });

  it('does not expose the running total or the penalization count to the patient', () => {
    renderWithProviders(<ScoreBar timeRemainingMs={300000} turn={5} totalTurns={50} />, {
      withRouter: false,
    });

    expect(screen.queryByTestId('score-value')).not.toBeInTheDocument();
    expect(screen.queryByTestId('penalizations-value')).not.toBeInTheDocument();
  });

  it('exposes progress as a progressbar with the right fraction', () => {
    renderWithProviders(<ScoreBar timeRemainingMs={300000} turn={3} totalTurns={10} />, {
      withRouter: false,
    });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(screen.getByTestId('progress-fill').style.width).toBe('30%');
  });

  it('formats zero time as 00:00', () => {
    renderWithProviders(<ScoreBar timeRemainingMs={0} turn={50} totalTurns={50} />, {
      withRouter: false,
    });

    expect(screen.getByTestId('timer-value')).toHaveTextContent('00:00');
  });
});
