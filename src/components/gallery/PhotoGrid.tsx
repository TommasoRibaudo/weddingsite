'use client';
import { useState, useTransition } from 'react';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import type { Photo, ProfileInfo } from '@/app/actions/gallery';
import { getPhotosPage } from '@/app/actions/gallery';
import PhotoModal from './PhotoModal';
import LikeButton from './LikeButton';
import Reveal from '@/components/Reveal';
import GuestAvatar from '@/components/profile/GuestAvatar';
import GuestProfileModal from '@/components/profile/GuestProfileModal';
import { useLanguage } from '@/components/LanguageProvider';

const PAGE_SIZE = 24;

type Props = {
  initialPhotos: Photo[];
  initialSignedUrls: Record<string, string>;
  initialProfiles: Record<string, ProfileInfo>;
};

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export default function PhotoGrid(props: Props) {
  const gridKey = props.initialPhotos.map((photo) => photo.id).join('|');
  return <PhotoGridState key={gridKey} {...props} />;
}

function PhotoGridState({ initialPhotos, initialSignedUrls, initialProfiles }: Props) {
  const { locale, t } = useLanguage();
  const [photos, setPhotos] = useState(initialPhotos);
  const [signedUrls, setSignedUrls] = useState(initialSignedUrls);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialPhotos.length >= PAGE_SIZE);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [profileGuest, setProfileGuest] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const { photos: more, signedUrls: moreUrls, profiles: moreProfiles } = await getPhotosPage(page + 1);
      setPhotos((prev) => [...prev, ...more]);
      setSignedUrls((prev) => ({ ...prev, ...moreUrls }));
      setProfiles((prev) => ({ ...prev, ...moreProfiles }));
      setPage((p) => p + 1);
      setHasMore(more.length >= PAGE_SIZE);
    });
  }

  function handleCommentPosted(photoId: string) {
    setPhotos((prev) => prev.map((photo) => (
      photo.id === photoId
        ? { ...photo, comment_count: photo.comment_count + 1 }
        : photo
    )));
  }

  function handleLikeChanged(photoId: string, liked: boolean, likeCount: number) {
    setPhotos((prev) => prev.map((photo) => (
      photo.id === photoId
        ? { ...photo, liked_by_me: liked, like_count: likeCount }
        : photo
    )));
  }

  if (photos.length === 0) {
    return (
      <p className="text-center font-body italic text-gray-400 py-16">
        {t.gallery.noPosts}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {photos.map((photo, i) => {
          const thumbUrl = photo.thumbnail_path ? signedUrls[photo.thumbnail_path] : undefined;
          const hasImage = Boolean(photo.storage_path || photo.thumbnail_path);
          const authorProfile = profiles[photo.uploaded_by] ?? null;
          const label = hasImage
            ? `${t.gallery.openPhotoBy} ${photo.uploaded_by}`
            : `${t.gallery.openNoteBy} ${photo.uploaded_by}`;
          const commentLabel = `${photo.comment_count} ${
            photo.comment_count === 1 ? t.gallery.commentSingular : t.gallery.commentPlural
          }`;

          return (
            <Reveal key={photo.id} delay={Math.min(i * 60, 400)} scale>
            <article
              className={`group relative w-full overflow-hidden rounded-lg border border-greige bg-white text-left transition-transform hover:scale-[1.01] ${
                hasImage ? 'aspect-square' : 'min-h-44 p-5'
              }`}
            >
              <button
                type="button"
                className="absolute inset-0 z-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-1"
                onClick={() => setSelectedIndex(i)}
                aria-label={label}
              />
              {hasImage ? (
                <div className="relative h-full w-full pointer-events-none">
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={`${t.gallery.photo} ${photo.uploaded_by}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-green-pale flex items-center justify-center">
                      <span className="font-body text-xs text-green-light italic">{t.gallery.photo}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setProfileGuest(photo.uploaded_by)}
                    aria-label={`${t.profile.viewProfile}: ${photo.uploaded_by}`}
                    className="pointer-events-auto absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-full bg-black/60 pl-1 pr-2.5 py-1 backdrop-blur-sm hover:bg-black/75 transition-colors"
                  >
                    <GuestAvatar
                      name={photo.uploaded_by}
                      photoUrl={authorProfile?.photo_url ?? null}
                      size={22}
                    />
                    <span className="font-body text-xs text-white truncate max-w-[90px]">
                      {photo.uploaded_by}
                    </span>
                  </button>

                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 font-body text-xs text-white backdrop-blur-sm">
                    <MessageCircle size={13} />
                    {photo.comment_count}
                  </span>
                  <LikeButton
                    photoId={photo.id}
                    initialLiked={photo.liked_by_me}
                    initialLikeCount={photo.like_count}
                    onLikeChanged={handleLikeChanged}
                    className="pointer-events-auto absolute bottom-2 left-2 z-20 bg-black/65 text-white backdrop-blur-sm hover:bg-black/80"
                  />
                </div>
              ) : (
                <div className="relative z-20 flex h-full flex-col pointer-events-none">
                  <MessageCircle className="mb-4 text-green-light" size={24} />
                  <p className="font-body text-lg leading-snug text-charcoal line-clamp-5">
                    {photo.body}
                  </p>
                  <div className="mt-auto pt-5">
                    <button
                      type="button"
                      onClick={() => setProfileGuest(photo.uploaded_by)}
                      aria-label={`${t.profile.viewProfile}: ${photo.uploaded_by}`}
                      className="pointer-events-auto flex items-center gap-2 rounded-full hover:bg-green-pale px-1 py-0.5 -mx-1 transition-colors"
                    >
                      <GuestAvatar
                        name={photo.uploaded_by}
                        photoUrl={authorProfile?.photo_url ?? null}
                        size={24}
                      />
                      <span className="font-body text-sm font-semibold text-green">
                        {photo.uploaded_by}
                      </span>
                    </button>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="font-body text-xs text-gray-400">{formatDate(photo.created_at, locale)}</p>
                      <div className="flex items-center gap-1">
                        <LikeButton
                          photoId={photo.id}
                          initialLiked={photo.liked_by_me}
                          initialLikeCount={photo.like_count}
                          onLikeChanged={handleLikeChanged}
                          className="pointer-events-auto relative z-20 bg-cream text-green hover:bg-green-muted"
                        />
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-pale px-2 py-1 font-body text-xs text-green" aria-label={commentLabel}>
                          <MessageCircle size={13} />
                          {photo.comment_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
            </Reveal>
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
            {isPending ? t.gallery.loading : t.gallery.loadMore}
          </button>
        </div>
      )}

      {selectedIndex !== null && (
        <PhotoModal
          photos={photos}
          thumbnailUrls={signedUrls}
          profiles={profiles}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onCommentPosted={handleCommentPosted}
          onLikeChanged={handleLikeChanged}
          onAuthorClick={setProfileGuest}
        />
      )}

      {profileGuest !== null && (
        <GuestProfileModal
          guestName={profileGuest}
          initialProfile={profiles[profileGuest] ?? undefined}
          onClose={() => setProfileGuest(null)}
        />
      )}
    </>
  );
}
