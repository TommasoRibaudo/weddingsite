'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
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
  sort_order: number;
  divideable: boolean;
  gift_contributions?: GiftContribution[];
  fundingPercent?: number;
  viewerHasContribution?: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

export default function GiftCard({ gift, isAdmin, guestName }: { gift: Gift; isAdmin: boolean; guestName: string }) {
  const { t, locale } = useLanguage();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const descriptionRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el || isDescriptionExpanded) return;

    const checkTruncation = () => setIsDescriptionTruncated(el.scrollHeight > el.clientHeight + 1);
    checkTruncation();

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);
    return () => observer.disconnect();
  }, [gift.description, isDescriptionExpanded]);

  const showDescriptionToggle = isDescriptionTruncated || isDescriptionExpanded;
  const descriptionToggleLabel = isDescriptionExpanded
    ? locale === 'it' ? 'Mostra meno' : 'Ver menos'
    : locale === 'it' ? 'Leggi tutto' : 'Leer más';

  const contributions = gift.gift_contributions ?? [];
  const contributors = contributions.reduce<{ name: string; amount: number }[]>((acc, contribution) => {
    const existing = acc.find((item) => item.name === contribution.contributed_by);
    if (existing) {
      existing.amount += contribution.amount;
    } else {
      acc.push({ name: contribution.contributed_by, amount: contribution.amount });
    }
    return acc;
  }, []);
  const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);
  const fundedPct = gift.fundingPercent ?? (gift.divideable && gift.price ? Math.min(100, (totalContributed / gift.price) * 100) : 0);
  const isFullyFunded = gift.divideable && fundedPct >= 100;
  const myTotal = contributions
    .filter((c) => c.contributed_by === guestName)
    .reduce((sum, c) => sum + c.amount, 0);
  const viewerHasContribution = gift.viewerHasContribution ?? myTotal > 0;
  const canContribute = gift.divideable && (gift.price !== null || gift.fundingPercent !== undefined);

  const isReserved = !gift.divideable && gift.reserved_by !== null;
  const isMine = !gift.divideable && !!guestName && gift.reserved_by === guestName;
  const isDimmed = (isReserved && !isMine) || isFullyFunded;
  const statusBadge = gift.divideable && isFullyFunded ? (
    <span className="pointer-events-none absolute top-3 right-3 z-20 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-green px-3 py-1 text-center font-body text-xs font-semibold text-white shadow-sm">
      {t.gifts.fullyFunded}
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
          {gift.price !== null && (!gift.divideable || isAdmin) && (
            <span className="font-body text-green font-semibold text-sm whitespace-nowrap">{formatPrice(gift.price)}</span>
          )}
        </div>

        {gift.description && (
          <div className="space-y-1">
            {showDescriptionToggle ? (
              <button
                type="button"
                aria-expanded={isDescriptionExpanded}
                onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
                className="block w-full text-left"
              >
                <span
                  ref={descriptionRef}
                  className={`font-body text-charcoal/70 text-sm leading-snug ${isDescriptionExpanded ? 'block' : 'line-clamp-2'}`}
                >
                  {gift.description}
                </span>
                <span className="mt-1 block font-body text-sm font-semibold text-green hover:underline">
                  {descriptionToggleLabel}
                </span>
              </button>
            ) : (
              <span ref={descriptionRef} className="font-body text-charcoal/70 text-sm leading-snug line-clamp-2">
                {gift.description}
              </span>
            )}
          </div>
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

        {canContribute && (
          <div className="space-y-1.5">
            {isAdmin && gift.price !== null && (
              <div className="flex justify-between font-body text-xs text-gray-500">
                <span>{formatPrice(totalContributed)} {t.gifts.funded}</span>
                <span>{formatPrice(Math.max(0, gift.price - totalContributed))} {t.gifts.remaining}</span>
              </div>
            )}
            <div className="w-full bg-greige rounded-full h-1.5">
              <div
                className="bg-green rounded-full h-1.5 transition-all duration-300"
                style={{ width: `${fundedPct}%` }}
              />
            </div>
            {isAdmin && myTotal > 0 && (
              <p className="font-body text-xs text-green font-medium">
                {t.gifts.yourContribution} {formatPrice(myTotal)}
              </p>
            )}
            {isAdmin && contributors.length > 0 && (
              <div className="rounded-md border border-greige bg-green-pale/30 px-3 py-2">
                <p className="font-body text-xs font-semibold text-charcoal">{t.gifts.contributors}</p>
                <ul className="mt-1 space-y-1">
                  {contributors.map((contributor) => (
                    <li
                      key={contributor.name}
                      className="flex items-baseline justify-between gap-3 font-body text-xs text-charcoal/70"
                    >
                      <span className="min-w-0 truncate">{contributor.name}</span>
                      <span className="shrink-0 font-semibold text-green">
                        {formatPrice(contributor.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex-1" />

        <div className="pt-2 border-t border-greige flex items-center justify-between gap-2">
          {gift.divideable ? (
            canContribute ? (
              <div className="w-full space-y-2">
                <ContributeButton giftId={gift.id} />
                {viewerHasContribution && <WithdrawContributionButton giftId={gift.id} />}
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
