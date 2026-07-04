'use server';
import { compareSync } from 'bcryptjs';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { adminSupabase } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { setGalleryOverride, type GalleryOverride } from '@/lib/gallery-override';

export async function adminLogin(formData: FormData) {
  const password = formData.get('password') as string;
  const valid = compareSync(password, process.env.ADMIN_PASSWORD_HASH!);
  if (!valid) return { error: 'Incorrect admin password.' };

  const session = await getSession();
  session.isAdmin = true;
  session.access = true;
  session.guestName = 'Admin';
  await session.save();
  redirect('/tomma/bobba');
}

export async function adminLogout() {
  const session = await getSession();
  session.isAdmin = false;
  session.access = false;
  session.guestName = '';
  await session.save();
  redirect('/tomma/bobba/login');
}

export async function updateGalleryOverride(override: GalleryOverride) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };
  if (override !== null && override !== 'open' && override !== 'closed') {
    return { error: 'Invalid override value.' };
  }

  try {
    await setGalleryOverride(override);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update gallery override.',
    };
  }

  revalidatePath('/gallery');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function deletePhoto(photoId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  const result = await adminSupabase
    .from('photos')
    .select('storage_path, thumbnail_path')
    .eq('id', photoId)
    .single();
  const photo = result.data as { storage_path: string | null; thumbnail_path: string | null } | null;

  if (!photo) return { error: 'Photo not found.' };

  const pathsToDelete = [photo.storage_path, photo.thumbnail_path].filter(Boolean) as string[];
  if (pathsToDelete.length > 0) {
    await adminSupabase.storage.from('wedding-photos').remove(pathsToDelete);
  }

  await adminSupabase.from('photos').delete().eq('id', photoId);

  revalidatePath('/gallery');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function deleteComment(commentId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  await adminSupabase.from('comments').delete().eq('id', commentId);

  revalidatePath('/gallery');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function addGift(formData: FormData) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Name is required.' };

  const description = (formData.get('description') as string)?.trim() || null;
  const external_link = (formData.get('external_link') as string)?.trim() || null;
  const price = formData.get('price') ? Number(formData.get('price')) : null;
  const image_url = (formData.get('image_url') as string)?.trim() || null;
  const divideable = formData.get('divideable') === 'on';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminSupabase.from('gifts') as any).insert({ name, description, external_link, price, image_url, divideable });

  if (error) return { error: 'Failed to add gift.' };

  revalidatePath('/gifts');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function updateGift(formData: FormData) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  const giftId = (formData.get('giftId') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  if (!giftId) return { error: 'Gift is required.' };
  if (!name) return { error: 'Name is required.' };

  const description = (formData.get('description') as string)?.trim() || null;
  const external_link = (formData.get('external_link') as string)?.trim() || null;
  const image_url = (formData.get('image_url') as string)?.trim() || null;
  const rawPrice = (formData.get('price') as string)?.trim();
  const price = rawPrice ? Number(rawPrice) : null;

  if (price !== null && !Number.isFinite(price)) {
    return { error: 'Price must be a valid number.' };
  }

  const divideable = formData.get('divideable') === 'on';
  const giftUpdate = { name, description, external_link, price, image_url, divideable } as never;

  const { error } = await adminSupabase.from('gifts').update(giftUpdate).eq('id', giftId);

  if (error) return { error: 'Failed to update gift.' };

  revalidatePath('/gifts');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function removeContribution(contributionId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  await adminSupabase.from('gift_contributions').delete().eq('id', contributionId);

  revalidatePath('/gifts');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function deleteGift(giftId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };
  if (!giftId) return { error: 'Gift is required.' };

  const { error } = await adminSupabase.from('gifts').delete().eq('id', giftId);

  if (error) return { error: 'Failed to delete gift.' };

  revalidatePath('/gifts');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}
