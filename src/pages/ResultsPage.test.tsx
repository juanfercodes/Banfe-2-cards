import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AllProviders } from '@/test/render';
import type { Session } from '@/lib/dataAccess';

const { getSessionMock, getPatientMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getPatientMock: vi.fn(),
}));

vi.mock('@/lib/dataAccess', async () => {
  const actual = await vi.importActual<typeof import('@/lib/dataAccess')>('@/lib/dataAccess');
  return {
    ...actual,
    getSession: getSessionMock,
    getPatient: getPatientMock,
  };
});

import ResultsPage from './ResultsPage';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  Area: () => null,
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
        <Routes>
          <Route path="/results/:sessionId" element={<ResultsPage onExport={onExport} />} />
          <Route path="/" element={<div>dashboard</div>} />
        </Routes>
      </AllProviders>
    </MemoryRouter>,
  );
}

describe('<ResultsPage />', () => {
  it('renders all sections from router state', () => {
    renderResults({ summary, events, patientCode: 'P-001' });

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('P-001', { exact: false })).toBeInTheDocument();
    expect(screen.getByTestId('cumulative-net-table')).toBeInTheDocument();
    expect(screen.queryByTestId('learning-curve-table')).not.toBeInTheDocument();
  });

  it('reconstructs the summary from the DB when router state is missing', async () => {
    const session: Session = {
      id: 'session-1',
      patientId: 'p1',
      clinicianId: 'c1',
      startedAt: '2026-01-01T10:00:00.000Z',
      endedAt: '2026-01-01T10:20:00.000Z',
      totalNet: 33,
      perStack: { 1: 15, 2: 10, 3: 0, 4: 3, 5: 5 },
      penalizations: 4,
      advDisadvIndex: 6,
      rawEvents: [
        { turn: 1, stack: 1, reward: 1, hadPenalty: false, penalty: 0, net: 1, runningTotal: 1 },
      ],
    };
    getSessionMock.mockResolvedValueOnce(session);
    getPatientMock.mockResolvedValueOnce({
      id: 'p1',
      clinicianId: 'c1',
      code: 'P-REBUILT',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    renderResults(null);

    expect(await screen.findByText('33')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('P-REBUILT', { exact: false })).toBeInTheDocument();
    expect(getSessionMock).toHaveBeenCalledWith('session-1');
  });

  it('shows the not-found fallback when the session does not exist', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    renderResults(null);
    expect(await screen.findByText('No hay datos de sesión disponibles.')).toBeInTheDocument();
  });

  it('calls onExport when the export button is clicked', async () => {
    const onExport = vi.fn();
    renderResults({ summary, events }, onExport);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar resultados' }));

    expect(onExport).toHaveBeenCalledWith({ summary, events });
  });
});
