'use client';
import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleLike } from '@/app/actions/gallery';
import { useLanguage } from '@/components/LanguageProvider';

type Props = {
  photoId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  onLikeChanged?: (photoId: string, liked: boolean, likeCount: number) => void;
  className?: string;
};

export default function LikeButton({
  photoId,
  initialLiked,
  initialLikeCount,
  onLikeChanged,
  className = '',
}: Props) {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (isPending) return;

    const nextLiked = !liked;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
    const previousLiked = liked;
    const previousCount = likeCount;

    setLiked(nextLiked);
    setLikeCount(nextCount);
    onLikeChanged?.(photoId, nextLiked, nextCount);

    startTransition(async () => {
      const result = await toggleLike(photoId);
      if (result.error || result.liked === undefined || result.likeCount === undefined) {
        setLiked(previousLiked);
        setLikeCount(previousCount);
        onLikeChanged?.(photoId, previousLiked, previousCount);
        return;
      }

      setLiked(result.liked);
      setLikeCount(result.likeCount);
      onLikeChanged?.(photoId, result.liked, result.likeCount);
    });
  }

  const label = liked ? t.gallery.unlike : t.gallery.like;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={label}
      aria-pressed={liked}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-body text-xs transition-colors disabled:opacity-70 ${className}`}
    >
      <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
      <span>{likeCount}</span>
    </button>
  );
}
