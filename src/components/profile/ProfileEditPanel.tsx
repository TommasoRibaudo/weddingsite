'use client';
import { useState, useRef, useTransition } from 'react';
import { Camera, Check } from 'lucide-react';
import { updateProfile } from '@/app/actions/profile';
import GuestAvatar from './GuestAvatar';
import { useLanguage } from '@/components/LanguageProvider';

type Props = {
  guestName: string;
  initialBio: string | null;
  initialPhotoUrl: string | null;
  showPrompt?: boolean;
  className?: string;
};

export default function ProfileEditPanel({
  guestName,
  initialBio,
  initialPhotoUrl,
  showPrompt = true,
  className = 'mt-8 border-t border-greige pt-8',
}: Props) {
  const { t } = useLanguage();
  const [bio, setBio] = useState(initialBio ?? '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('bio', bio);
    if (photoFile) fd.set('photo', photoFile);
    startTransition(async () => {
      const result = await updateProfile(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setError(null);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className={className}>
      {showPrompt && (
        <p className="font-body text-sm text-charcoal/55 mb-6 text-center italic leading-relaxed">
          {t.profile.setupPrompt}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <GuestAvatar name={guestName} photoUrl={photoPreview} size={80} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={t.profile.changePhoto}
              className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-green text-white shadow hover:bg-green-light transition-colors"
            >
              <Camera size={14} aria-hidden="true" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="sr-only"
            onChange={handleFile}
            aria-label={t.profile.changePhoto}
          />
        </div>

        <div>
          <label htmlFor="profile-bio" className="font-body text-sm text-charcoal/80 block mb-1">
            {t.profile.bioLabel}
          </label>
          <textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t.profile.bioPlaceholder}
            className="w-full border border-greige rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent resize-none"
          />
          <p className="font-body text-xs text-charcoal/40 text-right mt-0.5">{bio.length}/500</p>
        </div>

        {error && (
          <p className="font-body text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || saved}
          className="w-full flex items-center justify-center gap-2 bg-green hover:bg-green-light text-white font-body font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
        >
          {saved ? (
            <>
              <Check size={16} aria-hidden="true" />
              {t.profile.saved}
            </>
          ) : isPending ? (
            t.profile.saving
          ) : (
            t.profile.save
          )}
        </button>
      </form>
    </div>
  );
}
