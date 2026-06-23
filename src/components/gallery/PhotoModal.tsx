'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Photo, Comment } from '@/app/actions/gallery';
import { getPhotoDetails } from '@/app/actions/gallery';
import CommentThread from './CommentThread';

type Props = {
  photos: Photo[];
  thumbnailUrls: Record<string, string>;
  initialIndex: number;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PhotoModal({ photos, thumbnailUrls, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [fullResUrl, setFullResUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const photo = photos[index];

  useEffect(() => {
    setLoading(true);
    setFullResUrl(null);
    setComments([]);
    getPhotoDetails(photo.id, photo.storage_path).then(({ fullResUrl, comments }) => {
      setFullResUrl(fullResUrl);
      setComments(comments);
      setLoading(false);
    });
  }, [photo.id, photo.storage_path]);

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(photos.length - 1, i + 1)), [photos.length]);

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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={22} />
      </button>

      {index > 0 && (
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 z-10"
          onClick={prev}
          aria-label="Previous photo"
        >
          <ChevronLeft size={30} />
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 z-10"
          onClick={next}
          aria-label="Next photo"
        >
          <ChevronRight size={30} />
        </button>
      )}

      <div className="flex flex-col md:flex-row w-full max-w-5xl max-h-[92vh] mx-4 md:mx-12 bg-white rounded-xl overflow-hidden shadow-2xl">
        {/* Image panel */}
        <div className="relative flex-1 bg-black min-h-56 md:min-h-0">
          {thumbUrl || fullResUrl ? (
            <Image
              src={fullResUrl ?? thumbUrl!}
              alt={`Photo by ${photo.uploaded_by}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 65vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 shrink-0 flex flex-col p-5 overflow-y-auto">
          <p className="font-body font-semibold text-sm text-gray-700">{photo.uploaded_by}</p>
          <p className="font-body text-xs text-gray-400 mb-4">{formatDate(photo.created_at)}</p>
          <hr className="border-greige mb-4" />
          {loading ? (
            <div className="flex justify-center py-6">
              <span className="inline-block w-5 h-5 border-2 border-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CommentThread
              key={photo.id}
              photoId={photo.id}
              initialComments={comments}
            />
          )}
        </div>
      </div>
    </div>
  );
}
