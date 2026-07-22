import { expect, test } from '@playwright/test';

import { signIn, signUpAndIn, uniqueEmail } from './helpers';

test('sign up, sign out, sign back in, and protected-route redirect', async ({ page }) => {
  const email = uniqueEmail('auth');

  await signUpAndIn(page, email);
  await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL(/\/login/);
  await expect(page.getByRole('tab', { name: 'Iniciar sesión' })).toBeVisible();

  // A protected route redirects to /login when signed out.
  await page.goto('/');
  await page.waitForURL(/\/login/);

  await signIn(page, email);
  await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();
});
