import { getSession } from '@/lib/session';
import { galleryIsOpen } from '@/lib/gallery-window';
import { adminSupabase } from '@/lib/supabase/admin';
import GalleryLocked from '@/components/gallery/GalleryLocked';
import UploadZone from '@/components/gallery/UploadZone';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import type { Photo } from '@/app/actions/gallery';

const PAGE_SIZE = 24;

export default async function GalleryPage() {
  const session = await getSession();
  const open = galleryIsOpen() || session.isAdmin;

  if (!open) return <GalleryLocked />;

  const { data } = await adminSupabase
    .from('photos')
    .select('id, storage_path, thumbnail_path, uploaded_by, created_at')
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1);

  const photos = (data ?? []) as Photo[];
  const thumbPaths = photos.map(p => p.thumbnail_path).filter((p): p is string => Boolean(p));
  const signedUrls: Record<string, string> = {};

  if (thumbPaths.length > 0) {
    const { data: urlData } = await adminSupabase.storage
      .from('wedding-photos')
      .createSignedUrls(thumbPaths, 3600);
    for (const item of urlData ?? []) {
      if (item.signedUrl && item.path) signedUrls[item.path] = item.signedUrl;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl md:text-7xl text-green mb-3">Gallery</h1>
        <p className="font-body italic text-lg text-gray-500">
          Share your moments from our special day
        </p>
        <div className="w-16 h-px bg-green mx-auto mt-5" />
      </div>

      <UploadZone />
      <PhotoGrid initialPhotos={photos} initialSignedUrls={signedUrls} />
    </div>
  );
}
