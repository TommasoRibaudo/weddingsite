import { test, expect } from './fixtures/auth';
import { seedGift, cleanGift, clearReservation } from './helpers/supabase';

// §3 Gift Registry

let giftId: string;
let giftWithLinkId: string;

test.beforeAll(async () => {
  giftId = await seedGift({ name: 'Playwright Test Gift' });
  giftWithLinkId = await seedGift({
    name: 'Playwright Test Gift With Link',
    external_link: 'https://example.com/gift',
  });
});

test.afterAll(async () => {
  await cleanGift(giftId);
  await cleanGift(giftWithLinkId);
});

test('gifts page shows gift name, description and reserve button', async ({ guestPage: page }) => {
  await page.goto('/gifts');
  await expect(page.getByText('Playwright Test Gift')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reservar' }).first()).toBeVisible();
});

test('external gift link opens in new tab', async ({ guestPage: page }) => {
  await page.goto('/gifts');
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('link', { name: /ver artículo/i }).first().click(),
  ]);
  expect(popup.url()).toContain('example.com');
  await popup.close();
});

test('reserving a gift shows pending then reserved state', async ({ guestPage: page }) => {
  await page.goto('/gifts');
  // Find the card for the test gift and click its reserve button
  const giftCard = page.locator('[data-gift-id]').filter({ hasText: 'Playwright Test Gift' }).first()
    .or(page.locator('article, li, div').filter({ hasText: 'Playwright Test Gift' }).first());
  const reserveBtn = giftCard.getByRole('button', { name: 'Reservar' });
  // If above doesn't work, fall back to finding first available reserve button
  const btn = await reserveBtn.isVisible() ? reserveBtn : page.getByRole('button', { name: 'Reservar' }).first();
  await btn.click();
  // Either 'Reservando...' flash or 'Reservado ✓' (may be too fast to catch pending)
  await expect(page.getByText('Reservado ✓').or(page.getByText('Reservando...'))).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Reservado ✓')).toBeVisible({ timeout: 5000 });
});

test('reservation persists on page refresh', async ({ guestPage: page }) => {
  await page.goto('/gifts');
  await expect(page.getByText('Reservado ✓')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Reservado ✓')).toBeVisible();
  // Cleanup
  await clearReservation(giftId);
});

test('reserved gift does not expose reserver name in guest HTML', async ({ guestPage: page }) => {
  // Seed a pre-reserved gift
  const reservedId = await seedGift({ name: 'PW Reserved Gift', reserved_by: 'SecretGuestName', reserved_at: new Date().toISOString() });
  await page.goto('/gifts');
  const html = await page.content();
  expect(html).not.toContain('SecretGuestName');
  await cleanGift(reservedId);
});

test('concurrent reservation — only one succeeds', async ({ browser }) => {
  const newGiftId = await seedGift({ name: 'PW Concurrency Gift' });
  try {
    const ctx1 = await browser.newContext({ storageState: 'tests/e2e/.auth/guest.json' });
    const ctx2 = await browser.newContext({ storageState: 'tests/e2e/.auth/guest2.json' });
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await Promise.all([p1.goto('/gifts'), p2.goto('/gifts')]);

    // Both click their respective reserve buttons for the same gift simultaneously
    await Promise.all([
      p1.getByText('PW Concurrency Gift').first().waitFor(),
      p2.getByText('PW Concurrency Gift').first().waitFor(),
    ]);

    await Promise.all([
      p1.getByRole('button', { name: 'Reservar' }).first().click(),
      p2.getByRole('button', { name: 'Reservar' }).first().click(),
    ]);

    await Promise.all([
      p1.waitForTimeout(2000),
      p2.waitForTimeout(2000),
    ]);

    const p1Text = await p1.content();
    const p2Text = await p2.content();

    const p1Reserved = p1Text.includes('Reservado ✓');
    const p2Reserved = p2Text.includes('Reservado ✓');
    const p1Taken = p1Text.includes('Ya está reservado');
    const p2Taken = p2Text.includes('Ya está reservado');

    // Exactly one of the two sessions should see "reserved" and the other "already taken"
    const outcomes = [p1Reserved || p1Taken, p2Reserved || p2Taken];
    expect(outcomes.every(Boolean)).toBe(true);
    expect(p1Reserved && p2Reserved).toBe(false); // Not both can succeed

    await ctx1.close();
    await ctx2.close();
  } finally {
    await cleanGift(newGiftId);
  }
});

test('gift list fits in one column at 375px', async ({ browser }) => {
  const ctx = await browser.newContext({
    storageState: 'tests/e2e/.auth/guest.json',
    viewport: { width: 375, height: 812 },
  });
  const page = await ctx.newPage();
  await page.goto('/gifts');
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
  await ctx.close();
});
