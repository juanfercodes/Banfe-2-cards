import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';
import { Modal } from './Modal';
import { renderWithProviders } from '../../test/render';

describe('<Modal />', () => {
  it('opens on trigger click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Modal title="Confirm" trigger={<Button>Open</Button>}>
        <p>Are you sure?</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Open/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('closes on ESC key', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Modal title="Confirm" trigger={<Button>Open</Button>}>
        <p>Are you sure?</p>
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: /Open/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Modal title="Confirm" trigger={<Button>Open</Button>}>
        <p>Are you sure?</p>
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: /Open/i }));
    const backdrop = screen.getByRole('presentation');
    await user.click(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('focuses a focusable element inside the dialog when opened', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Modal title="Confirm" trigger={<Button>Open</Button>}>
        <Button>Action</Button>
      </Modal>,
    );
    const trigger = screen.getByRole('button', { name: /Open/i });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    const focused = dialog.querySelector(':focus');
    expect(focused).toBeInstanceOf(HTMLElement);
    expect(dialog.contains(focused)).toBe(true);
  });

  it('restores focus to trigger on close', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Modal title="Confirm" trigger={<Button>Open</Button>} onOpenChange={onOpenChange}>
        <p>Are you sure?</p>
      </Modal>,
    );
    const trigger = screen.getByRole('button', { name: /Open/i });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
