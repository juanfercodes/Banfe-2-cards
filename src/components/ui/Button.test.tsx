import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';
import { renderWithProviders } from '../../test/render';

describe('<Button />', () => {
  it('renders primary variant by default', () => {
    renderWithProviders(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toHaveClass('bg-accent');
  });

  it.each([
    ['primary', 'bg-accent'],
    ['secondary', 'bg-surface'],
    ['ghost', 'bg-transparent'],
    ['danger', 'bg-red-500'],
  ] as const)('renders %s variant classes', (variant, expectedClass) => {
    renderWithProviders(<Button variant={variant}>Label</Button>);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });

  it('shows spinner and disables when isLoading', () => {
    renderWithProviders(<Button isLoading>Save</Button>);
    const button = screen.getByRole('button', { name: /Cargando...|Loading.../i });
    expect(button).toBeDisabled();
    expect(button.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('does not fire click when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick} disabled>Save</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('fires click handler when enabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Save</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
