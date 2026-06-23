import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import AdminPhotoGrid, { type AdminPhoto } from '@/components/admin/AdminPhotoGrid';
import AdminGiftList, { type AdminGift } from '@/components/admin/AdminGiftList';
import { type AdminComment } from '@/components/admin/AdminCommentList';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();
  if (!session.isAdmin) redirect('/admin/login');

  const [giftsRes, photosRes, commentsRes] = await Promise.all([
    adminSupabase
      .from('gifts')
      .select('id, name, description, image_url, external_link, price, reserved_by, reserved_at, created_at')
      .order('created_at'),
    adminSupabase
      .from('photos')
      .select('id, storage_path, thumbnail_path, uploaded_by, created_at')
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('comments')
      .select('id, photo_id, body, author, created_at')
      .order('created_at', { ascending: true }),
  ]);

  const gifts: AdminGift[] = giftsRes.data ?? [];
  const photos: AdminPhoto[] = photosRes.data ?? [];
  const comments: AdminComment[] = commentsRes.data ?? [];

  let signedUrls: Record<string, string> = {};
  const paths = photos
    .map((p) => p.thumbnail_path ?? p.storage_path)
    .filter(Boolean) as string[];

  if (paths.length > 0) {
    try {
      const { data: urlData } = await adminSupabase.storage
        .from('wedding-photos')
        .createSignedUrls(paths, 3600);
      if (urlData) {
        signedUrls = Object.fromEntries(
          urlData.flatMap((d) => (d.signedUrl ? [[d.path, d.signedUrl]] : []))
        );
      }
    } catch {
      // storage bucket not set up yet
    }
  }

  return (
    <div>
      <h1 className="font-display text-5xl text-green mb-8">Dashboard</h1>

      <div className="flex gap-6 border-b border-greige mb-8">
        <a
          href="#photos"
          className="font-body font-semibold text-gray-700 pb-3 hover:text-green transition-colors"
        >
          Photos &amp; Comments
        </a>
        <a
          href="#gifts"
          className="font-body font-semibold text-gray-700 pb-3 hover:text-green transition-colors"
        >
          Gifts
        </a>
      </div>

      <section id="photos" className="mb-16 scroll-mt-20">
        <h2 className="font-body font-semibold text-xl text-gray-800 mb-4">
          Photos &amp; Comments
        </h2>
        <AdminPhotoGrid photos={photos} signedUrls={signedUrls} comments={comments} />
      </section>

      <section id="gifts" className="mb-16 scroll-mt-20">
        <h2 className="font-body font-semibold text-xl text-gray-800 mb-4">Gifts</h2>
        <AdminGiftList gifts={gifts} />
      </section>
    </div>
  );
}
