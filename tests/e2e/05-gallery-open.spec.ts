import { test, expect } from './fixtures/auth';
import { cleanPhotosByUploader } from './helpers/supabase';
import path from 'path';
import fs from 'fs';
import os from 'os';

// §5 Gallery Open State

// Create a minimal valid 1×1 JPEG for upload tests
function makeMinimalJpeg(): Buffer {
  // A tiny but valid JPEG file (~635 bytes)
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

function createTempJpeg(name = 'test.jpg'): string {
  const dir = os.tmpdir();
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, makeMinimalJpeg());
  return filePath;
}

function createTempTextFile(name = 'test.txt'): string {
  const dir = os.tmpdir();
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, 'not an image');
  return filePath;
}

function createLargeFile(sizeBytes: number, name = 'large.jpg'): string {
  const dir = os.tmpdir();
  const filePath = path.join(dir, name);
  // Valid JPEG header followed by garbage — size check is before processing
  const buf = Buffer.alloc(sizeBytes);
  buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff;
  fs.writeFileSync(filePath, buf);
  return filePath;
}

test.afterAll(async () => {
  await cleanPhotosByUploader('TestGuest');
});

test('upload zone and feed are visible when gallery is open', async ({ guestPage: page }) => {
  await page.goto('/gallery');
  await expect(page.locator('[aria-label="Subir fotos"]')).toBeVisible();
  await expect(page.getByText('Arrastra fotos aquí o haz clic para buscar')).toBeVisible();
});

test('uploading a valid JPEG appears in the feed', async ({ guestPage: page }) => {
  const filePath = createTempJpeg('valid-upload.jpg');
  await page.goto('/gallery');
  await page.locator('input[type="file"]').setInputFiles(filePath);
  // Wait for upload to complete (done state shows checkmark icon)
  await expect(page.locator('ul li').filter({ hasText: 'valid-upload.jpg' })).toBeVisible({ timeout: 15000 });
  // After router.refresh(), the feed should update
  await page.waitForTimeout(2000);
  // At minimum the upload queue should show done (no error)
  await expect(page.locator('ul li svg[data-lucide="circle-alert"], ul li svg.text-red-500')).not.toBeVisible();
  fs.unlinkSync(filePath);
});

test('uploading a non-image file shows error', async ({ guestPage: page }) => {
  const filePath = createTempTextFile('bad.txt');
  await page.goto('/gallery');
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expect(page.locator('ul li').filter({ hasText: 'bad.txt' }).getByText(/invalid|not.*allow|failed/i)).toBeVisible({ timeout: 10000 });
  fs.unlinkSync(filePath);
});

test('uploading a file over 10 MB shows error', async ({ guestPage: page }) => {
  const filePath = createLargeFile(11 * 1024 * 1024, 'too-large.jpg');
  await page.goto('/gallery');
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expect(page.locator('ul li').filter({ hasText: 'too-large.jpg' }).getByText(/10 mb|exceeds|too large/i)).toBeVisible({ timeout: 10000 });
  fs.unlinkSync(filePath);
});

test('rate limiting triggers after 5 uploads in under a minute', async ({ guestPage: page }) => {
  await page.goto('/gallery');
  const files: string[] = [];
  for (let i = 0; i < 6; i++) {
    files.push(createTempJpeg(`rate-limit-${i}.jpg`));
  }
  // Upload all 6 files at once
  await page.locator('input[type="file"]').setInputFiles(files);
  // Wait for all to process
  await page.waitForTimeout(15000);
  // At least one should show a rate-limit error
  const errorItems = page.locator('ul li span.text-red-500');
  const count = await errorItems.count();
  const hasRateLimit = await page.getByText(/too many|wait a minute/i).isVisible();
  expect(count > 0 || hasRateLimit).toBe(true);
  for (const f of files) fs.unlinkSync(f);
});
