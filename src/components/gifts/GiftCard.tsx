'use client';
import Image from 'next/image';
import { Gift as GiftIcon } from 'lucide-react';
import ReserveButton from './ReserveButton';
import UnReserveButton from './UnReserveButton';
import ContributeButton from './ContributeButton';
import WithdrawContributionButton from './WithdrawContributionButton';
import { useLanguage } from '@/components/LanguageProvider';

export type GiftContribution = {
  id: string;
  contributed_by: string;
  amount: number;
};

export type Gift = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_link: string | null;
  price: number | null;
  reserved_by: string | null;
  created_at: string;
  divideable: boolean;
  gift_contributions?: GiftContribution[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

export default function GiftCard({ gift, isAdmin, guestName }: { gift: Gift; isAdmin: boolean; guestName: string }) {
  const { t } = useLanguage();

  const contributions = gift.gift_contributions ?? [];
  const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);
  const isFullyFunded = gift.divideable && gift.price !== null && totalContributed >= gift.price;
  const remaining = gift.divideable && gift.price !== null ? Math.max(0, gift.price - totalContributed) : 0;
  const fundedPct = gift.divideable && gift.price ? Math.min(100, (totalContributed / gift.price) * 100) : 0;
  const myTotal = contributions
    .filter((c) => c.contributed_by === guestName)
    .reduce((sum, c) => sum + c.amount, 0);

  const isReserved = !gift.divideable && gift.reserved_by !== null;
  const isMine = !gift.divideable && !!guestName && gift.reserved_by === guestName;
  const isDimmed = (isReserved && !isMine) || isFullyFunded;
  const statusBadge = gift.divideable ? (
    <span className={`pointer-events-none absolute top-3 right-3 z-20 max-w-[calc(100%-1.5rem)] truncate rounded-full px-3 py-1 text-center font-body text-xs font-semibold shadow-sm ${
      isFullyFunded
        ? 'bg-green text-white'
        : 'border border-green/20 bg-green-pale text-green'
    }`}>
      {isFullyFunded ? t.gifts.fullyFunded : t.gifts.divideable}
    </span>
  ) : isReserved ? (
    <span className="pointer-events-none absolute top-3 right-3 z-20 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-green px-3 py-1 text-center font-body text-xs font-semibold text-white shadow-sm">
      {t.gifts.reserved}
    </span>
  ) : null;

  return (
    <div className="floral-card relative flex flex-col overflow-hidden rounded-lg border border-greige bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-[4/3] relative bg-green-pale flex items-center justify-center">
        {statusBadge}
        {gift.image_url ? (
          <Image
            src={gift.image_url}
            alt={gift.name}
            fill
            className={`object-cover ${isDimmed ? 'opacity-60' : ''}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <GiftIcon size={48} className={`text-green ${isDimmed ? 'opacity-20' : 'opacity-30'}`} />
        )}
      </div>

      <div className="flex flex-col flex-1 p-5 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-body font-semibold text-charcoal text-lg leading-tight">{gift.name}</h3>
          {gift.price !== null && (
            <span className="font-body text-green font-semibold text-sm whitespace-nowrap">{formatPrice(gift.price)}</span>
          )}
        </div>

        {gift.description && (
          <p className="font-body text-charcoal/70 text-sm line-clamp-2 leading-snug">{gift.description}</p>
        )}

        {gift.external_link && (
          <a
            href={gift.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-green hover:underline"
          >
            {t.gifts.viewItem}
          </a>
        )}

        {!gift.divideable && isAdmin && isReserved && (
          <p className="font-body text-xs text-gray-400 italic">
            {t.gifts.reservedBy} {gift.reserved_by}
          </p>
        )}

        {gift.divideable && gift.price !== null && (
          <div className="space-y-1.5">
            <p className="font-body text-xs text-gray-400 italic leading-relaxed">{t.gifts.groupGiftExplain}</p>
            <div className="flex justify-between font-body text-xs text-gray-500">
              <span>{formatPrice(totalContributed)} {t.gifts.funded}</span>
              <span>{formatPrice(remaining)} {t.gifts.remaining}</span>
            </div>
            <div className="w-full bg-greige rounded-full h-1.5">
              <div
                className="bg-green rounded-full h-1.5 transition-all duration-300"
                style={{ width: `${fundedPct}%` }}
              />
            </div>
            {myTotal > 0 && (
              <p className="font-body text-xs text-green font-medium">
                {t.gifts.yourContribution} {formatPrice(myTotal)}
              </p>
            )}
          </div>
        )}

        <div className="flex-1" />

        <div className="pt-2 border-t border-greige flex items-center justify-between gap-2">
          {gift.divideable ? (
            isFullyFunded ? (
              <span className="font-body text-sm text-gray-400 italic">{t.gifts.fullyFunded}</span>
            ) : gift.price !== null ? (
              <div className="w-full space-y-2">
                <ContributeButton giftId={gift.id} maxAmount={remaining} />
                {myTotal > 0 && <WithdrawContributionButton giftId={gift.id} />}
              </div>
            ) : null
          ) : isMine ? (
            <>
              <span className="font-body text-sm text-green font-semibold">{t.gifts.youReservedThis}</span>
              <UnReserveButton giftId={gift.id} />
            </>
          ) : isReserved ? (
            <>
              <span className="font-body text-sm text-gray-400 italic">{t.gifts.reserved}</span>
              {isAdmin && <UnReserveButton giftId={gift.id} />}
            </>
          ) : (
            <ReserveButton giftId={gift.id} />
          )}
        </div>
      </div>
    </div>
  );
}
