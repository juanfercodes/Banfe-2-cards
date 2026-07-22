import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { StackId } from '@/lib/protocol';

export interface DrawsPerStackChartProps {
  drawsPerStack: Record<StackId, number>;
}

const ALL_STACKS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function DrawsPerStackChart({ drawsPerStack }: DrawsPerStackChartProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();

  const data = ALL_STACKS.map((stack) => ({
    stack: String(stack),
    draws: drawsPerStack[stack] ?? 0,
  }));

  return (
    <section aria-label={t('results.drawsPerStack')}>
      <h3 className="text-sm font-medium text-muted">{t('results.drawsPerStack')}</h3>
      <table className="sr-only" data-testid="draws-per-stack-table">
        <caption>{t('results.drawsPerStack')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('results.perStack')}</th>
            <th scope="col">{t('results.totalDraws')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.stack}>
              <th scope="row">{t('game.stackName', { stack: point.stack })}</th>
              <td>{point.draws}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} accessibilityLayer={false}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stack" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="draws" fill="#6366f1" isAnimationActive={!reducedMotion} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
