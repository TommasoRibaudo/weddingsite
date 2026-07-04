'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { isGalleryOpenNow } from '@/lib/gallery-override';
import { revalidatePath } from 'next/cache';
import { getGuestProfiles } from './profile';

export type ProfileInfo = { bio: string | null; photo_url: string | null };

export type Photo = {
  id: string;
  storage_path: string | null;
  thumbnail_path: string | null;
  uploaded_by: string;
  body: string | null;
  created_at: string;
  comment_count: number;
  like_count: number;
  liked_by_me: boolean;
};

export type Comment = {
  id: string;
  photo_id: string;
  body: string;
  author: string;
  created_at: string;
};

const PAGE_SIZE = 24;
type PhotoRow = Omit<Photo, 'comment_count' | 'like_count' | 'liked_by_me'>;
type CommentPhotoRow = { photo_id: string };
type LikePhotoRow = { photo_id: string; guest_name: string };

async function withEngagementCounts(photos: Photo[], guestName: string): Promise<Photo[]> {
  const ids = photos.map((photo) => photo.id);
  if (ids.length === 0) return photos;

  const [commentsResult, likesResult] = await Promise.all([
    adminSupabase
      .from('comments')
      .select('photo_id')
      .in('photo_id', ids),
    adminSupabase
      .from('photo_likes')
      .select('photo_id, guest_name')
      .in('photo_id', ids),
  ]);

  const commentCounts = new Map<string, number>();
  for (const comment of (commentsResult.data ?? []) as CommentPhotoRow[]) {
    commentCounts.set(comment.photo_id, (commentCounts.get(comment.photo_id) ?? 0) + 1);
  }

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of (likesResult.data ?? []) as LikePhotoRow[]) {
    likeCounts.set(like.photo_id, (likeCounts.get(like.photo_id) ?? 0) + 1);
    if (like.guest_name === guestName) likedByMe.add(like.photo_id);
  }

  return photos.map((photo) => ({
    ...photo,
    comment_count: commentCounts.get(photo.id) ?? 0,
    like_count: likeCounts.get(photo.id) ?? 0,
    liked_by_me: likedByMe.has(photo.id),
  }));
}

export async function getPhotosPage(page: number): Promise<{
  photos: Photo[];
  signedUrls: Record<string, string>;
  profiles: Record<string, ProfileInfo>;
}> {
  const session = await getSession();
  if (!session.access) return { photos: [], signedUrls: {}, profiles: {} };
  if (!(await isGalleryOpenNow()) && !session.isAdmin) return { photos: [], signedUrls: {}, profiles: {} };

  const { data } = await adminSupabase
    .from('photos')
    .select('id, storage_path, thumbnail_path, uploaded_by, body, created_at')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  const rows = (data ?? []) as PhotoRow[];
  const photos = await withEngagementCounts(rows.map((photo) => ({
    ...photo,
    comment_count: 0,
    like_count: 0,
    liked_by_me: false,
  })), session.guestName);
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

  const uniqueAuthors = [...new Set(photos.map((p) => p.uploaded_by))];
  const profiles = await getGuestProfiles(uniqueAuthors);

  return { photos, signedUrls, profiles };
}

export async function getPhotoDetails(
  photoId: string,
  storagePath: string | null,
): Promise<{ fullResUrl: string | null; comments: Comment[] }> {
  const session = await getSession();
  if (!session.access) return { fullResUrl: null, comments: [] };
  if (!(await isGalleryOpenNow()) && !session.isAdmin) return { fullResUrl: null, comments: [] };

  const urlPromise = storagePath
    ? adminSupabase.storage.from('wedding-photos').createSignedUrl(storagePath, 3600)
    : Promise.resolve({ data: null });
  const [urlResult, commentsResult] = await Promise.all([
    urlPromise,
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

export async function postTextPost(
  body: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };
  if (!(await isGalleryOpenNow()) && !session.isAdmin) return { error: 'Gallery not open.' };

  const trimmed = body.trim().slice(0, 700);
  if (!trimmed) return { error: 'Message cannot be empty.' };

  const feedPost = {
    storage_path: null,
    thumbnail_path: null,
    uploaded_by: session.guestName,
    body: trimmed,
  } as never;

  const { error } = await adminSupabase.from('photos').insert(feedPost);

  if (error) return { error: 'Failed to post message.' };
  revalidatePath('/gallery');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function postComment(
  photoId: string,
  body: string,
): Promise<{ ok?: true; comment?: Comment; error?: string }> {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };
  if (!(await isGalleryOpenNow()) && !session.isAdmin) return { error: 'Gallery not open.' };

  const trimmed = body.trim().slice(0, 500);
  if (!trimmed) return { error: 'Comment cannot be empty.' };

  const commentInsert = {
    photo_id: photoId,
    body: trimmed,
    author: session.guestName,
  } as never;

  const { data, error } = await adminSupabase
    .from('comments')
    .insert(commentInsert)
    .select('id, photo_id, body, author, created_at')
    .single();

  if (error || !data) return { error: 'Failed to post comment.' };
  revalidatePath('/gallery');
  return { ok: true, comment: data as Comment };
}

export async function toggleLike(
  photoId: string,
): Promise<{ ok?: true; liked?: boolean; likeCount?: number; error?: string }> {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };
  if (!(await isGalleryOpenNow()) && !session.isAdmin) return { error: 'Gallery not open.' };

  const { data: deletedLikes, error: deleteError } = await adminSupabase
    .from('photo_likes')
    .delete()
    .match({ photo_id: photoId, guest_name: session.guestName })
    .select('id');

  if (deleteError) return { error: 'Failed to update like.' };

  const liked = (deletedLikes ?? []).length === 0;
  if (liked) {
    const { error: insertError } = await adminSupabase
      .from('photo_likes')
      .insert({
        photo_id: photoId,
        guest_name: session.guestName,
      } as never);

    if (insertError) return { error: 'Failed to update like.' };
  }

  const { count } = await adminSupabase
    .from('photo_likes')
    .select('id', { count: 'exact', head: true })
    .eq('photo_id', photoId);

  revalidatePath('/gallery');
  return { ok: true, liked, likeCount: count ?? 0 };
}
