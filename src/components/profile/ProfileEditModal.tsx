'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getMyProfile, type GuestProfile } from '@/app/actions/profile';
import ProfileEditPanel from './ProfileEditPanel';
import { useLanguage } from '@/components/LanguageProvider';

type Props = {
  guestName: string;
  onClose: () => void;
};

export default function ProfileEditModal({ guestName, onClose }: Props) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<GuestProfile | null | undefined>(undefined);

  useEffect(() => {
    getMyProfile().then(setProfile);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
      aria-label={t.nav.editProfile}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="floral-card w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-body font-semibold text-lg text-charcoal">{t.nav.editProfile}</h2>
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
          <div className="flex justify-center py-8">
            <span className="inline-block w-5 h-5 border-2 border-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ProfileEditPanel
            guestName={guestName}
            initialBio={profile?.bio ?? null}
            initialPhotoUrl={profile?.photo_url ?? null}
            showPrompt={false}
            className=""
          />
        )}
      </div>
    </div>
  );
}
