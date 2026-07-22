import { defineConfig, devices } from '@playwright/test';

import { LOCAL_SUPABASE_ANON_KEY, LOCAL_SUPABASE_URL } from './playwright/helpers';

export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : '50%',
  timeout: 120_000,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  globalSetup: './playwright/global.setup.ts',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      VITE_SUPABASE_URL: LOCAL_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: LOCAL_SUPABASE_ANON_KEY,
    },
  },
});
