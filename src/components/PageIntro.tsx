'use client';

import { useLanguage } from './LanguageProvider';

type PageIntroProps = {
  section: 'menu' | 'gifts' | 'gallery';
};

export default function PageIntro({ section }: PageIntroProps) {
  const { t } = useLanguage();
  const copy = t[section];

  return (
    <div className="floral-heading text-center mb-12 pt-4">
      <h1 className="font-display text-7xl md:text-8xl text-green mb-4 animate-fade-up">
        {copy.title}
      </h1>
      <p
        className="font-body italic text-lg text-charcoal/70 animate-fade-up"
        style={{ animationDelay: '150ms' }}
      >
        {copy.subtitle}
      </p>
    </div>
  );
}
