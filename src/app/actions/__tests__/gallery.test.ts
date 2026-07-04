import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSession = {
  access: true,
  guestName: 'Guest One',
  isAdmin: false,
};

const isGalleryOpenNow = vi.fn(() => Promise.resolve(true));
const revalidatePath = vi.fn();
const from = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock('@/lib/gallery-override', () => ({
  isGalleryOpenNow,
}));

vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: { from },
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

vi.mock('@/app/actions/profile', () => ({
  getGuestProfiles: vi.fn(() => Promise.resolve({})),
}));

function insertResult(data: unknown, error: unknown = null) {
  const builder = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  return builder;
}

describe('gallery actions', () => {
  beforeEach(() => {
    mockSession.access = true;
    mockSession.guestName = 'Guest One';
    mockSession.isAdmin = false;
    isGalleryOpenNow.mockResolvedValue(true);
    from.mockReset();
    revalidatePath.mockReset();
  });

  it('rejects comments from unauthenticated guests', async () => {
    mockSession.access = false;
    const { postComment } = await import('@/app/actions/gallery');

    await expect(postComment('photo-1', 'Nice photo')).resolves.toEqual({ error: 'Not authenticated.' });
    expect(from).not.toHaveBeenCalled();
  });

  it('rejects comments while the gallery is closed for non-admin guests', async () => {
    isGalleryOpenNow.mockResolvedValue(false);
    const { postComment } = await import('@/app/actions/gallery');

    await expect(postComment('photo-1', 'Nice photo')).resolves.toEqual({ error: 'Gallery not open.' });
    expect(from).not.toHaveBeenCalled();
  });

  it('allows admins to comment while the gallery is closed', async () => {
    mockSession.isAdmin = true;
    isGalleryOpenNow.mockResolvedValue(false);
    const comment = {
      id: 'comment-1',
      photo_id: 'photo-1',
      body: 'Nice photo',
      author: 'Guest One',
      created_at: '2026-06-29T00:00:00Z',
    };
    from.mockReturnValueOnce(insertResult(comment));
    const { postComment } = await import('@/app/actions/gallery');

    await expect(postComment('photo-1', ' Nice photo ')).resolves.toEqual({ ok: true, comment });
    expect(revalidatePath).toHaveBeenCalledWith('/gallery');
  });

  it('rejects empty text posts before inserting a feed item', async () => {
    const { postTextPost } = await import('@/app/actions/gallery');

    await expect(postTextPost('   ')).resolves.toEqual({ error: 'Message cannot be empty.' });
    expect(from).not.toHaveBeenCalled();
  });
});
