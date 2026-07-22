import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ScoreBar } from './ScoreBar';
import { renderWithProviders } from '../../test/render';

describe('<ScoreBar />', () => {
  it('shows the countdown timer, turn counter and penalizations', () => {
    renderWithProviders(<ScoreBar timeRemainingMs={3 * 60 * 1000 + 45000} turn={12} totalTurns={50} penalizations={2} />, {
      withRouter: false,
    });

    expect(screen.getByTestId('timer-value')).toHaveTextContent('03:45');
    expect(screen.getByTestId('turn-count')).toHaveTextContent('12 / 50');
    expect(screen.getByTestId('penalizations-value')).toHaveTextContent('2');
  });

  it('does not expose the running total', () => {
    renderWithProviders(<ScoreBar timeRemainingMs={300000} turn={5} totalTurns={50} penalizations={1} />, {
      withRouter: false,
    });

    expect(screen.queryByTestId('score-value')).not.toBeInTheDocument();
  });

  it('exposes progress as a progressbar with the right fraction', () => {
    renderWithProviders(<ScoreBar timeRemainingMs={300000} turn={3} totalTurns={10} penalizations={0} />, {
      withRouter: false,
    });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(screen.getByTestId('progress-fill').style.width).toBe('30%');
  });

  it('formats zero time as 00:00', () => {
    renderWithProviders(<ScoreBar timeRemainingMs={0} turn={50} totalTurns={50} penalizations={0} />, {
      withRouter: false,
    });

    expect(screen.getByTestId('timer-value')).toHaveTextContent('00:00');
  });
});
