/// <reference types="vitest/globals" />

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  PatientConflictError,
  createPatient,
  getSessionHistory,
  getPatient,
  listAllSessions,
  listPatients,
  saveSession,
  type ScoreSummary,
  type StackId,
  type TurnEvent,
} from '@/lib/dataAccess';
import { createTestUser, deleteTestUser, getAuthedClient, nextTestEmail, type TestClient } from '@/test/integration.setup';

interface Clinician {
  email: string;
  password: string;
  userId: string;
  client: TestClient;
}

async function makeClinician(): Promise<Clinician> {
  const email = nextTestEmail();
  const password = 'test-password-123';
  const user = await createTestUser(email, password);
  const client = await getAuthedClient(email, password);
  return { email, password, userId: user.id, client };
}

let clinicianA: Clinician;
let clinicianB: Clinician;

const cleanup: Array<() => Promise<void>> = [];

beforeAll(async () => {
  clinicianA = await makeClinician();
  clinicianB = await makeClinician();
  cleanup.push(() => deleteTestUser(clinicianA.userId));
  cleanup.push(() => deleteTestUser(clinicianB.userId));
});

afterEach(async () => {
  while (cleanup.length > 2) {
    const fn = cleanup.pop();
    if (fn) await fn();
  }
});

afterAll(async () => {
  while (cleanup.length) {
    const fn = cleanup.pop();
    if (fn) await fn();
  }
});

function sampleSummary(): ScoreSummary {
  const perStack: Record<StackId, number> = { 1: 10, 2: 20, 3: 5, 4: 8, 5: -1 };
  const drawsPerStack: Record<StackId, number> = { 1: 4, 2: 5, 3: 2, 4: 3, 5: 1 };
  return {
    totalNet: 42,
    perStack,
    penalizations: 7,
    learningCurve: [5, 10, 8, 12, 7],
    advantageDisadvantageIndex: 3,
    drawsPerStack,
  };
}

function sampleEvents(): TurnEvent[] {
  return [
    { turn: 1, stack: 1, reward: 1, hadPenalty: false, penalty: 0, net: 1, runningTotal: 1 },
    { turn: 2, stack: 5, reward: 5, hadPenalty: true, penalty: 10, net: -5, runningTotal: -4 },
    { turn: 3, stack: 2, reward: 2, hadPenalty: false, penalty: 0, net: 2, runningTotal: -2 },
  ];
}

