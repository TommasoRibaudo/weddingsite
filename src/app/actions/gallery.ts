'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { galleryIsOpen } from '@/lib/gallery-window';
import { revalidatePath } from 'next/cache';

export type Photo = {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  uploaded_by: string;
  created_at: string;
};

export type Comment = {
  id: string;
  photo_id: string;
  body: string;
  author: string;
  created_at: string;
};

const PAGE_SIZE = 24;

export async function getPhotosPage(page: number): Promise<{ photos: Photo[]; signedUrls: Record<string, string> }> {
  const { data } = await adminSupabase
    .from('photos')
    .select('id, storage_path, thumbnail_path, uploaded_by, created_at')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  const photos = (data ?? []) as Photo[];
  const paths = photos.map(p => p.thumbnail_path).filter((p): p is string => Boolean(p));
  const signedUrls: Record<string, string> = {};

  if (paths.length > 0) {
    const { data: urlData } = await adminSupabase.storage
      .from('wedding-photos')
      .createSignedUrls(paths, 3600);
    for (const item of urlData ?? []) {
      if (item.signedUrl && item.path) signedUrls[item.path] = item.signedUrl;
    }
  }

  return { photos, signedUrls };
}

export async function getPhotoDetails(
  photoId: string,
  storagePath: string,
): Promise<{ fullResUrl: string | null; comments: Comment[] }> {
  const [urlResult, commentsResult] = await Promise.all([
    adminSupabase.storage.from('wedding-photos').createSignedUrl(storagePath, 3600),
    adminSupabase
      .from('comments')
      .select('id, photo_id, body, author, created_at')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true }),
  ]);

  return {
    fullResUrl: urlResult.data?.signedUrl ?? null,
    comments: (commentsResult.data ?? []) as Comment[],
  };
}

export async function postComment(
  photoId: string,
  body: string,
): Promise<{ ok?: true; comment?: Comment; error?: string }> {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };
  if (!galleryIsOpen() && !session.isAdmin) return { error: 'Gallery not open.' };

  const trimmed = body.trim().slice(0, 500);
  if (!trimmed) return { error: 'Comment cannot be empty.' };

  const { data, error } = await adminSupabase
    .from('comments')
    .insert({ photo_id: photoId, body: trimmed, author: session.guestName } as any)
    .select('id, photo_id, body, author, created_at')
    .single();

  if (error || !data) return { error: 'Failed to post comment.' };
  revalidatePath('/gallery');
  return { ok: true, comment: data as Comment };
}
