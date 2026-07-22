import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DashboardPage from './DashboardPage';
import { renderWithProviders } from '@/test/render';
import type { Patient, Session } from '@/lib/dataAccess';

const listPatientsMock = vi.fn<() => Promise<Patient[]>>();
const listAllSessionsMock = vi.fn<() => Promise<Session[]>>();

vi.mock('@/lib/dataAccess', async () => {
  const actual = await vi.importActual<typeof import('@/lib/dataAccess')>('@/lib/dataAccess');
  return {
    ...actual,
    listPatients: () => listPatientsMock(),
    listAllSessions: () => listAllSessionsMock(),
  };
});

function patient(id: string, code: string): Patient {
  return { id, clinicianId: 'c1', code, createdAt: '2026-01-01T00:00:00.000Z' };
}

function session(id: string, patientId: string): Session {
  return {
    id,
    patientId,
    clinicianId: 'c1',
    startedAt: '2026-01-01T10:00:00.000Z',
    endedAt: null,
    totalNet: 50,
    perStack: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    penalizations: 0,
    learningCurve: [],
    advDisadvIndex: 2,
    rawEvents: [],
  };
}

describe('<DashboardPage />', () => {
  it('shows the empty state when there are no patients', async () => {
    listPatientsMock.mockResolvedValueOnce([]);
    listAllSessionsMock.mockResolvedValueOnce([]);
    renderWithProviders(<DashboardPage />, { route: '/' });

    expect(await screen.findByText(/Aún no hay pacientes/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Nuevo paciente' }).length).toBeGreaterThan(0);
  });

  it('renders stats and history table when data is present', async () => {
    listPatientsMock.mockResolvedValueOnce([patient('p1', 'PAC-001')]);
    listAllSessionsMock.mockResolvedValueOnce([session('s1', 'p1')]);
    renderWithProviders(<DashboardPage />, { route: '/' });

    expect(await screen.findByText('Total de pacientes')).toBeInTheDocument();
    expect(screen.getAllByText('PAC-001').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Exportar a Excel' })).toBeInTheDocument();
  });
});
