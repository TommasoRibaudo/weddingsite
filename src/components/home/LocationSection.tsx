'use client';

import { wedding } from '@/lib/wedding-config';
import { useLanguage } from '@/components/LanguageProvider';
import Reveal from '@/components/Reveal';

export default function LocationSection() {
  const { t } = useLanguage();

  return (
    <section className="location-floral py-16 md:py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <h2 className="font-body font-semibold text-3xl md:text-4xl text-charcoal mb-6">
            {t.home.where}
          </h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 text-left">
          <Reveal delay={0}>
            <div className="floral-card ceremony-location-card bg-white rounded-lg shadow-sm border border-greige border-t-4 border-t-green p-6 flex flex-col h-full">
              <p className="font-body text-sm font-semibold uppercase tracking-wide text-green">
                {t.home.ceremony}
              </p>
              <p className="font-body text-xl text-charcoal mt-2">
                {wedding.ceremonyVenueName}
              </p>
              <p className="font-body text-charcoal/70 mt-1">
                {wedding.ceremonyVenueAddress}
              </p>
              <a
                href={wedding.ceremonyMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 self-start inline-block px-5 py-2 border-2 border-green bg-green text-white font-body font-semibold rounded-full text-sm hover:bg-transparent hover:text-green transition-colors"
              >
                {t.home.directionsCeremony}
              </a>
            </div>
          </Reveal>
          <Reveal delay={130}>
            <div className="floral-card dinner-location-card bg-white rounded-lg shadow-sm border border-greige border-t-4 border-t-green p-6 flex flex-col h-full">
              <p className="font-body text-sm font-semibold uppercase tracking-wide text-green">
                {t.home.dinner}
              </p>
              <p className="font-body text-xl text-charcoal mt-2">{wedding.venueName}</p>
              <p className="font-body text-charcoal/70 mt-1">{wedding.venueAddress}</p>
              <a
                href={wedding.venueMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 self-start inline-block px-5 py-2 border-2 border-green bg-green text-white font-body font-semibold rounded-full text-sm hover:bg-transparent hover:text-green transition-colors"
              >
                {t.home.directionsVenue}
              </a>
            </div>
          </Reveal>
        </div>
        <Reveal delay={60}>
          <p className="font-body text-charcoal mt-5 max-w-2xl mx-auto leading-relaxed">
            {t.home.locationNote} {t.home.parkingNote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
