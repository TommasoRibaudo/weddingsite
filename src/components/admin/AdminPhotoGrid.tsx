'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deletePhoto } from '@/app/actions/admin';
import AdminCommentList, { type AdminComment } from './AdminCommentList';

export type AdminPhoto = {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  uploaded_by: string;
  created_at: string;
};

type Props = {
  photos: AdminPhoto[];
  signedUrls: Record<string, string>;
  comments: AdminComment[];
};

export default function AdminPhotoGrid({ photos, signedUrls, comments }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (photos.length === 0) {
    return <p className="font-body text-gray-400 italic">No photos yet.</p>;
  }

  function handleDelete(photoId: string) {
    if (!window.confirm('Delete this photo and all its comments?')) return;
    setDeletingId(photoId);
    startTransition(async () => {
      await deletePhoto(photoId);
      setDeletingId(null);
      if (expandedId === photoId) setExpandedId(null);
      router.refresh();
    });
  }

  const expandedPhoto = photos.find((p) => p.id === expandedId);
  const expandedComments = expandedId
    ? comments.filter((c) => c.photo_id === expandedId)
    : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo) => {
          const urlKey = photo.thumbnail_path ?? photo.storage_path;
          const url = signedUrls[urlKey] ?? null;
          const isExpanded = expandedId === photo.id;
          const isDeleting = isPending && deletingId === photo.id;

          return (
            <div key={photo.id} className={`relative ${isDeleting ? 'opacity-40' : ''}`}>
              <div
                className={`aspect-square bg-green-pale rounded-lg overflow-hidden cursor-pointer ring-2 transition-all ${
                  isExpanded ? 'ring-green' : 'ring-transparent hover:ring-greige'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : photo.id)}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Photo by ${photo.uploaded_by}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-body text-xs text-gray-300">
                    No preview
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="font-body text-xs text-gray-700 truncate">{photo.uploaded_by}</p>
                  <p className="font-body text-xs text-gray-400">
                    {new Date(photo.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <button
                  aria-label="Delete photo"
                  onClick={() => handleDelete(photo.id)}
                  disabled={isDeleting}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {expandedPhoto && (
        <div className="bg-white rounded-xl border border-greige p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body font-semibold text-sm text-gray-800">
              Comments — {expandedPhoto.uploaded_by}
            </p>
            <button
              onClick={() => setExpandedId(null)}
              className="font-body text-xs text-gray-400 hover:text-gray-600"
            >
              Close ×
            </button>
          </div>
          <AdminCommentList comments={expandedComments} />
        </div>
      )}
    </div>
  );
}
