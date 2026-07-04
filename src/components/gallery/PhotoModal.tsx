'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import type { Photo, Comment, ProfileInfo } from '@/app/actions/gallery';
import { getPhotoDetails } from '@/app/actions/gallery';
import CommentThread from './CommentThread';
import LikeButton from './LikeButton';
import GuestAvatar from '@/components/profile/GuestAvatar';
import { useLanguage } from '@/components/LanguageProvider';

type Props = {
  photos: Photo[];
  thumbnailUrls: Record<string, string>;
  profiles: Record<string, ProfileInfo>;
  initialIndex: number;
  onClose: () => void;
  onCommentPosted?: (photoId: string) => void;
  onLikeChanged?: (photoId: string, liked: boolean, likeCount: number) => void;
  onAuthorClick?: (guestName: string) => void;
};

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PhotoModal({
  photos,
  thumbnailUrls,
  profiles,
  initialIndex,
  onClose,
  onCommentPosted,
  onLikeChanged,
  onAuthorClick,
}: Props) {
  const { locale, t } = useLanguage();
  const [index, setIndex] = useState(initialIndex);
  const [details, setDetails] = useState<{
    photoId: string;
    fullResUrl: string | null;
    comments: Comment[];
  } | null>(null);

  const photo = photos[index];
  const hasImage = Boolean(photo.storage_path || photo.thumbnail_path);

  useEffect(() => {
    let cancelled = false;
    getPhotoDetails(photo.id, photo.storage_path).then(({ fullResUrl, comments }) => {
      if (!cancelled) {
        setDetails({ photoId: photo.id, fullResUrl, comments });
      }
    });
    return () => { cancelled = true; };
  }, [photo.id, photo.storage_path]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(photos.length - 1, i + 1)), [photos.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const thumbUrl = photo.thumbnail_path ? thumbnailUrls[photo.thumbnail_path] : undefined;
  const activeDetails = details?.photoId === photo.id ? details : null;
  const loading = !activeDetails;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
        onClick={onClose}
        aria-label={t.gallery.close}
      >
        <X size={22} />
      </button>

      {index > 0 && (
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 z-10"
          onClick={prev}
          aria-label={t.gallery.previous}
        >
          <ChevronLeft size={30} />
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 z-10"
          onClick={next}
          aria-label={t.gallery.next}
        >
          <ChevronRight size={30} />
        </button>
      )}

      <div className="floral-card flex flex-col md:flex-row w-full max-w-5xl max-h-[92vh] mx-4 md:mx-12 bg-white rounded-lg overflow-hidden shadow-2xl animate-scale-in">
        <div className={`relative flex-1 min-h-56 md:min-h-0 ${hasImage ? 'bg-black' : 'bg-green-pale'}`}>
          {hasImage ? (
            thumbUrl || activeDetails?.fullResUrl ? (
              <Image
                src={activeDetails?.fullResUrl ?? thumbUrl!}
                alt={`${t.gallery.photo} ${photo.uploaded_by}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 65vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )
          ) : (
            <div className="flex h-full min-h-72 flex-col justify-center p-8 md:p-12">
              <MessageCircle className="mb-5 text-green-light" size={30} />
              <p className="font-body text-2xl leading-snug text-charcoal">
                {photo.body}
              </p>
            </div>
          )}
        </div>

        <div className="w-full md:w-72 shrink-0 flex flex-col p-5 overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => onAuthorClick?.(photo.uploaded_by)}
              aria-label={`${t.profile.viewProfile}: ${photo.uploaded_by}`}
              className="flex items-center gap-2 rounded-lg hover:bg-green-pale px-1.5 py-1 -mx-1.5 -my-1 transition-colors text-left"
            >
              <GuestAvatar
                name={photo.uploaded_by}
                photoUrl={profiles[photo.uploaded_by]?.photo_url ?? null}
                size={36}
              />
              <div>
                <p className="font-body font-semibold text-sm text-charcoal/80">{photo.uploaded_by}</p>
                <p className="font-body text-xs text-gray-400">{formatDate(photo.created_at, locale)}</p>
              </div>
            </button>
            <LikeButton
              key={photo.id}
              photoId={photo.id}
              initialLiked={photo.liked_by_me}
              initialLikeCount={photo.like_count}
              onLikeChanged={onLikeChanged}
              className="bg-green-pale text-green hover:bg-green-muted"
            />
          </div>
          <div className="mb-4" />
          <hr className="border-greige mb-4" />
          {loading ? (
            <div className="flex justify-center py-6">
              <span className="inline-block w-5 h-5 border-2 border-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CommentThread
              key={photo.id}
              photoId={photo.id}
              initialComments={activeDetails.comments}
              onCommentPosted={() => onCommentPosted?.(photo.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
