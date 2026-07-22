import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card';
import { renderWithProviders } from '../../test/render';

describe('<Card />', () => {
  it('renders children with surface styles', () => {
    renderWithProviders(<Card>Content</Card>);
    const card = screen.getByText('Content');
    expect(card).toHaveClass('bg-surface');
    expect(card).toHaveClass('rounded-xl');
  });
});
