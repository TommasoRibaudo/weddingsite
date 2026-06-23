'use client';
import { useState, useTransition } from 'react';
import Image from 'next/image';
import type { Photo } from '@/app/actions/gallery';
import { getPhotosPage } from '@/app/actions/gallery';
import PhotoModal from './PhotoModal';

const PAGE_SIZE = 24;

type Props = {
  initialPhotos: Photo[];
  initialSignedUrls: Record<string, string>;
};

export default function PhotoGrid({ initialPhotos, initialSignedUrls }: Props) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [signedUrls, setSignedUrls] = useState(initialSignedUrls);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialPhotos.length >= PAGE_SIZE);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const { photos: more, signedUrls: moreUrls } = await getPhotosPage(page + 1);
      setPhotos(prev => [...prev, ...more]);
      setSignedUrls(prev => ({ ...prev, ...moreUrls }));
      setPage(p => p + 1);
      setHasMore(more.length >= PAGE_SIZE);
    });
  }

  if (photos.length === 0) {
    return (
      <p className="text-center font-body italic text-gray-400 py-16">
        No photos yet — be the first to share a moment!
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {photos.map((photo, i) => {
          const thumbUrl = photo.thumbnail_path ? signedUrls[photo.thumbnail_path] : undefined;
          return (
            <button
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-lg hover:scale-[1.02] transition-transform focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-1"
              onClick={() => setSelectedIndex(i)}
              aria-label={`Open photo by ${photo.uploaded_by}`}
            >
              {thumbUrl ? (
                <Image
                  src={thumbUrl}
                  alt={`Photo by ${photo.uploaded_by}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-green-pale flex items-center justify-center">
                  <span className="font-body text-xs text-green-light italic">Photo</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="font-body text-sm border border-green text-green px-8 py-2.5 rounded-full hover:bg-green hover:text-white transition-colors disabled:opacity-50"
          >
            {isPending ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {selectedIndex !== null && (
        <PhotoModal
          photos={photos}
          thumbnailUrls={signedUrls}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
