import { test, expect } from './fixtures/auth';
import { seedPhoto, cleanPhoto } from './helpers/supabase';

// §7 Gallery Pagination

const seededIds: string[] = [];

test.beforeAll(async () => {
  // Seed 25 text-only posts to guarantee pagination triggers
  for (let i = 0; i < 25; i++) {
    const id = await seedPhoto({
      uploaded_by: 'TestGuest',
      body: `Pagination test post ${i + 1}`,
    });
    seededIds.push(id);
  }
});

test.afterAll(async () => {
  for (const id of seededIds) {
    await cleanPhoto(id);
  }
});

test('first page loads and "Cargar más" is visible', async ({ guestPage: page }) => {
  await page.goto('/gallery');
  // Feed should render posts
  await expect(page.getByText('Pagination test post')).toBeVisible({ timeout: 10000 });
  // Load more button should appear when there are >24 items
  await expect(page.getByRole('button', { name: 'Cargar más' })).toBeVisible();
});

test('"Cargar más" appends more posts to the feed', async ({ guestPage: page }) => {
  await page.goto('/gallery');
  await expect(page.getByRole('button', { name: 'Cargar más' })).toBeVisible({ timeout: 10000 });
  // Count items before loading more
  const before = await page.locator('button[aria-label*="Abrir"]').count();
  await page.getByRole('button', { name: 'Cargar más' }).click();
  await page.waitForTimeout(2000);
  const after = await page.locator('button[aria-label*="Abrir"]').count();
  expect(after).toBeGreaterThan(before);
});
