import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TurnEvent } from '@/lib/gameEngine';
import { renderWithProviders } from '../../test/render';
import { CumulativeNetChart } from './CumulativeNetChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));

function makeEvents(nets: number[]): TurnEvent[] {
  let runningTotal = 0;
  return nets.map((net, i) => {
    runningTotal += net;
    return {
      turn: i + 1,
      stack: 1 as const,
      reward: Math.max(net, 0),
      hadPenalty: net < 0,
      penalty: net < 0 ? net : 0,
      net,
      runningTotal,
    };
  });
}

describe('<CumulativeNetChart />', () => {
  it('renders one accessible table row per turn with the running total', () => {
    renderWithProviders(<CumulativeNetChart events={makeEvents([1, -4, 3])} />);

    const rows = screen.getByTestId('cumulative-net-table').querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0]!.textContent).toContain('1');
    expect(rows[1]!.textContent).toContain('-3');
    expect(rows[2]!.textContent).toContain('0');
  });

  it('exposes a section labeled as the cumulative score', () => {
    renderWithProviders(<CumulativeNetChart events={makeEvents([1, 1])} />);
    expect(screen.getByRole('region', { name: 'Puntaje acumulado' })).toBeInTheDocument();
  });

  it('renders a summary with final value for screen readers', () => {
    renderWithProviders(<CumulativeNetChart events={makeEvents([2, 2, 2])} />);
    expect(screen.getByTestId('cumulative-net-summary').textContent).toContain('6');
  });

  it('handles an empty session without crashing', () => {
    renderWithProviders(<CumulativeNetChart events={[]} />);
    const rows = screen.getByTestId('cumulative-net-table').querySelectorAll('tbody tr');
    expect(rows).toHaveLength(0);
  });
});
