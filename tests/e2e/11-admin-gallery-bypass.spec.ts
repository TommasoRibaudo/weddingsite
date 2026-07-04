import { test, expect } from './fixtures/auth';
import { cleanPhotosByUploader } from './helpers/supabase';
import path from 'path';
import fs from 'fs';
import os from 'os';

// §11 Admin Gallery Bypass
// Run via: npm run test:e2e:locked
// Requires PLAYWRIGHT_GALLERY_LOCKED=true on the Next.js server.

function makeMinimalJpeg(): Buffer {
  return Buffer.from(
    'ffd8ffe000104a464946000101000001000100' +
    '00ffdb004300080606070605080707070909' +
    '0808090c140d0c0b0b0c1912130f141d1a1f' +
    '1e1d1a1c1c20242e2720222c231c1c283729' +
    '2c30313434341f27393d38323c2e333432ff' +
    'c0000b080001000101011100ffc4001f0000' +
    '0105010101010100000000000000000102030' +
    '40506070809ffda0008010100003f00bef7ff' +
    'd9',
    'hex',
  );
}

test.afterAll(async () => {
  await cleanPhotosByUploader('Admin');
});

test('admin sees gallery controls even when window is closed', async ({ adminPage: page }) => {
  await page.goto('/gallery');
  // Admin should see the upload zone even in locked state
  await expect(page.locator('[aria-label="Subir fotos"]')).toBeVisible();
  // Should NOT see the locked placeholder
  await expect(page.getByText('El feed abre el día de nuestra boda')).not.toBeVisible();
});

test('admin can upload a photo outside the gallery window', async ({ adminPage: page }) => {
  const filePath = path.join(os.tmpdir(), 'admin-bypass-upload.jpg');
  fs.writeFileSync(filePath, makeMinimalJpeg());

  await page.goto('/gallery');
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await page.waitForTimeout(10000);

  // No error should appear for admin
  const errorVisible = await page.locator('ul li span.text-red-500').isVisible();
  expect(errorVisible).toBe(false);

  fs.unlinkSync(filePath);
});

test('admin can post a comment outside the gallery window', async ({ adminPage: page }) => {
  await page.goto('/gallery');
  // Open first post
  const firstPost = page.locator('button[aria-label*="Abrir"]').first();
  if (await firstPost.isVisible()) {
    await firstPost.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const commentInput = page.getByPlaceholder('Agregar un comentario...');
    await commentInput.fill('Admin bypass comment');
    await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click();
    await expect(page.getByText('Admin bypass comment')).toBeVisible({ timeout: 5000 });
  }
});
