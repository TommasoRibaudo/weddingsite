'use server';
import { compareSync } from 'bcryptjs';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { adminSupabase } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function adminLogin(formData: FormData) {
  const password = formData.get('password') as string;
  const valid = compareSync(password, process.env.ADMIN_PASSWORD_HASH!);
  if (!valid) return { error: 'Incorrect admin password.' };

  const session = await getSession();
  session.isAdmin = true;
  session.access = true;
  session.guestName = 'Admin';
  await session.save();
  redirect('/admin');
}

export async function adminLogout() {
  const session = await getSession();
  session.isAdmin = false;
  session.access = false;
  session.guestName = '';
  await session.save();
  redirect('/admin/login');
}

export async function deletePhoto(photoId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  const result = await adminSupabase
    .from('photos')
    .select('storage_path, thumbnail_path')
    .eq('id', photoId)
    .single();
  const photo = result.data as { storage_path: string; thumbnail_path: string | null } | null;

  if (!photo) return { error: 'Photo not found.' };

  const pathsToDelete = [photo.storage_path, photo.thumbnail_path].filter(Boolean) as string[];
  await adminSupabase.storage.from('wedding-photos').remove(pathsToDelete);

  await adminSupabase.from('photos').delete().eq('id', photoId);

  revalidatePath('/gallery');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteComment(commentId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  await adminSupabase.from('comments').delete().eq('id', commentId);

  revalidatePath('/gallery');
  revalidatePath('/admin');
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminSupabase.from('gifts') as any).insert({ name, description, external_link, price, image_url });

  if (error) return { error: 'Failed to add gift.' };

  revalidatePath('/gifts');
  revalidatePath('/admin');
  return { ok: true };
}
