import { gallery } from './wedding-config';

export function galleryIsOpen(): boolean {
  const now = Date.now();
  return (
    now >= new Date(gallery.opensAt).getTime() &&
    now <= new Date(gallery.closesAt).getTime()
  );
}
