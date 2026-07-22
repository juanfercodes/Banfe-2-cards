import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, anonKey);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, attempts = 5, delayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const name = (error as { name?: string })?.name ?? '';
      if (attempt === attempts || !/retryable|fetch|network/i.test(name)) {
        throw error;
      }
      await sleep(delayMs * attempt);
    }
  }
  throw lastError;
}

let testUserCounter = 0;

export function nextTestEmail(): string {
  testUserCounter += 1;
  return `test-${testUserCounter}@example.local`;
}

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to create test users. ' +
        'Get it from `supabase status -o env` and export it before running `npm run test:integration`. ' +
        'Never commit the service_role key.',
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createTestUser(email: string, password: string) {
  return withRetry(async () => {
    const response = await adminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (response.error) throw response.error;
    return response.data.user;
  });
}

export async function deleteTestUser(userId: string): Promise<void> {
  const response = await adminClient().auth.admin.deleteUser(userId);
  if (response.error) throw response.error;
}

export function makeAnonClient() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type TestClient = ReturnType<typeof makeAnonClient>;

export async function signInTestUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function getAuthedClient(email: string, password: string): Promise<TestClient> {
  const client = makeAnonClient();
  await withRetry(async () => {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  });
  return client;
}
