'use client';

import { Clock, MapPin, Shirt } from 'lucide-react';
import { wedding } from '@/lib/wedding-config';
import { useLanguage } from '@/components/LanguageProvider';
import Reveal from '@/components/Reveal';

function DetailCard({
  icon,
  title,
  lines,
  className = '',
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
  className?: string;
}) {
  return (
    <div className={`floral-card h-full bg-white rounded-lg shadow-sm border border-greige border-t-4 border-t-green p-6 flex flex-col items-center text-center gap-2 ${className}`}>
      <div className="text-green">{icon}</div>
      <p className="font-body font-semibold text-charcoal text-lg">{title}</p>
      {lines.map((line, i) => (
        <p key={i} className="font-body text-charcoal/75 text-sm leading-snug max-w-2xl">
          {line}
        </p>
      ))}
    </div>
  );
}

export default function DetailsStrip() {
  const { t } = useLanguage();

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        <Reveal delay={0} className="h-full">
          <DetailCard
            icon={<Clock size={28} />}
            title={t.home.ceremony}
            lines={[wedding.ceremonyTime]}
            className="tulip-card"
          />
        </Reveal>
        <Reveal delay={120} className="h-full">
          <DetailCard
            icon={<MapPin size={28} />}
            title={t.home.locations}
            lines={[t.home.ceremonyLocation, t.home.dinnerLocation]}
            className="location-card"
          />
        </Reveal>
        <Reveal delay={220} className="md:col-span-2">
          <DetailCard
            icon={<Shirt size={28} />}
            title={t.home.dressCode}
            lines={[...t.home.dressCodeLines]}
          />
        </Reveal>
      </div>
    </section>
  );
}
