import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, anonKey);

let testUserCounter = 0;

export function nextTestEmail() {
  testUserCounter += 1;
  return `test-${testUserCounter}@example.local`;
}

export async function createTestUser(email: string, password: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to create test users');
  }
  const admin = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

export async function signInTestUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function getAuthedClient(email: string, password: string) {
  await signInTestUser(email, password);
  return supabase;
}
