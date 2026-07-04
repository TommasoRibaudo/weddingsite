import { test, expect } from './fixtures/auth';

// §4 Gallery Locked State
// Run via: npm run test:e2e:locked
// Requires PLAYWRIGHT_GALLERY_LOCKED=true in the Next.js server environment.

test.describe('gallery locked state', () => {
  test('shows locked placeholder with correct text', async ({ guestPage: page }) => {
    await page.goto('/gallery');
    await expect(page.getByText('El feed abre el día de nuestra boda')).toBeVisible();
  });

  test('no upload zone visible when locked', async ({ guestPage: page }) => {
    await page.goto('/gallery');
    await expect(page.getByRole('button', { name: /subir fotos/i })).not.toBeVisible();
    await expect(page.locator('[aria-label="Subir fotos"]')).not.toBeVisible();
  });

  test('no photo grid or modal access when locked', async ({ guestPage: page }) => {
    await page.goto('/gallery');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    // Verify the gallery feed area is not rendered
    await expect(page.getByRole('button', { name: 'Cargar más' })).not.toBeVisible();
  });

  test('direct upload API returns 403 when gallery is locked', async ({ guestPage: page }) => {
    // Use request context that carries the guest session cookie
    const response = await page.request.post('/api/gallery/upload', {
      multipart: {
        file: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // JPEG magic bytes
        },
      },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('not open');
  });
});
