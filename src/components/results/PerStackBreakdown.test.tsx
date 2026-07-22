import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ScoreSummary } from '@/lib/scoring';
import { renderWithProviders } from '@/test/render';

import { PerStackBreakdown } from './PerStackBreakdown';

const summary: ScoreSummary = {
  totalNet: 10,
  perStack: { 1: 20, 2: 10, 3: 0, 4: -5, 5: -15 },
  penalizations: 3,
  learningCurve: [1, 2],
  advantageDisadvantageIndex: 5,
  drawsPerStack: { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 },
};

describe('<PerStackBreakdown />', () => {
  it('renders 5 bars with correct nets and aria-labels', () => {
    renderWithProviders(<PerStackBreakdown summary={summary} />);
    for (const stack of [1, 2, 3, 4, 5] as const) {
      const bar = screen.getByLabelText(`Stack ${stack}: net ${summary.perStack[stack]}`);
      expect(bar).toBeInTheDocument();
    }
  });

  it('color-codes advantageous, disadvantageous and neutral nets', () => {
    renderWithProviders(<PerStackBreakdown summary={summary} />);
    const positive = screen.getByLabelText('Stack 1: net 20');
    const negative = screen.getByLabelText('Stack 5: net -15');
    const neutral = screen.getByLabelText('Stack 3: net 0');

    expect(positive.querySelector('.bg-green-500')).toBeInTheDocument();
    expect(negative.querySelector('.bg-red-500')).toBeInTheDocument();
    expect(neutral.querySelector('.bg-gray-400')).toBeInTheDocument();
  });
});
