import { getSession } from '@/lib/session';
import { isGalleryOpenNow } from '@/lib/gallery-override';
import GalleryLocked from '@/components/gallery/GalleryLocked';
import UploadZone from '@/components/gallery/UploadZone';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import { getPhotosPage } from '@/app/actions/gallery';
import { getMyProfile } from '@/app/actions/profile';
import PageIntro from '@/components/PageIntro';

export default async function GalleryPage() {
  const session = await getSession();
  const open = (await isGalleryOpenNow()) || session.isAdmin;

  if (!open) {
    const profile = await getMyProfile();
    return (
      <GalleryLocked
        guestName={session.guestName}
        profile={profile}
      />
    );
  }

  const { photos, signedUrls, profiles } = await getPhotosPage(0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageIntro section="gallery" />

      <UploadZone />
      <PhotoGrid initialPhotos={photos} initialSignedUrls={signedUrls} initialProfiles={profiles} />
    </div>
  );
}
