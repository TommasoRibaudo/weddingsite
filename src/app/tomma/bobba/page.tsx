import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import AdminPhotoGrid, { type AdminPhoto } from '@/components/admin/AdminPhotoGrid';
import AdminGiftList, { type AdminGift } from '@/components/admin/AdminGiftList';
import { type AdminComment } from '@/components/admin/AdminCommentList';
import AdminDietaryList from '@/components/admin/AdminDietaryList';
import AdminGuestList, { type AdminGuest } from '@/components/admin/AdminGuestList';
import AdminProfileList, { type AdminProfile } from '@/components/admin/AdminProfileList';
import AdminSectionNav from '@/components/admin/AdminSectionNav';
import GalleryOverrideControl from '@/components/admin/GalleryOverrideControl';
import { getAllDietaryResponses } from '@/app/actions/menu';
import { getGalleryOverride } from '@/lib/gallery-override';
import { galleryIsOpen } from '@/lib/gallery-window';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();
  if (!session.isAdmin) redirect('/tomma/bobba/login');

  const [giftsRes, photosRes, commentsRes, dietaryResponses, guestsRes, profilesRes, galleryOverride] = await Promise.all([
    adminSupabase
      .from('gifts')
      .select('id, name, description, image_url, external_link, price, reserved_by, reserved_at, created_at, divideable, gift_contributions(id, contributed_by, amount, created_at)')
      .order('created_at'),
    adminSupabase
      .from('photos')
      .select('id, storage_path, thumbnail_path, uploaded_by, body, created_at')
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('comments')
      .select('id, photo_id, body, author, created_at')
      .order('created_at', { ascending: true }),
    getAllDietaryResponses(),
    adminSupabase
      .from('guests')
      .select('id, slug, guest_name, party_label, revoked, created_at, redeemed_at, last_visited_at')
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('guest_profiles')
      .select('guest_name, bio, photo_path, updated_at')
      .order('updated_at', { ascending: false }),
    getGalleryOverride(),
  ]);

  const gifts: AdminGift[] = giftsRes.data ?? [];
  const photos: AdminPhoto[] = photosRes.data ?? [];
  const comments: AdminComment[] = commentsRes.data ?? [];
  const guests: AdminGuest[] = guestsRes.data ?? [];
  const profileRows = (profilesRes.data ?? []) as {
    guest_name: string;
    bio: string | null;
    photo_path: string | null;
    updated_at: string;
  }[];

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

  let profilePhotoUrls: Record<string, string> = {};
  const profilePaths = profileRows.map((p) => p.photo_path).filter(Boolean) as string[];

  if (profilePaths.length > 0) {
    try {
      const { data: urlData } = await adminSupabase.storage
        .from('profile-photos')
        .createSignedUrls(profilePaths, 3600);
      if (urlData) {
        profilePhotoUrls = Object.fromEntries(
          urlData.flatMap((d) => (d.signedUrl ? [[d.path, d.signedUrl]] : []))
        );
      }
    } catch {
      // storage bucket not set up yet
    }
  }

  const profiles: AdminProfile[] = profileRows.map((row) => ({
    guest_name: row.guest_name,
    bio: row.bio,
    photo_url: row.photo_path ? (profilePhotoUrls[row.photo_path] ?? null) : null,
    updated_at: row.updated_at,
  }));

  return (
    <div>
      <h1 className="font-display text-5xl text-green mb-8">Dashboard</h1>

      <AdminSectionNav />

      <section id="photos" className="mb-16 scroll-mt-20">
        <h2 className="font-body font-semibold text-xl text-gray-800 mb-4">
          Feed &amp; Comments
        </h2>
        <GalleryOverrideControl override={galleryOverride} scheduledOpen={galleryIsOpen()} />
        <AdminPhotoGrid photos={photos} signedUrls={signedUrls} comments={comments} />
      </section>

      <section id="gifts" className="mb-16 scroll-mt-20">
        <h2 className="font-body font-semibold text-xl text-gray-800 mb-4">Gifts</h2>
        <AdminGiftList gifts={gifts} />
      </section>

      <section id="dietary" className="mb-16 scroll-mt-20">
        <h2 className="font-body font-semibold text-xl text-gray-800 mb-4">
          Dietary Preferences
          <span className="ml-2 font-body font-normal text-sm text-gray-400">
            ({dietaryResponses.length} response{dietaryResponses.length !== 1 ? 's' : ''})
          </span>
        </h2>
        <AdminDietaryList responses={dietaryResponses} />
      </section>

      <section id="invites" className="mb-16 scroll-mt-20">
        <h2 className="font-body font-semibold text-xl text-gray-800 mb-4">
          Invite Links
          <span className="ml-2 font-body font-normal text-sm text-gray-400">
            ({guests.length} guest{guests.length !== 1 ? 's' : ''})
          </span>
        </h2>
        <AdminGuestList guests={guests} />
      </section>

      <section id="profiles" className="mb-16 scroll-mt-20">
        <h2 className="font-body font-semibold text-xl text-gray-800 mb-4">
          Guest Profiles
          <span className="ml-2 font-body font-normal text-sm text-gray-400">
            ({profiles.length} profile{profiles.length !== 1 ? 's' : ''})
          </span>
        </h2>
        <AdminProfileList profiles={profiles} />
      </section>
    </div>
  );
}
