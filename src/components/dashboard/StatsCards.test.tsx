import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatsCards } from './StatsCards';
import { renderWithProviders } from '@/test/render';
import type { Patient, Session } from '@/lib/dataAccess';

function patient(id: string, code: string): Patient {
  return { id, clinicianId: 'c1', code, createdAt: '2026-01-01T00:00:00.000Z' };
}

function session(id: string, patientId: string, startedAt: string, totalNet: number, advDisadvIndex: number): Session {
  return {
    id,
    patientId,
    clinicianId: 'c1',
    startedAt,
    endedAt: null,
    totalNet,
    perStack: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    penalizations: 0,
    learningCurve: [],
    advDisadvIndex,
    rawEvents: [],
  };
}

describe('<StatsCards />', () => {
  it('renders 5 cards with computed values', () => {
    const patients = [patient('p1', 'PAC-001')];
    const sessions = [session('s1', 'p1', '2026-01-05T10:00:00.000Z', 100, 4)];
    renderWithProviders(<StatsCards patients={patients} sessions={sessions} />);

    expect(screen.getByText('Total de pacientes')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('Total de sesiones')).toBeInTheDocument();
    expect(screen.getByText('100.0')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(screen.getByText('Ventajoso')).toBeInTheDocument();
  });

  it('shows zeros and dashes for empty data', () => {
    renderWithProviders(<StatsCards patients={[]} sessions={[]} />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(2);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});
