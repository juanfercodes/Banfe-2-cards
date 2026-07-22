import { useTranslation } from 'react-i18next';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { TurnEvent } from '@/lib/gameEngine';
import { cumulativeNet } from '@/lib/scoring';

export interface CumulativeNetChartProps {
  events: TurnEvent[];
}

export function CumulativeNetChart({ events }: CumulativeNetChartProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const series = cumulativeNet(events);

  const data = series.map((total, index) => ({
    turn: index + 1,
    total,
  }));

  const finalTotal = series[series.length - 1] ?? 0;
  const minTotal = series.length > 0 ? Math.min(...series) : 0;
  const maxTotal = series.length > 0 ? Math.max(...series) : 0;

  return (
    <Card
      role="region"
      aria-label={t('results.cumulativeNet')}
      padding="md"
      className="shadow-card"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-muted">{t('results.cumulativeNet')}</h3>
        <span className="rounded-full border border-subtle bg-raised px-2.5 py-0.5 text-xs font-semibold tabular-nums text-default">
          {t('results.cumulativeFinal', { value: finalTotal })}
        </span>
      </div>
      <p className="sr-only" data-testid="cumulative-net-summary">
        {t('results.cumulativeNetSummary', {
          turns: series.length,
          final: finalTotal,
          min: minTotal,
          max: maxTotal,
        })}
      </p>
      <table className="sr-only" data-testid="cumulative-net-table">
        <caption>{t('results.cumulativeNet')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('results.cumulativeNetTurn')}</th>
            <th scope="col">{t('results.cumulativeNetTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.turn}>
              <th scope="row">{point.turn}</th>
              <td>{point.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div aria-hidden="true" className="mt-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={data}
            accessibilityLayer={false}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <defs>
              <linearGradient id="cumulativeNetFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="turn"
              tick={{ fill: 'var(--fg-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-subtle)' }}
            />
            <YAxis
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
              cursor={{ stroke: 'var(--border-subtle)' }}
            />
            <ReferenceLine y={0} stroke="var(--fg-muted)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="total"
              stroke="none"
              fill="url(#cumulativeNetFill)"
              isAnimationActive={!reducedMotion}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={!reducedMotion}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
