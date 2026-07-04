'use client';

import { gallery } from '@/lib/wedding-config';
import { useLanguage } from '@/components/LanguageProvider';
import ProfileEditPanel from '@/components/profile/ProfileEditPanel';
import type { GuestProfile } from '@/app/actions/profile';

type Props = {
  guestName: string;
  profile: GuestProfile | null;
};

function formatOpenDate(locale: string) {
  const date = new Date(gallery.opensAt);
  return {
    date: date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
  };
}

export default function GalleryLocked({ guestName, profile }: Props) {
  const { locale, t } = useLanguage();
  const { date, time } = formatOpenDate(locale);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="floral-panel w-full max-w-sm rounded-lg border border-greige bg-white/92 p-8 shadow-sm">
        <div className="text-center">
          <div className="w-16 h-px bg-green mx-auto mb-8" />
          <h1 className="font-display text-4xl md:text-5xl text-green mb-6">
            {t.gallery.lockedTitle}
          </h1>
          <div className="w-16 h-px bg-green mx-auto my-6" />
          <p className="font-body text-lg text-charcoal">{date}</p>
          <p className="font-body text-sm text-charcoal/70 mt-1">{time}</p>
          <p className="font-body italic text-sm text-charcoal/55 mt-4 leading-relaxed">
            {t.gallery.lockedBody}
          </p>
        </div>

        <ProfileEditPanel
          guestName={guestName}
          initialBio={profile?.bio ?? null}
          initialPhotoUrl={profile?.photo_url ?? null}
        />
      </div>
    </div>
  );
}
