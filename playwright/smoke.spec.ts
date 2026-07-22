import { expect, test } from '@playwright/test';

test('login page renders the app title', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Banfe-2-cards/);
});
