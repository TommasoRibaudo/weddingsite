'use client';

import { wedding } from '@/lib/wedding-config';
import { useLanguage } from '@/components/LanguageProvider';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="hero-floral flex flex-col items-center text-center px-4 pt-8 pb-0 md:pt-10">
      <span className="hero-top-flower" aria-hidden="true" />
      <h1
        className="font-display text-7xl md:text-9xl text-green leading-tight animate-fade-up"
        style={{ animationDelay: '0ms' }}
      >
        {wedding.coupleNames}
      </h1>
      <p
        className="font-body italic text-xl md:text-2xl text-charcoal mt-4 animate-fade-up"
        style={{ animationDelay: '180ms' }}
      >
        {t.home.dateDisplay}
      </p>
      <hr
        className="border-green w-24 mx-auto mt-6 animate-fade-up"
        style={{ animationDelay: '320ms' }}
      />
      <span className="hero-bottom-flower" aria-hidden="true" />
    </section>
  );
}
