import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatCard } from './StatCard';
import { renderWithProviders } from '../../test/render';

describe('<StatCard />', () => {
  it('renders label, value, sublabel and delta', () => {
    renderWithProviders(
      <StatCard label="Score" value={120} sublabel="vs last session" delta="+5" />,
    );
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('vs last session')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
  });
});
