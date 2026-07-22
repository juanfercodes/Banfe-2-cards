/// <reference types="vitest/globals" />

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

async function runSql<T>(sql: string): Promise<T> {
  const { stdout } = await execFileAsync('psql', [DB_URL, '-t', '-A', '-c', sql], {
    timeout: 15000,
  });
  return JSON.parse(stdout.trim() || 'null') as T;
}

type ColumnRow = {
  table: string;
  column: string;
  type: string;
  nullable: 'YES' | 'NO';
  default: string | null;
};

async function fetchColumns(): Promise<ColumnRow[]> {
  const sql = `
    select coalesce(json_agg(json_build_object(
      'table', table_name,
      'column', column_name,
      'type', data_type,
      'nullable', is_nullable,
      'default', column_default
    ) order by table_name, ordinal_position), '[]'::json)
    from information_schema.columns
    where table_schema = 'public' and table_name in ('patients', 'sessions');
  `;
  return runSql<ColumnRow[]>(sql);
}

describe('migrations: 0001_init + 0002_rls', () => {
  it('creates public.patients with the expected columns and constraints', async () => {
    const columns = await fetchColumns();
    const patients = columns.filter((c) => c.table === 'patients');
    const byName = new Map(patients.map((c) => [c.column, c]));

    expect(patients.map((c) => c.column)).toEqual(
      expect.arrayContaining(['id', 'clinician_id', 'code', 'created_at']),
    );

    const id = byName.get('id');
    expect(id?.type).toBe('uuid');
    expect(id?.nullable).toBe('NO');

    const clinicianId = byName.get('clinician_id');
    expect(clinicianId?.type).toBe('uuid');
    expect(clinicianId?.nullable).toBe('NO');

    const code = byName.get('code');
    expect(code?.type).toBe('text');
    expect(code?.nullable).toBe('NO');

    const createdAt = byName.get('created_at');
    expect(createdAt?.type).toBe('timestamp with time zone');
    expect(createdAt?.nullable).toBe('NO');
    expect(createdAt?.default).toContain('now()');
  });

  it('creates public.sessions with the expected columns and jsonb defaults', async () => {
    const columns = await fetchColumns();
    const sessions = columns.filter((c) => c.table === 'sessions');
    const byName = new Map(sessions.map((c) => [c.column, c]));

    const expected = [
      'id',
      'patient_id',
      'clinician_id',
      'started_at',
      'ended_at',
      'total_net',
      'per_stack',
      'penalizations',
      'learning_curve',
      'adv_disadv_index',
      'raw_events',
    ];
    expect(sessions.map((c) => c.column)).toEqual(expect.arrayContaining(expected));

    expect(byName.get('id')?.type).toBe('uuid');
    expect(byName.get('patient_id')?.type).toBe('uuid');
    expect(byName.get('clinician_id')?.type).toBe('uuid');
    expect(byName.get('started_at')?.type).toBe('timestamp with time zone');
    expect(byName.get('started_at')?.nullable).toBe('NO');
    expect(byName.get('ended_at')?.type).toBe('timestamp with time zone');
    expect(byName.get('ended_at')?.nullable).toBe('YES');
    expect(byName.get('total_net')?.type).toBe('integer');
    expect(byName.get('per_stack')?.type).toBe('jsonb');
    expect(byName.get('per_stack')?.default).toContain("'{}'::jsonb");
    expect(byName.get('penalizations')?.type).toBe('integer');
    expect(byName.get('learning_curve')?.type).toBe('jsonb');
    expect(byName.get('learning_curve')?.default).toContain("'[]'::jsonb");
    expect(byName.get('adv_disadv_index')?.type).toBe('integer');
    expect(byName.get('raw_events')?.type).toBe('jsonb');
    expect(byName.get('raw_events')?.default).toContain("'[]'::jsonb");
  });

  it('enables RLS on both tables and registers the clinician-scoped policies', async () => {
    const sql = `
      select coalesce(json_agg(json_build_object(
        'table', relname,
        'rls', relrowsecurity,
        'policy', polname,
        'using', pg_get_expr(polqual, polrelid),
        'withcheck', pg_get_expr(polwithcheck, polrelid)
      ) order by relname, polname), '[]'::json)
      from pg_class c
      left join pg_policy p on p.polrelid = c.oid
      where c.relname in ('patients', 'sessions') and c.relkind = 'r';
    `;
    const rows = await runSql<
      { table: string; rls: boolean; policy: string | null; using: string | null; withcheck: string | null }[]
    >(sql);

    const patients = rows.filter((r) => r.table === 'patients');
    const sessions = rows.filter((r) => r.table === 'sessions');

    expect(patients[0]?.rls).toBe(true);
    expect(sessions[0]?.rls).toBe(true);
    expect(patients.find((r) => r.policy === 'own patients')?.using).toContain('clinician_id');
    expect(sessions.find((r) => r.policy === 'own sessions')?.withcheck).toMatch(/exists/i);
  });

  it('grants DML to authenticated only and nothing to anon', async () => {
    const sql = `
      select coalesce(json_agg(json_build_object(
        'grantee', grantee,
        'table', table_name,
        'privs', privs
      ) order by grantee, table_name), '[]'::json)
      from (
        select grantee, table_name,
               string_agg(privilege_type, ',' order by privilege_type) as privs
        from information_schema.role_table_grants
        where table_schema = 'public' and table_name in ('patients', 'sessions')
          and grantee in ('anon', 'authenticated')
        group by grantee, table_name
      ) g;
    `;
    const rows = await runSql<{ grantee: string; table: string; privs: string }[]>(sql);

    const anon = rows.filter((r) => r.grantee === 'anon');
    const authed = rows.filter((r) => r.grantee === 'authenticated');

    expect(anon).toEqual([]);
    expect(authed.map((r) => r.table).sort()).toEqual(['patients', 'sessions']);
    for (const row of authed) {
      expect(row.privs.split(',').sort()).toEqual(
        ['DELETE', 'INSERT', 'SELECT', 'UPDATE'].sort(),
      );
    }
  });
});
