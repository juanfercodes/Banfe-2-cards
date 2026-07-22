import { describe, expect, it } from 'vitest';

import { classifyIndex, computeDashboardStats } from './StatsCards';
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

describe('computeDashboardStats', () => {
  it('returns zeros and null for empty data', () => {
    const stats = computeDashboardStats([], []);
    expect(stats).toEqual({
      totalPatients: 0,
      totalSessions: 0,
      avgTotalNet: 0,
      avgAdvantageDisadvantageIndex: 0,
      lastSessionDate: null,
    });
  });

  it('computes aggregates across patients and sessions', () => {
    const patients = [patient('p1', 'PAC-001'), patient('p2', 'PAC-002')];
    const sessions = [
      session('s1', 'p1', '2026-01-01T10:00:00.000Z', 100, 4),
      session('s2', 'p1', '2026-01-03T10:00:00.000Z', 200, -2),
      session('s3', 'p2', '2026-01-02T10:00:00.000Z', -50, 0),
    ];

    const stats = computeDashboardStats(patients, sessions);

    expect(stats.totalPatients).toBe(2);
    expect(stats.totalSessions).toBe(3);
    expect(stats.avgTotalNet).toBeCloseTo((100 + 200 - 50) / 3);
    expect(stats.avgAdvantageDisadvantageIndex).toBeCloseTo((4 - 2 + 0) / 3);
    expect(stats.lastSessionDate).toBe('2026-01-03T10:00:00.000Z');
  });
});

describe('classifyIndex', () => {
  it('classifies positive, negative and zero indices', () => {
    expect(classifyIndex(5)).toBe('advantageous');
    expect(classifyIndex(-5)).toBe('disadvantageous');
    expect(classifyIndex(0)).toBe('neutral');
  });
});
