'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import sharp from 'sharp';
import { revalidatePath } from 'next/cache';

export type GuestProfile = {
  guest_name: string;
  bio: string | null;
  photo_path: string | null;
  photo_url: string | null;
};

type ProfileRow = { guest_name: string; bio: string | null; photo_path: string | null };

async function signProfileUrl(photo_path: string | null): Promise<string | null> {
  if (!photo_path) return null;
  const { data } = await adminSupabase.storage
    .from('profile-photos')
    .createSignedUrl(photo_path, 3600);
  return data?.signedUrl ?? null;
}

export async function getMyProfile(): Promise<GuestProfile | null> {
  const session = await getSession();
  if (!session.access) return null;

  const { data } = await adminSupabase
    .from('guest_profiles')
    .select('guest_name, bio, photo_path')
    .eq('guest_name', session.guestName)
    .maybeSingle();

  const row = data as ProfileRow | null;
  if (!row) return { guest_name: session.guestName, bio: null, photo_path: null, photo_url: null };

  return { ...row, photo_url: await signProfileUrl(row.photo_path) };
}

export async function getGuestProfile(guestName: string): Promise<GuestProfile | null> {
  const session = await getSession();
  if (!session.access) return null;

  const { data } = await adminSupabase
    .from('guest_profiles')
    .select('guest_name, bio, photo_path')
    .eq('guest_name', guestName)
    .maybeSingle();

  const row = data as ProfileRow | null;
  if (!row) return { guest_name: guestName, bio: null, photo_path: null, photo_url: null };

  return { ...row, photo_url: await signProfileUrl(row.photo_path) };
}

export async function getGuestProfiles(
  guestNames: string[],
): Promise<Record<string, { bio: string | null; photo_url: string | null }>> {
  if (guestNames.length === 0) return {};
  const session = await getSession();
  if (!session.access) return {};

  const { data } = await adminSupabase
    .from('guest_profiles')
    .select('guest_name, bio, photo_path')
    .in('guest_name', guestNames);

  const rows = (data ?? []) as ProfileRow[];
  const photoPaths = rows.map((r) => r.photo_path).filter((p): p is string => Boolean(p));

  const urlMap: Record<string, string> = {};
  if (photoPaths.length > 0) {
    const { data: urlData } = await adminSupabase.storage
      .from('profile-photos')
      .createSignedUrls(photoPaths, 3600);
    for (const item of urlData ?? []) {
      if (item.signedUrl && item.path) urlMap[item.path] = item.signedUrl;
    }
  }

  const result: Record<string, { bio: string | null; photo_url: string | null }> = {};
  for (const row of rows) {
    result[row.guest_name] = {
      bio: row.bio,
      photo_url: row.photo_path ? (urlMap[row.photo_path] ?? null) : null,
    };
  }
  return result;
}

export async function updateProfile(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };

  const bio = (formData.get('bio') as string | null)?.trim().slice(0, 500) ?? null;
  const photoFile = formData.get('photo') as File | null;

  let newPhotoPath: string | undefined;

  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > 5 * 1024 * 1024) return { error: 'Photo must be under 5 MB.' };

    const buffer = Buffer.from(await photoFile.arrayBuffer());

    let processed: Buffer;
    try {
      processed = await sharp(buffer)
        .rotate()
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 82 })
        .toBuffer();
    } catch {
      return { error: 'Failed to process image.' };
    }

    const path = `profiles/${session.guestName}`;
    const { error: uploadError } = await adminSupabase.storage
      .from('profile-photos')
      .upload(path, processed, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) return { error: 'Failed to upload photo.' };
    newPhotoPath = path;
  }

  const { data: existing } = await adminSupabase
    .from('guest_profiles')
    .select('guest_name')
    .eq('guest_name', session.guestName)
    .maybeSingle();

  if (existing) {
    const updateData: { bio: string | null; updated_at: string; photo_path?: string } = {
      bio: bio || null,
      updated_at: new Date().toISOString(),
    };
    if (newPhotoPath !== undefined) updateData.photo_path = newPhotoPath;

    const { error } = await adminSupabase
      .from('guest_profiles')
      .update(updateData as unknown as never)
      .eq('guest_name', session.guestName);
    if (error) return { error: 'Failed to save profile.' };
  } else {
    const { error } = await adminSupabase.from('guest_profiles').insert({
      guest_name: session.guestName,
      bio: bio || null,
      photo_path: newPhotoPath ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: 'Failed to save profile.' };
  }

  revalidatePath('/gallery');
  return { ok: true };
}
