import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

const hasE2ECredentials = Boolean(process.env.TEST_GUEST_PASSWORD && process.env.TEST_ADMIN_PASSWORD);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: hasE2ECredentials ? '**/*.spec.ts' : '**/smoke.spec.ts',
  globalSetup: hasE2ECredentials ? './tests/e2e/global-setup.ts' : undefined,
  testIgnore: ['**/04-gallery-locked.spec.ts', '**/11-admin-gallery-bypass.spec.ts'],
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
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
