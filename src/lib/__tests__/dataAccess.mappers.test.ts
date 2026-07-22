import { describe, expect, it } from 'vitest';

import {
  PatientConflictError,
  mapPatient,
  mapPerStack,
  mapSession,
  type PatientRow,
  type SessionRow,
} from '../dataAccess';

describe('mapPerStack', () => {
  it('converts string-keyed jsonb into a numeric-keyed Record<StackId, number>', () => {
    const result = mapPerStack({ '1': 10, '2': 20, '3': 0, '4': -5, '5': -12 });
    expect(result[1]).toBe(10);
    expect(result[2]).toBe(20);
    expect(result[3]).toBe(0);
    expect(result[4]).toBe(-5);
    expect(result[5]).toBe(-12);
  });

  it('returns an empty record for null/undefined input', () => {
    expect(mapPerStack(null)).toEqual({});
    expect(mapPerStack(undefined)).toEqual({});
  });

  it('ignores non-numeric keys silently', () => {
    const result = mapPerStack({ '1': 5, bogus: 99 });
    expect(result[1]).toBe(5);
    expect((result as Record<string, number>)['bogus']).toBeUndefined();
  });
});

describe('mapPatient', () => {
  it('maps snake_case row to camelCase Patient', () => {
    const row: PatientRow = {
      id: 'p-uuid',
      clinician_id: 'c-uuid',
      code: 'P-001',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapPatient(row)).toEqual({
      id: 'p-uuid',
      clinicianId: 'c-uuid',
      code: 'P-001',
      createdAt: '2026-01-01T00:00:00Z',
    });
  });
});

describe('mapSession', () => {
  it('maps snake_case row to typed Session with parsed jsonb fields', () => {
    const row: SessionRow = {
      id: 's-uuid',
      patient_id: 'p-uuid',
      clinician_id: 'c-uuid',
      started_at: '2026-01-01T00:00:00Z',
      ended_at: '2026-01-01T00:20:00Z',
      total_net: 42,
      per_stack: { '1': 10, '2': 20, '3': 5, '4': 8, '5': -1 },
      penalizations: 7,
      learning_curve: [5, 10, 8, 12, 7],
      adv_disadv_index: 3,
      raw_events: [
        { turn: 1, stack: 1, reward: 1, penalization: 0, net: 1, penalized: false },
      ],
    };
    const session = mapSession(row);
    expect(session.id).toBe('s-uuid');
    expect(session.patientId).toBe('p-uuid');
    expect(session.clinicianId).toBe('c-uuid');
    expect(session.startedAt).toBe('2026-01-01T00:00:00Z');
    expect(session.endedAt).toBe('2026-01-01T00:20:00Z');
    expect(session.totalNet).toBe(42);
    expect(session.perStack[1]).toBe(10);
    expect(session.perStack[5]).toBe(-1);
    expect(session.penalizations).toBe(7);
    expect(session.learningCurve).toEqual([5, 10, 8, 12, 7]);
    expect(session.advDisadvIndex).toBe(3);
    expect(session.rawEvents).toHaveLength(1);
    expect(session.rawEvents[0]?.stack).toBe(1);
  });

  it('handles null ended_at and non-array jsonb defaults defensively', () => {
    const row: SessionRow = {
      id: 's2',
      patient_id: 'p',
      clinician_id: 'c',
      started_at: '2026-01-01T00:00:00Z',
      ended_at: null,
      total_net: 0,
      per_stack: {},
      penalizations: 0,
      learning_curve: [],
      adv_disadv_index: 0,
      raw_events: [],
    };
    const session = mapSession(row);
    expect(session.endedAt).toBeNull();
    expect(session.perStack).toEqual({});
    expect(session.learningCurve).toEqual([]);
    expect(session.rawEvents).toEqual([]);
  });
});

describe('PatientConflictError', () => {
  it('is a typed error carrying the conflicting code', () => {
    const err = new PatientConflictError('P-001');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PatientConflictError);
    expect(err.name).toBe('PatientConflictError');
    expect(err.code).toBe('P-001');
    expect(err.message).toContain('P-001');
  });
});
