import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ScoreSummary } from '@/lib/scoring';
import { renderWithProviders } from '@/test/render';

import { PerStackBreakdown } from './PerStackBreakdown';

const summary: ScoreSummary = {
  totalNet: 10,
  perStack: { 1: 20, 2: 10, 3: 0, 4: -5, 5: -15 },
  penalizations: 3,
  advantageDisadvantageIndex: 5,
  drawsPerStack: { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 },
};

describe('<PerStackBreakdown />', () => {
  it('renders 5 localized bars whose labels include net, reward and penalty', () => {
    renderWithProviders(<PerStackBreakdown summary={summary} />);
    const bars = screen.getAllByRole('img');
    expect(bars).toHaveLength(5);
    // Localized (es) and information-complete: stack, net, reward and penalty.
    expect(
      screen.getByRole('img', { name: 'Mazo 1: neto 20, recompensa +1, penalización -2' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Mazo 5: neto -15, recompensa +5, penalización -12' }),
    ).toBeInTheDocument();
  });

  it('color-codes advantageous, disadvantageous and neutral nets', () => {
    renderWithProviders(<PerStackBreakdown summary={summary} />);
    const positive = screen.getByRole('img', { name: /^Mazo 1:/ });
    const negative = screen.getByRole('img', { name: /^Mazo 5:/ });
    const neutral = screen.getByRole('img', { name: /^Mazo 3:/ });

    expect(positive.querySelector('.bg-green-500')).toBeInTheDocument();
    expect(negative.querySelector('.bg-red-500')).toBeInTheDocument();
    expect(neutral.querySelector('.bg-gray-400')).toBeInTheDocument();
  });
});
