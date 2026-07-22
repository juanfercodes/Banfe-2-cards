import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HistoryTable } from './HistoryTable';
import { renderWithProviders } from '@/test/render';
import type { Patient, Session } from '@/lib/dataAccess';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/lib/export', () => ({
  exportSessions: vi.fn(() => new Blob(['x'])),
  downloadWorkbook: vi.fn(),
}));

import { downloadWorkbook, exportSessions, type SessionExportRow } from '@/lib/export';

function patient(id: string, code: string): Patient {
  return { id, clinicianId: 'c1', code, createdAt: '2026-01-01T00:00:00.000Z' };
}

function session(
  id: string,
  patientId: string,
  startedAt: string,
  totalNet: number,
  advDisadvIndex: number,
): Session {
  return {
    id,
    patientId,
    clinicianId: 'c1',
    startedAt,
    endedAt: null,
    totalNet,
    perStack: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    penalizations: 0,
    advDisadvIndex,
    rawEvents: [],
  };
}

const patients = [patient('p1', 'PAC-001'), patient('p2', 'PAC-002')];
const sessions = [
  session('s1', 'p1', '2026-01-01T10:00:00.000Z', 100, 4),
  session('s2', 'p2', '2026-01-03T10:00:00.000Z', -50, -4),
];

describe('<HistoryTable />', () => {
  it('renders rows for each session', () => {
    renderWithProviders(<HistoryTable patients={patients} sessions={sessions} />);
    expect(screen.getByText('PAC-001')).toBeInTheDocument();
    expect(screen.getByText('PAC-002')).toBeInTheDocument();
  });

  it('filters by patient code search', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HistoryTable patients={patients} sessions={sessions} />);
    const search = screen.getByLabelText('Buscar por código de paciente');
    await user.type(search, 'PAC-002');
    expect(screen.queryByText('PAC-001')).not.toBeInTheDocument();
    expect(screen.getByText('PAC-002')).toBeInTheDocument();
  });

  it('narrows rows using the index category filter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HistoryTable patients={patients} sessions={sessions} />);
    const filterSelect = screen.getByLabelText('Filtrar por índice');
    await user.selectOptions(filterSelect, 'disadvantageous');
    expect(screen.queryByText('PAC-001')).not.toBeInTheDocument();
    expect(screen.getByText('PAC-002')).toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', () => {
    renderWithProviders(<HistoryTable patients={[]} sessions={[]} />);
    expect(screen.getByText(/Aún no hay pacientes/i)).toBeInTheDocument();
  });

  it('navigates on row click and via view/play actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HistoryTable patients={patients} sessions={sessions} />);

    await user.click(screen.getByText('PAC-001'));
    expect(navigateMock).toHaveBeenCalledWith('/results/s1');

    navigateMock.mockClear();
    // default sort is by date desc, so s2 (patient p2) renders first
    const playButtons = screen.getAllByRole('button', { name: 'Jugar' });
    await user.click(playButtons[0]!);
    expect(navigateMock).toHaveBeenCalledWith('/play/p2');
  });

  it('calls exportSessions with the visible rows on export click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HistoryTable patients={patients} sessions={sessions} />);
    await user.click(screen.getByRole('button', { name: 'Exportar a Excel' }));

    expect(exportSessions).toHaveBeenCalledTimes(1);
    const [rows] = vi.mocked(exportSessions).mock.calls[0] as [SessionExportRow[], string];
    expect(rows).toHaveLength(2);
    expect(typeof rows[0]?.patientCode).toBe('string');
    expect(downloadWorkbook).toHaveBeenCalledTimes(1);
  });
});
