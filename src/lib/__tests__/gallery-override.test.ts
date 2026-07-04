import { beforeEach, describe, expect, it, vi } from 'vitest';

const galleryIsOpen = vi.fn();
const table = {
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
};
const selectQuery = {
  eq: vi.fn(),
};
const updateQuery = {
  eq: vi.fn(),
};
const updateSelectQuery = {
  select: vi.fn(),
};
const updateMaybeSingleQuery = {
  maybeSingle: vi.fn(),
};

const missingSettingsTableError = {
  code: 'PGRST205',
  message: "Could not find the table 'public.gallery_settings' in the schema cache",
};

vi.mock('@/lib/gallery-window', () => ({
  galleryIsOpen,
}));

vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: {
    from: vi.fn(() => table),
  },
}));

describe('gallery override', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    table.select.mockReturnValue(selectQuery);
    selectQuery.eq.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { override: null }, error: null }),
    });

    table.update.mockReturnValue(updateQuery);
    updateQuery.eq.mockReturnValue(updateSelectQuery);
    updateSelectQuery.select.mockReturnValue(updateMaybeSingleQuery);
    updateMaybeSingleQuery.maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null });

    table.insert.mockResolvedValue({ error: null });
    galleryIsOpen.mockReturnValue(false);
  });

  it('force opens the gallery regardless of the schedule', async () => {
    selectQuery.eq.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { override: 'open' }, error: null }),
    });
    const { isGalleryOpenNow } = await import('@/lib/gallery-override');

    await expect(isGalleryOpenNow()).resolves.toBe(true);
    expect(galleryIsOpen).not.toHaveBeenCalled();
  });

  it('force closes the gallery regardless of the schedule', async () => {
    selectQuery.eq.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { override: 'closed' }, error: null }),
    });
    galleryIsOpen.mockReturnValue(true);
    const { isGalleryOpenNow } = await import('@/lib/gallery-override');

    await expect(isGalleryOpenNow()).resolves.toBe(false);
    expect(galleryIsOpen).not.toHaveBeenCalled();
  });

  it('uses the schedule when the override is automatic', async () => {
    galleryIsOpen.mockReturnValue(true);
    const { isGalleryOpenNow } = await import('@/lib/gallery-override');

    await expect(isGalleryOpenNow()).resolves.toBe(true);
    expect(galleryIsOpen).toHaveBeenCalledOnce();
  });

  it('uses the schedule when the settings table is missing', async () => {
    selectQuery.eq.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: missingSettingsTableError }),
    });
    galleryIsOpen.mockReturnValue(true);
    const { isGalleryOpenNow } = await import('@/lib/gallery-override');

    await expect(isGalleryOpenNow()).resolves.toBe(true);
    expect(galleryIsOpen).toHaveBeenCalledOnce();
  });

  it('updates the singleton override row', async () => {
    const { setGalleryOverride } = await import('@/lib/gallery-override');

    await setGalleryOverride('open');

    expect(table.update).toHaveBeenCalledWith(expect.objectContaining({ id: 1, override: 'open' }));
    expect(table.insert).not.toHaveBeenCalled();
  });

  it('creates the singleton override row if it is missing', async () => {
    updateMaybeSingleQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    const { setGalleryOverride } = await import('@/lib/gallery-override');

    await setGalleryOverride('closed');

    expect(table.insert).toHaveBeenCalledWith(expect.objectContaining({ id: 1, override: 'closed' }));
  });

  it('reports a setup error when saving without the settings table', async () => {
    updateMaybeSingleQuery.maybeSingle.mockResolvedValue({ data: null, error: missingSettingsTableError });
    const { setGalleryOverride } = await import('@/lib/gallery-override');

    await expect(setGalleryOverride('open')).rejects.toThrow('Gallery override table is missing');
    expect(table.insert).not.toHaveBeenCalled();
  });
});
