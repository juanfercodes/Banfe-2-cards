import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AllProviders } from '@/test/render';

import ResultsPage from './ResultsPage';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));

const summary = {
  totalNet: 42,
  perStack: { 1: 20, 2: 10, 3: 0, 4: -5, 5: -15 },
  penalizations: 7,
  learningCurve: [-5, 0, 10],
  advantageDisadvantageIndex: 12,
  drawsPerStack: { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 },
};

const events = [
  { turn: 1, stack: 1 as const, reward: 1, hadPenalty: false, penalty: 0, net: 1, runningTotal: 1 },
];

function renderResults(state: unknown, onExport: (payload: unknown) => void = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/results/session-1', state }]}>
      <AllProviders withRouter={false}>
        <ResultsPage onExport={onExport} />
      </AllProviders>
    </MemoryRouter>,
  );
}

describe('<ResultsPage />', () => {
  it('renders all sections from a fixture', () => {
    renderResults({ summary, events, patientCode: 'P-001' });

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('P-001', { exact: false })).toBeInTheDocument();
  });

  it('shows the no-data fallback when state is empty', () => {
    renderResults(null);
    expect(screen.getByText('No hay datos de sesión disponibles.')).toBeInTheDocument();
  });

  it('calls onExport when the export button is clicked', async () => {
    const onExport = vi.fn();
    renderResults({ summary, events }, onExport);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar resultados' }));

    expect(onExport).toHaveBeenCalledWith({ summary, events });
  });
});