describe('dataAccess: typed CRUD round-trips', () => {
  it('createPatient -> listPatients -> getPatient round-trip', async () => {
    const created = await createPatient('P-RT-1', clinicianA.client);
    expect(created.code).toBe('P-RT-1');
    expect(created.clinicianId).toBe(clinicianA.userId);
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();

    const listed = await listPatients(clinicianA.client);
    expect(listed.some((p) => p.id === created.id)).toBe(true);

    const fetched = await getPatient(created.id, clinicianA.client);
    expect(fetched).not.toBeNull();
    expect(fetched?.code).toBe('P-RT-1');
    expect(fetched?.clinicianId).toBe(clinicianA.userId);
  });

  it('createPatient throws PatientConflictError on duplicate (clinician_id, code)', async () => {
    await createPatient('P-DUP', clinicianA.client);
    await expect(createPatient('P-DUP', clinicianA.client)).rejects.toBeInstanceOf(
      PatientConflictError,
    );
    try {
      await createPatient('P-DUP', clinicianA.client);
    } catch (err) {
      expect(err).toBeInstanceOf(PatientConflictError);
      expect((err as PatientConflictError).code).toBe('P-DUP');
    }
  });

  it('the same patient code is allowed for two different clinicians', async () => {
    const a = await createPatient('P-SHARED', clinicianA.client);
    const b = await createPatient('P-SHARED', clinicianB.client);
    expect(a.clinicianId).toBe(clinicianA.userId);
    expect(b.clinicianId).toBe(clinicianB.userId);
    expect(a.id).not.toBe(b.id);
  });

  it('saveSession -> getSessionHistory round-trip with jsonb typed back', async () => {
    const patient = await createPatient('P-SESS', clinicianA.client);
    const startedAt = '2026-01-01T00:00:00.000Z';
    const endedAt = '2026-01-01T00:20:00.000Z';
    const saved = await saveSession(
      {
        patientId: patient.id,
        summary: sampleSummary(),
        events: sampleEvents(),
        startedAt,
        endedAt,
      },
      clinicianA.client,
    );

    expect(saved.patientId).toBe(patient.id);
    expect(saved.clinicianId).toBe(clinicianA.userId);
    expect(saved.totalNet).toBe(42);
    expect(saved.perStack[1]).toBe(10);
    expect(saved.perStack[5]).toBe(-1);
    expect(saved.penalizations).toBe(7);
    expect(saved.learningCurve).toEqual([5, 10, 8, 12, 7]);
    expect(saved.advDisadvIndex).toBe(3);
    expect(saved.rawEvents).toHaveLength(3);
    expect(saved.rawEvents[0]?.stack).toBe(1);
    expect(saved.rawEvents[1]?.hadPenalty).toBe(true);
    expect(saved.startedAt).toBeTruthy();
    expect(new Date(saved.endedAt ?? '').toISOString()).toBe(endedAt);

    const history = await getSessionHistory(patient.id, clinicianA.client);
    expect(history.length).toBeGreaterThanOrEqual(1);
    const found = history.find((s) => s.id === saved.id);
    expect(found).toBeDefined();
    expect(found?.perStack[2]).toBe(20);
    expect(found?.rawEvents[2]?.net).toBe(2);
  });

  it('listAllSessions returns only the current clinician\'s rows', async () => {
    const patientA = await createPatient('P-ALL-A', clinicianA.client);
    const patientB = await createPatient('P-ALL-B', clinicianB.client);

    await saveSession(
      {
        patientId: patientA.id,
        summary: sampleSummary(),
        events: sampleEvents(),
        startedAt: '2026-02-01T00:00:00.000Z',
        endedAt: '2026-02-01T00:20:00.000Z',
      },
      clinicianA.client,
    );
    await saveSession(
      {
        patientId: patientB.id,
        summary: sampleSummary(),
        events: sampleEvents(),
        startedAt: '2026-02-01T00:00:00.000Z',
        endedAt: '2026-02-01T00:20:00.000Z',
      },
      clinicianB.client,
    );

    const aSessions = await listAllSessions(clinicianA.client);
    const bSessions = await listAllSessions(clinicianB.client);

    expect(aSessions.every((s) => s.clinicianId === clinicianA.userId)).toBe(true);
    expect(bSessions.every((s) => s.clinicianId === clinicianB.userId)).toBe(true);
    expect(aSessions.some((s) => s.patientId === patientB.id)).toBe(false);
    expect(bSessions.some((s) => s.patientId === patientA.id)).toBe(false);
  });

  it('getPatient returns null for another clinician\'s patient id', async () => {
    const own = await createPatient('P-OWN', clinicianA.client);
    const other = await createPatient('P-OTHER', clinicianB.client);
    const seenOwn = await getPatient(own.id, clinicianA.client);
    expect(seenOwn?.id).toBe(own.id);
    const seenOther = await getPatient(other.id, clinicianA.client);
    expect(seenOther).toBeNull();
  });

  it('saveSession rejects when the patient belongs to another clinician', async () => {
    const otherPatient = await createPatient('P-XOWNER', clinicianB.client);
    await expect(
      saveSession(
        {
          patientId: otherPatient.id,
          summary: sampleSummary(),
          events: sampleEvents(),
          startedAt: '2026-03-01T00:00:00.000Z',
          endedAt: '2026-03-01T00:20:00.000Z',
        },
        clinicianA.client,
      ),
    ).rejects.toThrow();
  });
});
