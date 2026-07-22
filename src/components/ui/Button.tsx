import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { Spinner } from './Spinner';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const base =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg disabled:pointer-events-none disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90',
  secondary: 'bg-surface text-default border border-subtle hover:bg-surface/80',
  ghost: 'bg-transparent text-default hover:bg-surface',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, className, variant = 'primary', size = 'md', isLoading, disabled, ...props },
    ref,
  ) => {
    const { t } = useTranslation();
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <span className="mr-2" aria-hidden="true">
            <Spinner size="sm" />
          </span>
        )}
        {isLoading ? t('common.loading') : children}
      </button>
    );
  },
);

Button.displayName = 'Button';
