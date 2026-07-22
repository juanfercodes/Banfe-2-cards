import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './Spinner';
import { renderWithProviders } from '../../test/render';

describe('<Spinner />', () => {
  it('renders a loading status', () => {
    renderWithProviders(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
