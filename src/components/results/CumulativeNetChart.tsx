import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { TurnEvent } from '@/lib/gameEngine';
import { cumulativeNet } from '@/lib/scoring';

export interface CumulativeNetChartProps {
  events: TurnEvent[];
}

function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    <section aria-label={t('results.cumulativeNet')}>
      <h3 className="text-sm font-medium text-muted">{t('results.cumulativeNet')}</h3>
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
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} accessibilityLayer={false}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="turn" />
            <YAxis />
            <Tooltip />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              dot={false}
              isAnimationActive={!reducedMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
