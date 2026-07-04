'use client';

import { localeOptions, locales } from '@/lib/i18n';
import { useLanguage } from './LanguageProvider';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  const activeIndex = locales.indexOf(locale);

  return (
    <div
      className={`relative inline-flex items-center rounded-full border border-greige bg-white/80 p-1 shadow-sm ${
        compact ? 'self-start' : ''
      }`}
      aria-label={t.nav.language}
    >
      {/* sliding pill */}
      <span
        className="absolute top-1 left-1 h-9 w-10 rounded-full bg-green shadow-sm pointer-events-none"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-hidden="true"
      />
      {locales.map((option) => {
        const active = option === locale;
        const meta = localeOptions[option];

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            className={`relative z-10 flex h-9 w-10 items-center justify-center rounded-full text-lg transition-colors duration-200 ${
              active ? 'text-white' : 'text-charcoal/75 hover:text-green'
            }`}
            aria-label={meta.label}
            aria-pressed={active}
            title={meta.label}
          >
            <span aria-hidden="true">{meta.flag}</span>
          </button>
        );
      })}
    </div>
  );
}
