import { useTranslation } from 'react-i18next';

import { Card, cn } from '@/components/ui';
import { CONTINGENCIES } from '@/lib/protocol';
import type { ScoreSummary } from '@/lib/scoring';

export interface PerStackBreakdownProps {
  summary: ScoreSummary;
}

const ALL_STACKS = [1, 2, 3, 4, 5] as const;

function barColorClass(net: number): string {
  if (net > 0) return 'bg-green-500';
  if (net < 0) return 'bg-red-500';
  return 'bg-gray-400';
}

export function PerStackBreakdown({ summary }: PerStackBreakdownProps) {
  const { t } = useTranslation();
  const maxAbs = Math.max(1, ...ALL_STACKS.map((s) => Math.abs(summary.perStack[s])));

  return (
    <Card padding="md" className="shadow-card">
      <h3 className="text-sm font-medium text-muted">{t('results.perStack')}</h3>
      <ul className="mt-3 space-y-2.5">
        {ALL_STACKS.map((stack) => {
          const net = summary.perStack[stack];
          const contingency = CONTINGENCIES.find((c) => c.stack === stack)!;
          const widthPct = (Math.abs(net) / maxAbs) * 100;
          return (
            <li key={stack}>
              <div
                role="img"
                aria-label={t('results.perStackBar', {
                  stack,
                  net,
                  reward: contingency.reward,
                  penalty: contingency.penalty,
                })}
                className="flex items-center gap-3"
              >
                <span className="w-6 shrink-0 text-xs font-semibold text-muted">{stack}</span>
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-felt ring-1 ring-inset ring-subtle/60">
                  <div
                    className={cn('h-full rounded-full', barColorClass(net))}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums text-default">
                  {net}
                </span>
                <span className="w-32 shrink-0 text-right text-xs tabular-nums text-muted">
                  +{contingency.reward} / {contingency.penalty}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
