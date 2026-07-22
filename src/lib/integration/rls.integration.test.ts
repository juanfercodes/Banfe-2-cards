/// <reference types="vitest/globals" />

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createTestUser,
  deleteTestUser,
  getAuthedClient,
  makeAnonClient,
  nextTestEmail,
  type TestClient,
} from '@/test/integration.setup';

interface PatientRow {
  id: string;
  clinician_id: string;
  code: string;
  created_at: string;
}

interface SessionRow {
  id: string;
  patient_id: string;
  clinician_id: string;
}

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

async function createPatientFor(client: TestClient, code: string): Promise<PatientRow> {
  const response = await client.from('patients').insert({ code }).select().single();
  expect(response.error).toBeNull();
  return response.data as PatientRow;
}

async function createSessionFor(
  client: TestClient,
  patientId: string,
  clinicianId: string,
): Promise<SessionRow> {
  const response = await client
    .from('sessions')
    .insert({
      patient_id: patientId,
      clinician_id: clinicianId,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      total_net: 10,
    })
    .select()
    .single();
  expect(response.error).toBeNull();
  return response.data as SessionRow;
}

async function selectPatientById(client: TestClient, id: string): Promise<PatientRow[]> {
  const response = await client.from('patients').select('*').eq('id', id);
  if (response.error) throw response.error;
  return response.data as PatientRow[];
}

async function selectSessionById(client: TestClient, id: string): Promise<SessionRow[]> {
  const response = await client.from('sessions').select('*').eq('id', id);
  if (response.error) throw response.error;
  return response.data as SessionRow[];
}

const cleanup: Array<() => Promise<void>> = [];

afterAll(async () => {
  while (cleanup.length) {
    const fn = cleanup.pop();
    if (fn) await fn();
  }
});

describe('RLS: clinician-scoped isolation', () => {
  let clinicianA: Clinician;
  let clinicianB: Clinician;

  beforeAll(async () => {
    clinicianA = await makeClinician();
    clinicianB = await makeClinician();
    cleanup.push(() => deleteTestUser(clinicianA.userId));
    cleanup.push(() => deleteTestUser(clinicianB.userId));
  });

  it('a clinician can read their own patient', async () => {
    const patient = await createPatientFor(clinicianA.client, 'P-A1');
    const rows = await selectPatientById(clinicianA.client, patient.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.code).toBe('P-A1');
  });

  it("clinician B cannot see clinician A's patients", async () => {
    const patient = await createPatientFor(clinicianA.client, 'P-A2');
    const rows = await selectPatientById(clinicianB.client, patient.id);
    expect(rows).toEqual([]);
  });

  it("clinician A cannot see clinician B's patients", async () => {
    const patient = await createPatientFor(clinicianB.client, 'P-B1');
    const rows = await selectPatientById(clinicianA.client, patient.id);
    expect(rows).toEqual([]);
  });

  it('a clinician can read their own sessions', async () => {
    const patient = await createPatientFor(clinicianA.client, 'P-A3');
    const session = await createSessionFor(clinicianA.client, patient.id, clinicianA.userId);
    const rows = await selectSessionById(clinicianA.client, session.id);
    expect(rows).toHaveLength(1);
  });

  it("clinician B cannot see clinician A's sessions", async () => {
    const patient = await createPatientFor(clinicianA.client, 'P-A4');
    const session = await createSessionFor(clinicianA.client, patient.id, clinicianA.userId);
    const rows = await selectSessionById(clinicianB.client, session.id);
    expect(rows).toEqual([]);
  });

  it("clinician B cannot insert a session under clinician A's patient (with check fails)", async () => {
    const patientA = await createPatientFor(clinicianA.client, 'P-A5');
    const response = await clinicianB.client.from('sessions').insert({
      patient_id: patientA.id,
      clinician_id: clinicianB.userId,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      total_net: 0,
    });
    expect(response.error).not.toBeNull();
    expect(response.error?.code).toBe('42501');
    expect(response.error?.message).toMatch(/row-level security|policy/i);
  });

  it('a clinician cannot insert a patient with a spoofed clinician_id (with check fails)', async () => {
    const response = await clinicianA.client.from('patients').insert({
      code: 'P-SPOOF',
      clinician_id: clinicianB.userId,
    });
    expect(response.error).not.toBeNull();
    expect(response.error?.code).toBe('42501');
  });

  it('a clinician cannot insert a session with a spoofed clinician_id (with check fails)', async () => {
    const patient = await createPatientFor(clinicianA.client, 'P-A6');
    const response = await clinicianA.client.from('sessions').insert({
      patient_id: patient.id,
      clinician_id: clinicianB.userId,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      total_net: 0,
    });
    expect(response.error).not.toBeNull();
    expect(response.error?.code).toBe('42501');
  });

  it('the anon client has no DML access to patients or sessions (permission denied)', async () => {
    const anon = makeAnonClient();
    const patientRes = await anon.from('patients').select('*');
    expect(patientRes.error).not.toBeNull();
    expect(patientRes.error?.code).toBe('42501');

    const sessionRes = await anon.from('sessions').select('*');
    expect(sessionRes.error).not.toBeNull();
    expect(sessionRes.error?.code).toBe('42501');
  });
});
