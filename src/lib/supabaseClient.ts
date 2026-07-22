import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function assertEnv(value: string | undefined, name: string): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it from \`supabase status\`.`,
    );
  }
  return value;
}

export const supabase = createClient(
  assertEnv(supabaseUrl, 'VITE_SUPABASE_URL'),
  assertEnv(supabaseAnonKey, 'VITE_SUPABASE_ANON_KEY'),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type Supabase = typeof supabase;

export function getSupabase(): Supabase {
  return supabase;
}
