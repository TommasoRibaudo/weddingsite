'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  defaultLocale,
  isLocale,
  localeOptions,
  translations,
  type Locale,
  type Translation,
} from '@/lib/i18n';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem('wedding-locale');
    if (isLocale(stored)) {
      const timer = setTimeout(() => setLocaleState(stored), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeOptions[locale].htmlLang;
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem('wedding-locale', nextLocale);
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: translations[locale],
    }),
    [locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
