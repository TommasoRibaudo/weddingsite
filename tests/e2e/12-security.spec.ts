import { test, expect } from './fixtures/auth';
import { seedGift, cleanGift } from './helpers/supabase';

// §12 Privacy / Security Checks

let reservedGiftId: string;

test.beforeAll(async () => {
  reservedGiftId = await seedGift({
    name: 'PW Security Test Gift',
    reserved_by: 'SecretReserverName',
    reserved_at: new Date().toISOString(),
  });
});

test.afterAll(async () => {
  await cleanGift(reservedGiftId);
});

test('guest /gifts page HTML does not expose reserver names', async ({ guestPage: page }) => {
  await page.goto('/gifts');
  const html = await page.content();
  expect(html).not.toContain('SecretReserverName');
});

test('/robots.txt contains Disallow: /', async ({ page }) => {
  await page.goto('/robots.txt');
  const body = await page.locator('body').textContent();
  expect(body).toContain('Disallow: /');
});

test('response includes X-Robots-Tag: noindex, nofollow header', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).not.toBeNull();
  const header = response!.headers()['x-robots-tag'];
  expect(header).toContain('noindex');
  expect(header).toContain('nofollow');
});

test('page meta includes noindex, nofollow', async ({ page }) => {
  await page.goto('/');
  const metaContent = await page
    .locator('meta[name="robots"]')
    .getAttribute('content');
  expect(metaContent).toContain('noindex');
  expect(metaContent).toContain('nofollow');
});
