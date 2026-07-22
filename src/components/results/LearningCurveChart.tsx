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

import { computeTrend } from './interpret';

export interface LearningCurveChartProps {
  learningCurve: number[];
}

function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function LearningCurveChart({ learningCurve }: LearningCurveChartProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const trend = computeTrend(learningCurve);

  const data = learningCurve.map((net, index) => ({
    block: t('results.block', { n: index + 1 }),
    net,
  }));

  return (
    <section aria-label={t('results.learningCurve')}>
      <h3 className="text-sm font-medium text-muted">{t('results.learningCurve')}</h3>
      <table className="sr-only" data-testid="learning-curve-table">
        <caption>{t('results.learningCurve')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('results.block', { n: '' })}</th>
            <th scope="col">{t('results.totalNet')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.block}>
              <th scope="row">{point.block}</th>
              <td>{point.net}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} accessibilityLayer={false}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="block" />
            <YAxis />
            <Tooltip />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#6366f1"
              isAnimationActive={!reducedMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">{t(`results.trend.${trend}`)}</p>
    </section>
  );
}
