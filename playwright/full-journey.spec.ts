import { expect, test } from '@playwright/test';

import {
  createPatientAndStart,
  playToFinish,
  signUpAndIn,
  statValue,
  uniqueEmail,
  uniquePatientCode,
} from './helpers';

test('login → create patient → play → save → results → dashboard → export', async ({ page }) => {
  // 1. Authenticate a fresh clinician (clean slate for count assertions).
  await signUpAndIn(page, uniqueEmail('journey'));

  // 2. Create a patient by code; land on the short (100-turn) game.
  const code = uniquePatientCode();
  await createPatientAndStart(page, code);
  await expect(page.getByText('0 / 100')).toBeVisible();

  // 3. Play through the short session until finished.
  await playToFinish(page);

  // Save + navigate to the results page.
  await page.getByRole('button', { name: 'Ver resultados' }).click();
  await page.waitForURL(/\/results\//);
  await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();

  // 4. Results render correctly.
  const netText = await statValue(page, 'Puntaje neto total');
  const net = Number(netText);
  expect(Number.isNaN(net)).toBe(false);

  // Learning curve is exposed as an accessible data table (one row per block).
  // Protocol formula: ceil(100 / 40) = 3 blocks for the 100-turn short session.
  // (plan/README.md's "2 blocks" note is a doc error; the formula is authoritative.)
  await expect(page.getByTestId('learning-curve-table').locator('tbody tr')).toHaveCount(3);

  // Per-stack breakdown: one accessible (localized) bar per stack.
  await expect(page.getByRole('img', { name: /^Mazo \d:/ })).toHaveCount(5);

  // Draws-per-stack accessible table present with one row per stack.
  await expect(page.getByTestId('draws-per-stack-table').locator('tbody tr')).toHaveCount(5);

  // Export button present.
  await expect(page.getByRole('button', { name: 'Exportar resultados' })).toBeVisible();

  // 5. Back to dashboard; the new session appears in the history table.
  await page.getByRole('button', { name: 'Volver al panel' }).click();
  await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();
  await expect(page.getByRole('cell', { name: code })).toBeVisible();

  // 6. Stats reflect exactly one patient / one session, and avg net matches.
  expect(await statValue(page, 'Total de pacientes')).toBe('1');
  expect(await statValue(page, 'Total de sesiones')).toBe('1');
  expect(await statValue(page, 'Total neto promedio')).toBe(net.toFixed(1));

  // 7. Export to Excel fires a download with a .xlsx filename.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar a Excel' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
});
