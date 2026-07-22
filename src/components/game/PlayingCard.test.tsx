import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlayingCard } from './PlayingCard';
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

const baseProps = {
  stack: 3 as const,
  reward: 3,
  hadPenalty: false,
  penalty: 0,
  revealed: true,
  flipped: true,
};

describe('<PlayingCard />', () => {
  it('renders the reward face when revealed', () => {
    renderWithProviders(<PlayingCard {...baseProps} />, { withRouter: false });
    expect(screen.getByTestId('card-reward')).toHaveTextContent('+3');
    expect(screen.queryByTestId('penalty-chip')).not.toBeInTheDocument();
  });

  it('shows the penalty chip when hadPenalty', () => {
    renderWithProviders(<PlayingCard {...baseProps} hadPenalty penalty={-3} />, {
      withRouter: false,
    });
    expect(screen.getByTestId('penalty-chip')).toHaveTextContent('-3');
    expect(screen.getByTestId('penalty-chip')).toHaveAccessibleName(/3/);
  });

  it('hides reward face and penalty chip when not revealed', () => {
    renderWithProviders(
      <PlayingCard {...baseProps} revealed={false} flipped={false} hadPenalty penalty={-3} />,
      { withRouter: false },
    );
    expect(screen.queryByTestId('card-reward')).not.toBeInTheDocument();
    expect(screen.queryByTestId('penalty-chip')).not.toBeInTheDocument();
  });

  it('applies a green tint for advantageous stacks and red for disadvantageous', () => {
    const { unmount } = renderWithProviders(<PlayingCard {...baseProps} stack={1} reward={1} />, {
      withRouter: false,
    });
    expect(screen.getByTestId('card-front').className).toMatch(/emerald/);
    unmount();

    renderWithProviders(<PlayingCard {...baseProps} stack={5} reward={5} />, { withRouter: false });
    expect(screen.getByTestId('card-front').className).toMatch(/red/);
  });

  it('renders without transforms or animated floats when prefers-reduced-motion is set', () => {
    stubMatchMedia(true);
    renderWithProviders(<PlayingCard {...baseProps} hadPenalty penalty={-3} />, {
      withRouter: false,
    });

    const inner = screen.getByTestId('card-inner');
    expect(inner.style.transform).toBe('');
    expect(screen.queryByTestId('reward-float')).not.toBeInTheDocument();
    expect(screen.getByTestId('card-reward')).toHaveTextContent('+3');
    expect(screen.getByTestId('penalty-chip')).toBeInTheDocument();
  });
});
