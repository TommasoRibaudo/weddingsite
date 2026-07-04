import { test, expect } from '@playwright/test';
import path from 'path';

// §8 Admin Login / Session

test('visiting /admin while logged out redirects to /admin/login', async ({ page }) => {
  await page.goto('/tomma/bobba');
  await expect(page).toHaveURL('/tomma/bobba/login');
});

test('wrong admin password shows error', async ({ page }) => {
  await page.goto('/tomma/bobba/login');
  await page.getByLabel('Password').fill('totallyWrong!!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Incorrect admin password');
});

test('correct admin password redirects to /admin', async ({ page }) => {
  const password = process.env.TEST_ADMIN_PASSWORD!;
  await page.goto('/tomma/bobba/login');
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/tomma/bobba');
  await expect(page).toHaveURL('/tomma/bobba');
});

test('admin can access guest routes', async ({ browser }) => {
  const ctx = await browser.newContext({
    storageState: path.join('tests', 'e2e', '.auth', 'admin.json'),
  });
  const page = await ctx.newPage();
  for (const route of ['/home', '/gifts', '/gallery']) {
    await page.goto(route);
    await expect(page).toHaveURL(route);
  }
  await ctx.close();
});

test('admin logout clears session and /admin redirects to /admin/login', async ({ browser }) => {
  const ctx = await browser.newContext({
    storageState: path.join('tests', 'e2e', '.auth', 'admin.json'),
  });
  const page = await ctx.newPage();
  await page.goto('/tomma/bobba');
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.waitForURL('**/tomma/bobba/login');
  await expect(page).toHaveURL('/tomma/bobba/login');
  // Confirm /admin now redirects
  await page.goto('/tomma/bobba');
  await expect(page).toHaveURL('/tomma/bobba/login');
  await ctx.close();
});
