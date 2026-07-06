'use client';
import GiftCard, { type Gift } from './GiftCard';
import type { GiftDepositConfig } from '@/lib/gift-deposit-types';
import Reveal from '@/components/Reveal';
import { useLanguage } from '@/components/LanguageProvider';

export default function GiftGrid({
  gifts,
  isAdmin,
  guestName,
  depositConfig,
}: {
  gifts: Gift[];
  isAdmin: boolean;
  guestName: string;
  depositConfig: GiftDepositConfig | null;
}) {
  const { t } = useLanguage();

  if (gifts.length === 0) {
    return (
      <p className="font-body italic text-gray-500 text-center py-16">{t.gifts.comingSoon}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {gifts.map((gift, i) => (
        <Reveal key={gift.id} delay={Math.min(i * 80, 400)} scale>
          <GiftCard gift={gift} isAdmin={isAdmin} guestName={guestName} depositConfig={depositConfig} />
        </Reveal>
      ))}
    </div>
  );
}
