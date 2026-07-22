import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Input } from './Input';
import { renderWithProviders } from '../../test/render';

describe('<Input />', () => {
  it('associates label with input via htmlFor/id', () => {
    renderWithProviders(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('shows error message via aria-describedby and aria-invalid', () => {
    renderWithProviders(<Input label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('-error'));
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('updates value when typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');
    expect(input).toHaveValue('test@example.com');
  });

  it('shows helper text when no error', () => {
    renderWithProviders(<Input label="Email" helperText="We will never share your email" />);
    expect(screen.getByText('We will never share your email')).toBeInTheDocument();
  });
});
