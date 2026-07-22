import { expect, test } from '@playwright/test';

test('language switcher toggles es → en', async ({ page }) => {
  await page.goto('/login');

  // Default locale is Spanish.
  await expect(page.getByRole('tab', { name: 'Iniciar sesión' })).toBeVisible();

  // Toggle to English.
  await page.getByRole('button', { name: 'Cambiar a inglés' }).click();

  // A known string flips language.
  await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Iniciar sesión' })).toHaveCount(0);
});
