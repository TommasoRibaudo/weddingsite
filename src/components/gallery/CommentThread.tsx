'use client';
import { useState, useTransition } from 'react';
import type { Comment } from '@/app/actions/gallery';
import { postComment } from '@/app/actions/gallery';
import { useLanguage } from '@/components/LanguageProvider';

type Props = {
  photoId: string;
  initialComments: Comment[];
  onCommentPosted?: () => void;
};

function relativeTime(iso: string, locale: string, justNow: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diff < 60_000) return justNow;
  if (diff < 3_600_000) return rtf.format(-Math.floor(diff / 60_000), 'minute');
  if (diff < 86_400_000) return rtf.format(-Math.floor(diff / 3_600_000), 'hour');
  return rtf.format(-Math.floor(diff / 86_400_000), 'day');
}

export default function CommentThread({ photoId, initialComments, onCommentPosted }: Props) {
  const { locale, t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const text = body.trim();
    if (!text || isPending) return;
    setBody('');
    setError(null);

    const tempId = crypto.randomUUID();
    const optimistic: Comment = {
      id: tempId,
      photo_id: photoId,
      body: text,
      author: '...',
      created_at: new Date().toISOString(),
    };
    setComments(prev => [...prev, optimistic]);

    startTransition(async () => {
      const result = await postComment(photoId, text);
      if (result.error) {
        setError(result.error);
        setComments(prev => prev.filter(c => c.id !== tempId));
      } else if (result.comment) {
        setComments(prev => prev.map(c => c.id === tempId ? result.comment! : c));
        onCommentPosted?.();
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-body font-semibold text-sm text-charcoal/80">{t.gallery.comments}</h3>

      {comments.length === 0 ? (
        <p className="font-body italic text-sm text-gray-400">{t.gallery.noComments}</p>
      ) : (
        <ul className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {comments.map(c => (
            <li key={c.id}>
              <div className="flex items-baseline gap-2">
                <span className="font-body font-semibold text-xs text-charcoal/80">{c.author}</span>
                <span className="font-body text-xs text-gray-400">
                  {relativeTime(c.created_at, locale, t.gallery.justNow)}
                </span>
              </div>
              <p className="font-body text-sm text-charcoal/75 mt-0.5">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-greige pt-3">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.metaKey && submit()}
          placeholder={t.gallery.addComment}
          maxLength={500}
          rows={2}
          className="w-full font-body text-sm border border-greige rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-green placeholder:text-gray-300"
        />
        {error && <p className="font-body text-xs text-red-500 mt-1">{error}</p>}
        <button
          onClick={submit}
          disabled={isPending || !body.trim()}
          className="mt-2 w-full font-body text-sm bg-green text-white rounded-lg py-2 hover:bg-green-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? t.gallery.posting : t.gallery.post}
        </button>
      </div>
    </div>
  );
}
