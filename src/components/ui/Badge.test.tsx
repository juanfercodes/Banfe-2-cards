import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';
import { renderWithProviders } from '../../test/render';

describe('<Badge />', () => {
  it.each([
    ['neutral', 'bg-surface'],
    ['success', 'bg-green-500/20'],
    ['warning', 'bg-yellow-500/20'],
    ['danger', 'bg-red-500/20'],
    ['info', 'bg-accent/20'],
  ] as const)('renders %s variant', (variant, expectedClass) => {
    renderWithProviders(<Badge variant={variant}>Status</Badge>);
    expect(screen.getByText('Status')).toHaveClass(expectedClass);
  });
});
