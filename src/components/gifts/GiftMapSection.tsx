'use client';

import { ExternalLink, MapPin } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

type GiftMapSectionProps = {
  embedUrl: string | null;
};

export default function GiftMapSection({ embedUrl }: GiftMapSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="mb-10" aria-labelledby="gift-map-title">
      <div className="floral-card overflow-hidden rounded-lg border border-greige bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-greige px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-green-muted text-green">
              <MapPin size={19} aria-hidden="true" />
            </span>
            <div>
              <h2 id="gift-map-title" className="font-body text-xl font-semibold leading-tight text-charcoal">
                {t.gifts.mapTitle}
              </h2>
              <p className="font-body text-sm leading-snug text-charcoal/70">
                {t.gifts.mapIntro}
              </p>
            </div>
          </div>

          {embedUrl && (
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-full border border-green/20 px-3 py-1.5 font-body text-sm font-semibold text-green transition-colors hover:bg-green-muted focus:outline-none focus:ring-2 focus:ring-green/30 sm:self-center"
            >
              {t.gifts.openMap}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </div>

        {embedUrl ? (
          <div className="h-[28rem] w-full bg-green-pale sm:h-auto sm:aspect-[16/9]">
            <iframe
              src={embedUrl}
              title={t.gifts.mapTitle}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="flex min-h-64 items-center justify-center bg-green-pale px-6 py-12 text-center">
            <p className="font-body italic text-charcoal/60">{t.gifts.mapComingSoon}</p>
          </div>
        )}
      </div>
    </section>
  );
}

