import { execSync } from 'node:child_process';

/**
 * E2E data strategy:
 * - A single `supabase db reset` here gives every run a clean database
 *   (schema reapplied from migrations, all auth users + rows cleared).
 * - Each spec then provisions its OWN clinician via the sign-up UI
 *   (email confirmations are disabled locally, so sign-up logs the user in).
 *   RLS isolates each clinician's patients/sessions, so count-based
 *   assertions stay deterministic and specs can run fully in parallel and
 *   survive retries without cross-test interference.
 *
 * Reset is best-effort: if the CLI/Docker is unavailable the run continues
 * against the existing stack (specs self-provision unique clinicians anyway).
 */
function globalSetup(): void {
  try {
    execSync('npm run supabase:db:reset', { stdio: 'inherit' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[e2e globalSetup] supabase db reset failed; continuing.', error);
  }
}

export default globalSetup;
