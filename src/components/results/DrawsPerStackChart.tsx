import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card } from '@/components/ui';
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
    <Card
      role="region"
      aria-label={t('results.drawsPerStack')}
      padding="md"
      className="shadow-card"
    >
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
      <div aria-hidden="true" className="mt-4">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            accessibilityLayer={false}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="stack"
              tick={{ fill: 'var(--fg-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-subtle)' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--fg-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                color: 'var(--fg)',
              }}
              labelStyle={{ color: 'var(--fg-muted)' }}
              cursor={{ fill: 'var(--raised)', fillOpacity: 0.4 }}
            />
            <Bar
              dataKey="draws"
              fill="var(--accent)"
              radius={[6, 6, 0, 0]}
              isAnimationActive={!reducedMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
