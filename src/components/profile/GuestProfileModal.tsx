'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getGuestProfile } from '@/app/actions/profile';
import GuestAvatar from './GuestAvatar';
import { useLanguage } from '@/components/LanguageProvider';

type Props = {
  guestName: string;
  initialProfile?: { bio: string | null; photo_url: string | null } | null;
  onClose: () => void;
};

export default function GuestProfileModal({ guestName, initialProfile, onClose }: Props) {
  const { t } = useLanguage();
  // undefined = still loading; null = loaded, no profile row; object = loaded with data
  const [profile, setProfile] = useState<
    { bio: string | null; photo_url: string | null } | null | undefined
  >(initialProfile);

  useEffect(() => {
    if (initialProfile === undefined) {
      getGuestProfile(guestName).then((p) => setProfile(p ?? null));
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [guestName, initialProfile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center animate-fade-in px-4"
      role="dialog"
      aria-modal="true"
      aria-label={guestName}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="floral-card w-full max-w-sm bg-white rounded-lg shadow-2xl p-6 animate-scale-in">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <GuestAvatar name={guestName} photoUrl={profile?.photo_url ?? null} size={56} />
            <h2 className="font-body font-semibold text-lg text-charcoal">{guestName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.gallery.close}
            className="p-1 text-gray-400 hover:text-charcoal transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {profile === undefined ? (
          <div className="flex justify-center py-4">
            <span className="inline-block w-5 h-5 border-2 border-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profile?.bio ? (
          <p className="font-body text-sm text-charcoal/80 leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        ) : (
          <p className="font-body text-sm text-charcoal/40 italic">{t.profile.noBio}</p>
        )}
      </div>
    </div>
  );
}
