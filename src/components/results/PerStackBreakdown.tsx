import { useTranslation } from 'react-i18next';

import { cn } from '@/components/ui';
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
    <div>
      <h3 className="text-sm font-medium text-muted">{t('results.perStack')}</h3>
      <ul className="mt-2 space-y-2">
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
                <span className="w-6 shrink-0 text-xs text-muted">{stack}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-surface">
                  <div
                    className={cn('h-full', barColorClass(net))}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-default">{net}</span>
                <span className="w-32 shrink-0 text-right text-xs text-muted">
                  +{contingency.reward} / {contingency.penalty}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
