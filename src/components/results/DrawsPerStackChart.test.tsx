import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { DrawsPerStackChart } from './DrawsPerStackChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart">
      {children}
      <pre data-testid="bar-chart-data">{JSON.stringify(data)}</pre>
    </div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe('<DrawsPerStackChart />', () => {
  it('renders 5 bars with the correct draw counts', () => {
    const drawsPerStack = { 1: 12, 2: 8, 3: 20, 4: 15, 5: 5 };
    renderWithProviders(<DrawsPerStackChart drawsPerStack={drawsPerStack} />);
    const data = JSON.parse(screen.getByTestId('bar-chart-data').textContent ?? '[]') as unknown[];
    expect(data).toHaveLength(5);
    expect(data).toEqual([
      { stack: '1', draws: 12 },
      { stack: '2', draws: 8 },
      { stack: '3', draws: 20 },
      { stack: '4', draws: 15 },
      { stack: '5', draws: 5 },
    ]);
  });
});
