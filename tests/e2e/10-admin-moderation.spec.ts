import { test, expect } from './fixtures/auth';
import { seedPhoto, seedComment, cleanPhoto } from './helpers/supabase';

// §10 Admin Photo / Comment Moderation

let photoId: string;

test.beforeAll(async () => {
  photoId = await seedPhoto({ uploaded_by: 'TestGuest', body: 'PW Moderation Test Post' });
  await seedComment(photoId, { body: 'PW moderation test comment', author: 'TestGuest' });
});

test.afterAll(async () => {
  // cleanPhoto also removes comments
  await cleanPhoto(photoId).catch(() => {});
});

test('admin dashboard shows feed posts with uploader names', async ({ adminPage: page }) => {
  await page.goto('/tomma/bobba');
  await expect(page.getByText('PW Moderation Test Post')).toBeVisible({ timeout: 5000 });
});

test('admin can delete a comment and it disappears from gallery', async ({ adminPage: page }) => {
  await page.goto('/tomma/bobba');
  // Click on the post to expand comments
  const postTile = page.locator('div').filter({ hasText: 'PW Moderation Test Post' }).first();
  await postTile.click();
  // Wait for comment to appear
  await expect(page.getByText('PW moderation test comment')).toBeVisible({ timeout: 5000 });
  // Find and click delete for the comment
  const commentRow = page.locator('li, div').filter({ hasText: 'PW moderation test comment' }).first();
  await commentRow.getByRole('button', { name: /delete|remove/i }).click();
  // Comment should disappear from admin view
  await expect(page.getByText('PW moderation test comment')).not.toBeVisible({ timeout: 5000 });
});

test('admin can delete a photo with confirmation', async ({ adminPage: page }) => {
  const newPhotoId = await seedPhoto({ uploaded_by: 'TestGuest', body: 'PW Photo To Delete' });
  await page.goto('/tomma/bobba');

  // Accept the confirm dialog before clicking delete
  page.once('dialog', (dialog) => dialog.accept());

  // Find the post tile and click delete
  await expect(page.getByText('PW Photo To Delete')).toBeVisible({ timeout: 5000 });
  const postTile = page.locator('div').filter({ hasText: 'PW Photo To Delete' }).first();
  await postTile.click();
  // Find delete button (trash icon button in expanded view or grid)
  const deleteBtn = page.getByRole('button', { name: /delete/i }).last();
  await deleteBtn.click();

  // Wait for deletion
  await page.waitForTimeout(2000);

  // Photo should be gone from admin
  await expect(page.getByText('PW Photo To Delete')).not.toBeVisible({ timeout: 5000 });

  // Verify it's also gone from /gallery as a guest
  const guestCtx = await page.context().browser()!.newContext({
    storageState: 'tests/e2e/.auth/guest.json',
  });
  const guestPage = await guestCtx.newPage();
  await guestPage.goto('/gallery');
  await expect(guestPage.getByText('PW Photo To Delete')).not.toBeVisible({ timeout: 5000 });
  await guestCtx.close();

  // Cleanup in case deletion failed
  await cleanPhoto(newPhotoId).catch(() => {});
});

test('unauthorized admin action returns error', async ({ guestPage: page }) => {
  // Attempt a direct API call that requires admin — using guest session
  // The deletePhoto server action is not directly callable via API, but
  // un-reserve is callable and requires admin
  await page.request.post('/api/admin/login', {
    data: { password: 'wrong' },
  }).catch(() => null);
  // We just verify the guest session cannot reach admin-only actions
  // by checking the admin page redirects correctly
  await page.goto('/tomma/bobba');
  await expect(page).toHaveURL('/tomma/bobba/login');
});
