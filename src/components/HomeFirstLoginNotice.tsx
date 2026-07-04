'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

const STORAGE_PREFIX = 'wedding-home-menu-notice-seen';

export default function HomeFirstLoginNotice({
  guestName,
  dietaryComplete,
}: {
  guestName: string;
  dietaryComplete: boolean;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [dietarySavedThisSession, setDietarySavedThisSession] = useState(false);
  const [visible, setVisible] = useState(false);
  const storageKey = `${STORAGE_PREFIX}:${guestName || 'guest'}`;

  useEffect(() => {
    function handleDietarySaved() {
      setDietarySavedThisSession(true);
      setVisible(false);
      window.localStorage.setItem(storageKey, '1');
    }

    window.addEventListener('dietary-preferences-saved', handleDietarySaved);
    return () => window.removeEventListener('dietary-preferences-saved', handleDietarySaved);
  }, [storageKey]);

  useEffect(() => {
    if (pathname !== '/home' || dietaryComplete || dietarySavedThisSession) return;

    const timer = window.setTimeout(() => {
      setVisible(window.localStorage.getItem(storageKey) !== '1');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dietaryComplete, dietarySavedThisSession, pathname, storageKey]);

  function dismiss() {
    window.localStorage.setItem(storageKey, '1');
    setVisible(false);
  }

  const shouldShow = visible && pathname === '/home' && !dietaryComplete && !dietarySavedThisSession;

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-40 px-4" role="alert" aria-live="polite">
      <div className="mx-auto max-w-xl rounded-lg border-2 border-green bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-green font-body text-lg font-bold text-white">
            !
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-body text-lg font-bold text-charcoal">
              {t.home.menuReminderTitle}
            </h2>
            <p className="mt-2 font-body text-base leading-relaxed text-charcoal/85">
              {t.home.menuReminderBody}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/menu#food-preferences"
                onClick={dismiss}
                className="rounded-lg bg-green px-4 py-3 text-center font-body font-semibold text-white transition-colors hover:bg-green-light"
              >
                {t.home.menuReminderAction}
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg border border-greige px-4 py-3 font-body font-semibold text-charcoal/75 transition-colors hover:border-green hover:text-green"
              >
                {t.home.menuReminderDismiss}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="grid size-9 shrink-0 place-items-center rounded-md text-charcoal/60 transition-colors hover:bg-cream hover:text-green"
            aria-label={t.home.menuReminderDismiss}
            title={t.home.menuReminderDismiss}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
