'use client';

import Link from 'next/link';
import { Camera, Gift, UtensilsCrossed } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { useLanguage } from '@/components/LanguageProvider';

const services = [
  {
    href: '/menu',
    icon: UtensilsCrossed,
    labelKey: 'menu',
    descriptionKey: 'menu',
  },
  {
    href: '/gifts',
    icon: Gift,
    labelKey: 'gifts',
    descriptionKey: 'gifts',
  },
  {
    href: '/gallery',
    icon: Camera,
    labelKey: 'gallery',
    descriptionKey: 'gallery',
  },
] as const;

export default function ServiceCards() {
  const { t } = useLanguage();

  return (
    <section className="px-4 pb-14 pt-6 md:pb-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-6 text-center">
            <p className="font-body text-sm font-semibold uppercase tracking-wide text-green">
              {t.home.serviceCardsEyebrow}
            </p>
            <h2 className="mt-2 font-body text-3xl font-semibold text-charcoal md:text-4xl">
              {t.home.serviceCardsTitle}
            </h2>
          </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map(({ href, icon: Icon, labelKey, descriptionKey }, index) => (
            <Reveal key={href} delay={index * 90} className="h-full">
              <Link
                href={href}
                className="floral-card group flex h-full min-h-44 flex-col rounded-lg border border-greige bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-2"
              >
                <span className="mb-5 grid size-11 place-items-center rounded-full border border-greige bg-green-pale text-green transition-colors group-hover:border-green group-hover:bg-green group-hover:text-white">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="font-body text-xl font-semibold text-charcoal">
                  {t.nav[labelKey]}
                </span>
                <span className="mt-2 flex-1 font-body text-sm leading-relaxed text-charcoal/70">
                  {t.home.serviceCards[descriptionKey]}
                </span>
                <span className="mt-5 font-body text-sm font-semibold text-green">
                  {t.home.serviceCardsAction}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
