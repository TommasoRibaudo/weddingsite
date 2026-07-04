'use client';

import { useLanguage } from '@/components/LanguageProvider';
import Reveal from '@/components/Reveal';

export default function DayTimeline() {
  const { t } = useLanguage();

  return (
    <section className="day-floral py-16 md:py-24 px-4 bg-green-pale/70">
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center mb-12">
          <h2 className="font-display text-5xl md:text-6xl text-green">
            {t.home.ourDay}
          </h2>
        </Reveal>
        <ol className="relative border-l-2 border-green ml-4 md:ml-0 md:max-w-xl md:mx-auto flex flex-col gap-0">
          {t.home.schedule.map(({ time, event }, i) => (
            <Reveal key={i} as="li" delay={Math.min(i * 90, 360)} className="pl-8 pb-10 last:pb-0 relative">
          <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green border-2 border-white" />
              <p className="font-body text-sm text-green font-semibold uppercase tracking-wide">
                {time}
              </p>
              <p className="font-body text-lg text-charcoal">{event}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
