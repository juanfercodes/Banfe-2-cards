import type { StackId } from '@/lib/protocol';
import type { TurnEvent } from '@/lib/gameEngine';
import type { ScoreSummary } from '@/lib/scoring';

import type { Supabase } from './supabaseClient';

import { supabase } from './supabaseClient';

export type { StackId, TurnEvent, ScoreSummary };

export interface Patient {
  id: string;
  clinicianId: string;
  code: string;
  createdAt: string;
}

export interface Session {
  id: string;
  patientId: string;
  clinicianId: string;
  startedAt: string;
  endedAt: string | null;
  totalNet: number;
  perStack: Record<StackId, number>;
  penalizations: number;
  advDisadvIndex: number;
  rawEvents: TurnEvent[];
}

export interface SaveSessionInput {
  patientId: string;
  summary: ScoreSummary;
  events: TurnEvent[];
  startedAt: string;
  endedAt: string;
}

export interface PatientRow {
  id: string;
  clinician_id: string;
  code: string;
  created_at: string;
}

export interface SessionRow {
  id: string;
  patient_id: string;
  clinician_id: string;
  started_at: string;
  ended_at: string | null;
  total_net: number;
  per_stack: Record<string, number> | null;
  penalizations: number;
  learning_curve: number[] | null;
  adv_disadv_index: number;
  raw_events: TurnEvent[] | null;
}

const POSTGRES_UNIQUE_VIOLATION = '23505';

export class PatientConflictError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(`Patient with code "${code}" already exists for this clinician`);
    this.name = 'PatientConflictError';
    this.code = code;
    Object.setPrototypeOf(this, PatientConflictError.prototype);
  }
}

function isPostgrestError(error: unknown): error is { code: string; message: string } {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

export function mapPerStack(
  raw: Record<string, number> | null | undefined,
): Record<StackId, number> {
  const result = {} as Record<StackId, number>;
  if (!raw) return result;
  for (const [key, value] of Object.entries(raw)) {
    const numeric = Number(key);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 5) {
      result[numeric as StackId] = value;
    }
  }
  return result;
}

export function mapPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    clinicianId: row.clinician_id,
    code: row.code,
    createdAt: row.created_at,
  };
}

export function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    patientId: row.patient_id,
    clinicianId: row.clinician_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    totalNet: row.total_net,
    perStack: mapPerStack(row.per_stack),
    penalizations: row.penalizations,
    advDisadvIndex: row.adv_disadv_index,
    rawEvents: Array.isArray(row.raw_events) ? row.raw_events : [],
  };
}

const ALL_STACK_IDS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function sessionToScoreSummary(session: Session): ScoreSummary {
  const perStack = {} as Record<StackId, number>;
  const drawsPerStack = {} as Record<StackId, number>;
  for (const stack of ALL_STACK_IDS) {
    perStack[stack] = session.perStack[stack] ?? 0;
    drawsPerStack[stack] = 0;
  }
  for (const event of session.rawEvents) {
    if (drawsPerStack[event.stack] !== undefined) {
      drawsPerStack[event.stack] += 1;
    }
  }
  return {
    totalNet: session.totalNet,
    perStack,
    penalizations: session.penalizations,
    advantageDisadvantageIndex: session.advDisadvIndex,
    drawsPerStack,
  };
}

export async function createPatient(code: string, client: Supabase = supabase): Promise<Patient> {
  const response = await client.from('patients').insert({ code }).select().single();
  if (response.error) {
    if (isPostgrestError(response.error) && response.error.code === POSTGRES_UNIQUE_VIOLATION) {
      throw new PatientConflictError(code);
    }
    throw response.error;
  }
  return mapPatient(response.data as PatientRow);
}

export async function listPatients(client: Supabase = supabase): Promise<Patient[]> {
  const response = await client
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  if (response.error) throw response.error;
  return (response.data as PatientRow[]).map(mapPatient);
}

export async function getPatient(id: string, client: Supabase = supabase): Promise<Patient | null> {
  const response = await client.from('patients').select('*').eq('id', id).maybeSingle();
  if (response.error) throw response.error;
  return response.data ? mapPatient(response.data as PatientRow) : null;
}

export async function saveSession(
  input: SaveSessionInput,
  client: Supabase = supabase,
): Promise<Session> {
  const row = {
    patient_id: input.patientId,
    started_at: input.startedAt,
    ended_at: input.endedAt,
    total_net: input.summary.totalNet,
    per_stack: input.summary.perStack,
    penalizations: input.summary.penalizations,
    learning_curve: [],
    adv_disadv_index: input.summary.advantageDisadvantageIndex,
    raw_events: input.events,
  };
  const response = await client.from('sessions').insert(row).select('*').single();
  if (response.error) throw response.error;
  return mapSession(response.data as SessionRow);
}

export async function getSession(id: string, client: Supabase = supabase): Promise<Session | null> {
  const response = await client.from('sessions').select('*').eq('id', id).maybeSingle();
  if (response.error) throw response.error;
  return response.data ? mapSession(response.data as SessionRow) : null;
}

export async function getSessionHistory(
  patientId: string,
  client: Supabase = supabase,
): Promise<Session[]> {
  const response = await client
    .from('sessions')
    .select('*')
    .eq('patient_id', patientId)
    .order('started_at', { ascending: false });
  if (response.error) throw response.error;
  return (response.data as SessionRow[]).map(mapSession);
}

export async function listAllSessions(client: Supabase = supabase): Promise<Session[]> {
  const response = await client
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false });
  if (response.error) throw response.error;
  return (response.data as SessionRow[]).map(mapSession);
}
