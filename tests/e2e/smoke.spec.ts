import { expect, test } from '@playwright/test';

test('landing gate explains invite-only access', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-access-mode="no-access"]')).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
});

test('guest routes redirect unauthenticated visitors to the gate', async ({ page }) => {
  await page.goto('/gallery');

  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-access-mode="no-access"]')).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
});

test('admin routes redirect unauthenticated visitors to admin login', async ({ page }) => {
  await page.goto('/tomma/bobba');

  await expect(page).toHaveURL('/tomma/bobba/login');
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test('robots and noindex headers discourage indexing', async ({ page, request }) => {
  const response = await page.goto('/');

  expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');

  const robots = await request.get('/robots.txt');
  await expect(robots).toBeOK();
  await expect(await robots.text()).toContain('Disallow: /');
});

test('landing page has no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
});
