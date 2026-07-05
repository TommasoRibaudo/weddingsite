import { test, expect } from './fixtures/auth';
import { seedGift, cleanGift } from './helpers/supabase';

// §9 Admin Gifts

let giftId: string;

test.beforeAll(async () => {
  giftId = await seedGift({ name: 'PW Admin Test Gift' });
});

test.afterAll(async () => {
  await cleanGift(giftId);
});

test('admin gift list shows gift names and status columns', async ({ adminPage: page }) => {
  await page.goto('/tomma/bobba');
  await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Gifted by' })).toBeVisible();
  await expect(page.getByText('PW Admin Test Gift')).toBeVisible();
});

test('admin sees who reserved a gift and can un-reserve it', async ({ browser }) => {
  // Step 1: Reserve the gift as guest
  const guestCtx = await browser.newContext({ storageState: 'tests/e2e/.auth/guest.json' });
  const guestPage = await guestCtx.newPage();
  await guestPage.goto('/gifts');
  // Find and reserve the admin test gift
  const card = guestPage.locator('article, li, div').filter({ hasText: 'PW Admin Test Gift' }).first();
  const reserveBtn = card.getByRole('button', { name: 'Reservar' });
  if (await reserveBtn.isVisible()) {
    await reserveBtn.click();
    await expect(guestPage.getByText('Reservado ✓')).toBeVisible({ timeout: 5000 });
  }
  await guestCtx.close();

  // Step 2: Admin sees reserver name
  const adminCtx = await browser.newContext({ storageState: 'tests/e2e/.auth/admin.json' });
  const adminPage = await adminCtx.newPage();
  await adminPage.goto('/tomma/bobba');
  await expect(adminPage.getByText('TestGuest')).toBeVisible({ timeout: 5000 });

  // Step 3: Admin un-reserves
  const row = adminPage.getByRole('row').filter({ hasText: 'PW Admin Test Gift' });
  await row.getByRole('button', { name: 'Un-reserve' }).click();
  await adminPage.waitForTimeout(2000);
  // Gift should now show Available status
  await expect(row.getByText('Available')).toBeVisible({ timeout: 5000 });

  // Step 4: Guest page shows "Reservar" again
  const verifyCtx = await browser.newContext({ storageState: 'tests/e2e/.auth/guest.json' });
  const verifyPage = await verifyCtx.newPage();
  await verifyPage.goto('/gifts');
  const verifyCard = verifyPage.locator('article, li, div').filter({ hasText: 'PW Admin Test Gift' }).first();
  await expect(verifyCard.getByRole('button', { name: 'Reservar' })).toBeVisible({ timeout: 5000 });
  await verifyCtx.close();
  await adminCtx.close();
});
