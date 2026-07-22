import { cn } from './cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-4',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center', className)} role="status" aria-label={label ?? 'loading'}>
      <span
        className={cn(
          'inline-block animate-spin rounded-full border-current border-t-transparent text-accent',
          sizes[size],
        )}
      />
    </span>
  );
}
