import { expect, test } from '@playwright/test';

import {
  createPatientAndStart,
  expectNoSeriousA11y,
  playToFinish,
  signUpAndIn,
  uniqueEmail,
  uniquePatientCode,
} from './helpers';

test('no critical/serious axe violations on login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('tab', { name: 'Iniciar sesión' })).toBeVisible();
  await expectNoSeriousA11y(page);
});

test('no critical/serious axe violations on dashboard, game, and results', async ({ page }) => {
  await signUpAndIn(page, uniqueEmail('a11y'));

  // Dashboard (root).
  await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();
  await expectNoSeriousA11y(page);

  // Game page (standard 90/50 session).
  await createPatientAndStart(page, uniquePatientCode('A11Y'));
  await expect(page.getByText('0 / 50')).toBeVisible();
  await expectNoSeriousA11y(page);

  // Results page (via a full standard session).
  await playToFinish(page);
  await page.getByRole('button', { name: 'Ver resultados' }).click();
  await page.waitForURL(/\/results\//);
  await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();
  await expectNoSeriousA11y(page);
});
