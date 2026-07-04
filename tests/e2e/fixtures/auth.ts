import { test as base, type Page } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join('tests', 'e2e', '.auth');

export const test = base.extend<{
  guestPage: Page;
  adminPage: Page;
}>({
  guestPage: async ({ browser }, provide) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'guest.json'),
    });
    const page = await ctx.newPage();
    await provide(page);
    await ctx.close();
  },

  adminPage: async ({ browser }, provide) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'admin.json'),
    });
    const page = await ctx.newPage();
    await provide(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
