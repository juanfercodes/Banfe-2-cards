import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ScoreBar } from './ScoreBar';
import { renderWithProviders } from '../../test/render';

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

afterEach(() => {
  stubMatchMedia(false);
});

describe('<ScoreBar />', () => {
  it('shows running total, turn counter and penalizations', () => {
    renderWithProviders(
      <ScoreBar runningTotal={17} turn={3} totalTurns={10} penalizations={2} />,
      { withRouter: false },
    );

    expect(screen.getByTestId('score-value')).toHaveTextContent('17');
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
    expect(screen.getByTestId('penalizations-value')).toHaveTextContent('2');
  });

  it('exposes progress as a progressbar with the right fraction', () => {
    renderWithProviders(
      <ScoreBar runningTotal={0} turn={3} totalTurns={10} penalizations={0} />,
      { withRouter: false },
    );

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(screen.getByTestId('progress-fill').style.width).toBe('30%');
  });

  it('drops transition classes when prefers-reduced-motion is set', () => {
    stubMatchMedia(true);
    renderWithProviders(
      <ScoreBar runningTotal={5} turn={1} totalTurns={10} penalizations={0} />,
      { withRouter: false },
    );

    expect(screen.getByTestId('progress-fill').className).not.toMatch(/transition/);
    expect(screen.getByTestId('score-value').style.transform).toBe('');
  });
});
