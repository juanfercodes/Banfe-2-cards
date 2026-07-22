import { expect, test } from '@playwright/test';

import {
  createPatientAndStart,
  playToFinish,
  signUpAndIn,
  statValue,
  uniqueEmail,
  uniquePatientCode,
} from './helpers';

test('login → create patient → play 50 turns → save → results → dashboard → export', async ({
  page,
}) => {
  // 1. Authenticate a fresh clinician (clean slate for count assertions).
  await signUpAndIn(page, uniqueEmail('journey'));

  // 2. Create a patient by code; the game starts directly with the single
  //    90-card / 50-draw / 5-min version.
  const code = uniquePatientCode();
  await createPatientAndStart(page, code);
  await expect(page.getByText('0 / 50')).toBeVisible();
  await expect(page.getByTestId('timer-value')).toHaveText('05:00');

  // 3. Each draw lands on that stack's discard pile ("monte"). The patient
  //    never sees a running total during play.
  await page.getByRole('button', { name: /^Mazo 1:/ }).click();
  await expect(page.getByText('1 / 50')).toBeVisible();
  await expect(page.getByTestId('discard-pile-summary-1')).toHaveText(
    'Mazo 1: 1 carta robada, 0 con penalización',
  );
  await expect(page.getByTestId('score-value')).toHaveCount(0);
  await expect(page.getByText(/Puntaje final/)).not.toBeVisible();

  // 4. Play through the remaining turns until finished.
  await playToFinish(page);

  // Save + navigate to the results page.
  await page.getByRole('button', { name: 'Ver resultados' }).click();
  await page.waitForURL(/\/results\//);
  await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();

  // 5. Results render correctly.
  const netText = await statValue(page, 'Puntaje neto total');
  const net = Number(netText);
  expect(Number.isNaN(net)).toBe(false);

  // Cumulative net-score line: accessible table with one row per turn (50), no
  // learning-curve blocks anywhere.
  await expect(page.getByTestId('cumulative-net-table').locator('tbody tr')).toHaveCount(50);
  await expect(page.getByTestId('learning-curve-table')).toHaveCount(0);
  expect(await statValue(page, 'Cartas tomadas')).toBe('50');

  // Per-stack breakdown: one accessible (localized) bar per stack.
  await expect(page.getByRole('img', { name: /^Mazo \d:/ })).toHaveCount(5);

  // Draws-per-stack accessible table present with one row per stack.
  await expect(page.getByTestId('draws-per-stack-table').locator('tbody tr')).toHaveCount(5);

  // Export button present.
  await expect(page.getByRole('button', { name: 'Exportar resultados' })).toBeVisible();

  // 6. Back to dashboard; the new session appears in the history table.
  await page.getByRole('button', { name: 'Volver al panel' }).click();
  await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();
  await expect(page.getByRole('cell', { name: code })).toBeVisible();

  // 7. Stats reflect exactly one patient / one session, and avg net matches.
  expect(await statValue(page, 'Total de pacientes')).toBe('1');
  expect(await statValue(page, 'Total de sesiones')).toBe('1');
  expect(await statValue(page, 'Total neto promedio')).toBe(net.toFixed(1));

  // 8. Export to Excel fires a download with a .xlsx filename.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar a Excel' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
});
