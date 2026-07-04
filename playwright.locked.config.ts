import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

process.env.PLAYWRIGHT_GALLERY_LOCKED = 'true';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  testMatch: ['**/04-gallery-locked.spec.ts', '**/11-admin-gallery-bypass.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { PLAYWRIGHT_GALLERY_LOCKED: 'true' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
