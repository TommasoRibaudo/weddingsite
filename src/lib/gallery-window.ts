import { gallery } from './wedding-config';

export function galleryIsOpen(): boolean {
  if (process.env.PLAYWRIGHT_GALLERY_LOCKED === 'true') return false;
  const now = Date.now();
  return (
    now >= new Date(gallery.opensAt).getTime() &&
    now <= new Date(gallery.closesAt).getTime()
  );
}
