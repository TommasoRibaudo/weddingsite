'use client';
import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import type { GiftDepositConfig } from '@/lib/gift-deposit-types';

export default function DepositInstructions({ config }: { config: GiftDepositConfig }) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState(config.destinations[0]?.id ?? '');
  const selectedDestination = config.destinations.find((destination) => destination.id === selectedId) ?? config.destinations[0];

  if (!selectedDestination) return null;

  return (
    <section className="space-y-3 border-t border-greige pt-3">
      <div className="space-y-1">
        <p className="font-body text-sm font-semibold text-green">{t.gifts.depositThanks}</p>
        <p className="font-body text-xs leading-snug text-charcoal/70">{t.gifts.depositIntro}</p>
      </div>

      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label={t.gifts.depositDestinationLabel}>
        {config.destinations.map((destination) => {
          const isSelected = selectedDestination.id === destination.id;

          return (
            <button
              key={destination.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedId(destination.id)}
              className={`rounded-md border px-3 py-2 font-body text-xs font-semibold transition-colors ${
                isSelected
                  ? 'border-green bg-green text-white'
                  : 'border-greige bg-white text-charcoal hover:border-green'
              }`}
            >
              {destination.label}
            </button>
          );
        })}
      </div>

      <dl className="space-y-2 font-body text-xs text-charcoal/80">
        {selectedDestination.details.map((item) => (
          <div key={`${selectedDestination.id}-${item.label}`} className="space-y-0.5">
            <dt className="font-semibold text-charcoal">{item.label}</dt>
            <dd className="break-all">{item.value}</dd>
          </div>
        ))}
        <div className="space-y-0.5">
          <dt className="font-semibold text-charcoal">{t.gifts.depositBeneficiary}</dt>
          <dd>{config.beneficiary}</dd>
        </div>
        <div className="space-y-0.5">
          <dt className="font-semibold text-charcoal">{t.gifts.depositReason}</dt>
          <dd>{config.reason}</dd>
        </div>
      </dl>
    </section>
  );
}