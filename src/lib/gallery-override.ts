import { adminSupabase } from './supabase/admin';
import { galleryIsOpen } from './gallery-window';

export type GalleryOverride = 'open' | 'closed' | null;

type SupabaseError = {
  code?: string;
  message?: string;
};

const MISSING_SETTINGS_MESSAGE =
  'Gallery override table is missing. Run the gallery_settings section of supabase/schema.sql in Supabase, then reload the app.';

function normalizeGalleryOverride(value: unknown): GalleryOverride {
  return value === 'open' || value === 'closed' ? value : null;
}

function isMissingGallerySettingsTable(error: SupabaseError): boolean {
  const message = error.message ?? '';
  return (
    error.code === 'PGRST205' ||
    (message.includes('gallery_settings') &&
      (message.includes('Could not find the table') || message.includes('schema cache')))
  );
}

export async function getGalleryOverride(): Promise<GalleryOverride> {
  const { data, error } = await adminSupabase
    .from('gallery_settings')
    .select('override')
    .eq('id', 1)
    .maybeSingle();
  if (error) {
    if (isMissingGallerySettingsTable(error)) return null;
    throw new Error(`Failed to read gallery override: ${error.message}`);
  }
  return normalizeGalleryOverride(data?.override);
}

export async function isGalleryOpenNow(): Promise<boolean> {
  const override = await getGalleryOverride();
  if (override === 'open') return true;
  if (override === 'closed') return false;
  return galleryIsOpen();
}

export async function setGalleryOverride(override: GalleryOverride): Promise<void> {
  const row = { id: 1, override, updated_at: new Date().toISOString() };
  const { data, error } = await adminSupabase
    .from('gallery_settings')
    .update(row)
    .eq('id', 1)
    .select('id')
    .maybeSingle();

  if (error) {
    if (isMissingGallerySettingsTable(error)) throw new Error(MISSING_SETTINGS_MESSAGE);
    throw new Error(`Failed to update gallery override: ${error.message}`);
  }
  if (data) return;

  const insertResult = await adminSupabase
    .from('gallery_settings')
    .insert(row);
  if (insertResult.error) {
    if (isMissingGallerySettingsTable(insertResult.error)) throw new Error(MISSING_SETTINGS_MESSAGE);
    throw new Error(`Failed to create gallery override setting: ${insertResult.error.message}`);
  }
}
