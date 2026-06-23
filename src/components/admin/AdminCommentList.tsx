'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteComment } from '@/app/actions/admin';

export type AdminComment = {
  id: string;
  photo_id: string;
  body: string;
  author: string;
  created_at: string;
};

export default function AdminCommentList({ comments }: { comments: AdminComment[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (comments.length === 0) {
    return <p className="font-body text-gray-400 text-sm italic">No comments.</p>;
  }

  function handleDelete(commentId: string) {
    setDeletingId(commentId);
    startTransition(async () => {
      await deleteComment(commentId);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <ul className="space-y-2">
      {comments.map((comment) => (
        <li key={comment.id} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="font-body font-semibold text-sm text-gray-800">{comment.author}</span>
            <span className="font-body text-xs text-gray-400 ml-2">
              {new Date(comment.created_at).toLocaleDateString('en-GB')}
            </span>
            <p className="font-body text-sm text-gray-600 break-words">{comment.body}</p>
          </div>
          <button
            onClick={() => handleDelete(comment.id)}
            disabled={isPending && deletingId === comment.id}
            className="font-body text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
