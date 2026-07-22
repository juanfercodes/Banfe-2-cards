import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { StackId } from '@/lib/protocol';

export interface DrawsPerStackChartProps {
  drawsPerStack: Record<StackId, number>;
}

const ALL_STACKS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function DrawsPerStackChart({ drawsPerStack }: DrawsPerStackChartProps) {
  const { t } = useTranslation();

  const data = ALL_STACKS.map((stack) => ({
    stack: String(stack),
    draws: drawsPerStack[stack] ?? 0,
  }));

  return (
    <div>
      <h3 className="text-sm font-medium text-muted">{t('results.drawsPerStack')}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="stack" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="draws" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
