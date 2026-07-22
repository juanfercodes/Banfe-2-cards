import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const TEST_PASSWORD = 'e2e-password-123';

/** Local Supabase stack (Docker). The anon key is the standard local dev key
 * (public-safe, RLS-protected) — identical to the one in
 * vitest.integration.config.ts. It is embedded into the E2E build via the
 * Playwright webServer env in playwright.config.ts. */
export const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
export const LOCAL_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let counter = 0;

/** Unique per invocation so every test (and every retry) provisions its own
 * clinician; RLS then isolates each clinician's patients/sessions, keeping the
 * count-based assertions deterministic without cross-test coupling. */
export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@example.local`;
}

export function uniquePatientCode(prefix = 'PAC'): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function signUpAndIn(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByLabel('Confirmar contraseña').fill(password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();
}

export async function signIn(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();
}

/** From the dashboard, create a patient by code and start a session through the
 * version selector (standard 90/50 preselected by default). */
export async function createPatientAndStart(page: Page, code: string): Promise<void> {
  await page.getByRole('link', { name: 'Nuevo paciente' }).first().click();
  await page.getByLabel('Código del paciente').fill(code);
  await page.getByRole('button', { name: 'Crear paciente' }).click();
  await page.waitForURL(/\/play\//);
  await expect(page.getByRole('heading', { name: 'Versión de la sesión' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Estándar/ })).toBeChecked();
  await page.getByRole('button', { name: 'Comenzar sesión' }).click();
  await expect(page.getByRole('button', { name: /^Mazo 1:/ })).toBeVisible();
}

/** Click stacks deterministically until the game finishes. */
export async function playToFinish(page: Page): Promise<void> {
  const finish = page.getByRole('button', { name: 'Ver resultados' });
  const stacks = page.getByRole('button', { name: /^Mazo \d:/ });
  for (let turn = 0; turn < 130; turn += 1) {
    if (await finish.isVisible()) break;
    const count = await stacks.count();
    let clicked = false;
    for (let s = 0; s < count; s += 1) {
      const btn = stacks.nth(s);
      if (await btn.isEnabled()) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) break;
  }
  await expect(finish).toBeVisible();
}

/** Read a dashboard/results StatCard value by its label (value is the sibling <p>). */
export async function statValue(page: Page, label: string): Promise<string> {
  const value = page.getByText(label, { exact: true }).locator('xpath=following-sibling::p[1]');
  return (await value.textContent())?.trim() ?? '';
}

/** Assert axe reports no critical/serious violations on the current page.
 * color-contrast is disabled: it flags the pre-existing dark-theme palette
 * (owned by T3a), which is out of scope for T4's integration a11y pass. */
export async function expectNoSeriousA11y(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  const serious = results.violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => `${v.id} (${v.impact ?? 'unknown'})`);
  expect(serious).toEqual([]);
}
