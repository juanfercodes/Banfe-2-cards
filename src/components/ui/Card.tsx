import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, padding = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-subtle bg-surface text-default shadow-sm',
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = 'Card';
