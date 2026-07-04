import { createClient } from '@supabase/supabase-js';

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

export async function seedGift(overrides: Record<string, unknown> = {}) {
  const db = getDb();
  const gift = {
    name: 'Playwright Test Gift',
    description: 'Auto-seeded for tests',
    price: 100,
    divideable: false,
    ...overrides,
  };
  const { data, error } = await db.from('gifts').insert(gift).select('id').single();
  if (error) throw new Error(`seedGift failed: ${error.message}`);
  return (data as { id: string }).id;
}

export async function cleanGift(id: string) {
  const db = getDb();
  await db.from('gift_contributions').delete().eq('gift_id', id);
  await db.from('gifts').delete().eq('id', id);
}

export async function cleanGiftsByName(name: string) {
  const db = getDb();
  const { data } = await db.from('gifts').select('id').eq('name', name);
  for (const g of (data ?? []) as { id: string }[]) {
    await cleanGift(g.id);
  }
}

export async function clearReservation(id: string) {
  const db = getDb();
  await db.from('gifts').update({ reserved_by: null, reserved_at: null }).eq('id', id);
}

export async function seedPhoto(overrides: Record<string, unknown> = {}) {
  const db = getDb();
  const photo = {
    storage_path: null,
    thumbnail_path: null,
    uploaded_by: 'TestGuest',
    body: 'Playwright test note',
    ...overrides,
  };
  const { data, error } = await db.from('photos').insert(photo).select('id').single();
  if (error) throw new Error(`seedPhoto failed: ${error.message}`);
  return (data as { id: string }).id;
}

export async function cleanPhoto(id: string) {
  const db = getDb();
  await db.from('comments').delete().eq('photo_id', id);
  await db.from('photo_likes').delete().eq('photo_id', id);
  await db.from('photos').delete().eq('id', id);
}

export async function cleanPhotosByUploader(uploader: string) {
  const db = getDb();
  const { data } = await db.from('photos').select('id').eq('uploaded_by', uploader);
  for (const p of (data ?? []) as { id: string }[]) {
    await cleanPhoto(p.id);
  }
}

export async function seedComment(photoId: string, overrides: Record<string, unknown> = {}) {
  const db = getDb();
  const comment = {
    photo_id: photoId,
    body: 'Playwright test comment',
    author: 'TestGuest',
    ...overrides,
  };
  const { data, error } = await db.from('comments').insert(comment).select('id').single();
  if (error) throw new Error(`seedComment failed: ${error.message}`);
  return (data as { id: string }).id;
}

export async function cleanComment(id: string) {
  const db = getDb();
  await db.from('comments').delete().eq('id', id);
}
