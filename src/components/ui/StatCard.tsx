import { type ReactNode } from 'react';

import { Card } from './Card';
import { cn } from './cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  delta?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, sublabel, delta, icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex items-start justify-between', className)}>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-default">{value}</p>
        {(sublabel || delta) && (
          <p className="mt-1 text-xs text-muted">
            {delta && <span className={cn('mr-2', delta.startsWith('+') ? 'text-green-400' : 'text-red-400')}>{delta}</span>}
            {sublabel}
          </p>
        )}
      </div>
      {icon && <div className="text-muted">{icon}</div>}
    </Card>
  );
}
