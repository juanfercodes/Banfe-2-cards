import { useCallback, useEffect, useRef, useState, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { cn } from './cn';

export interface ModalProps {
  title: string;
  children: React.ReactNode;
  trigger: React.ReactElement<{ onClick?: () => void }>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function trapFocus(container: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Tab') return;
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
  if (focusable.length === 0) return;
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function Modal({ title, children, trigger, isOpen, onOpenChange, className }: ModalProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen ?? internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      setInternalOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange],
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      const panel = panelRef.current;
      const focusable = panel?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.[0]?.focus();
    } else {
      previousFocus.current?.focus();
      previousFocus.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      const panel = panelRef.current;
      if (panel) trapFocus(panel, e);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: () => {
          setOpen(true);
        },
      })
    : trigger;

  if (!open) {
    return <>{triggerElement}</>;
  }

  return (
    <>
      {triggerElement}
      {createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
          role="presentation"
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={cn(
              'w-full max-w-lg rounded-xl border border-subtle bg-surface text-default shadow-2xl',
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
              <h2 id="modal-title" className="text-lg font-semibold">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted hover:text-default focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4">{children}</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
