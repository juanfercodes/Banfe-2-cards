import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy = [helperText ? helperId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-default">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-default placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-subtle',
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-muted">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
