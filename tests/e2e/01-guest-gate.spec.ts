import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join('tests', 'e2e', '.auth');

// §1 Guest Gate / Session

test.describe('protected route redirects when logged out', () => {
  for (const route of ['/home', '/gifts', '/gallery']) {
    test(`${route} redirects to /`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL('/');
    });
  }
});

test.describe('gate form', () => {
  test('wrong password shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Contraseña').fill('wrongpassword!');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Incorrect password');
  });

  test('empty name after correct password shows error', async ({ page }) => {
    const password = process.env.TEST_GUEST_PASSWORD!;
    await page.goto('/');
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Continuar' }).click();
    // Wait for name step
    await expect(page.getByLabel('Tu nombre')).toBeVisible();
    await page.getByRole('button', { name: 'Ver nuestra celebración' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('valid credentials redirect to /home', async ({ page }) => {
    const password = process.env.TEST_GUEST_PASSWORD!;
    await page.goto('/');
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByLabel('Tu nombre')).toBeVisible();
    await page.getByLabel('Tu nombre').fill('GateTest');
    await page.getByRole('button', { name: 'Ver nuestra celebración' }).click();
    await page.waitForURL('**/home');
    await expect(page).toHaveURL('/home');
  });
});

test('session persists on refresh', async ({ browser }) => {
  const ctx = await browser.newContext({
    storageState: path.join(AUTH_DIR, 'guest.json'),
  });
  const page = await ctx.newPage();
  await page.goto('/home');
  await expect(page).toHaveURL('/home');
  await page.reload();
  await expect(page).toHaveURL('/home');
  await ctx.close();
});

test('logout clears session and protected pages redirect again', async ({ browser }) => {
  const ctx = await browser.newContext({
    storageState: path.join(AUTH_DIR, 'guest.json'),
  });
  const page = await ctx.newPage();
  await page.goto('/home');
  // Open the account dropdown (desktop: button with aria-expanded contains guest name)
  await page.locator('button[aria-expanded]').click();
  // Click the logout button that appears in the dropdown
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  await page.getByRole('button', { name: 'Salir' }).click();
  await page.waitForURL('/');
  // Protected routes should now redirect
  await page.goto('/home');
  await expect(page).toHaveURL('/');
  await ctx.close();
});

test('gate card fits at 375px without horizontal scroll', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto('/');
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
  await ctx.close();
});
