import { test, expect } from './fixtures/auth';

// §2 Home / Event Info

test.describe('home page', () => {
  test('renders schedule, directions, and key sections', async ({ guestPage: page }) => {
    await page.goto('/home');

    // Schedule items from i18n (es locale)
    await expect(page.getByText('Llegada a Playa Grande')).toBeVisible();
    await expect(page.getByText('Ceremonia en la playa')).toBeVisible();

    // Directions links exist and open new tabs
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: /indicaciones a playa grande/i }).click(),
    ]);
    expect(popup.url()).toBeTruthy();
    await popup.close();
  });

  test('no horizontal scroll at 375px', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'tests/e2e/.auth/guest.json',
      viewport: { width: 375, height: 812 },
    });
    const page = await ctx.newPage();
    await page.goto('/home');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
    await ctx.close();
  });

  test('no horizontal scroll at 768px', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'tests/e2e/.auth/guest.json',
      viewport: { width: 768, height: 1024 },
    });
    const page = await ctx.newPage();
    await page.goto('/home');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(768);
    await ctx.close();
  });

  test('no horizontal scroll at 1280px', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'tests/e2e/.auth/guest.json',
      viewport: { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();
    await page.goto('/home');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1280);
    await ctx.close();
  });
});
