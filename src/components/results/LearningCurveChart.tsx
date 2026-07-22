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
    <div>
      <h3 className="text-sm font-medium text-muted">{t('results.learningCurve')}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
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
      <p className="text-xs text-muted">{t(`results.trend.${trend}`)}</p>
    </div>
  );
}
