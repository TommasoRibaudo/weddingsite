'use client';
import Image from 'next/image';
import { Gift as GiftIcon } from 'lucide-react';
import ReserveButton from './ReserveButton';
import UnReserveButton from './UnReserveButton';

export type Gift = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_link: string | null;
  price: number | null;
  reserved_by: string | null;
  created_at: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(price);
}

export default function GiftCard({ gift, isAdmin }: { gift: Gift; isAdmin: boolean }) {
  const isReserved = gift.reserved_by !== null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden relative ${isReserved ? 'opacity-60' : ''}`}>
      {/* Reserved badge */}
      {isReserved && (
        <span className="absolute top-3 right-3 z-10 bg-green text-white text-xs font-body font-semibold px-3 py-1 rounded-full">
          Reserved
        </span>
      )}

      {/* Image */}
      <div className="aspect-[4/3] relative bg-green-pale flex items-center justify-center">
        {gift.image_url ? (
          <Image
            src={gift.image_url}
            alt={gift.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <GiftIcon size={48} className="text-green opacity-30" />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-body font-semibold text-gray-800 text-lg leading-tight">{gift.name}</h3>
          {gift.price !== null && (
            <span className="font-body text-green font-semibold text-sm whitespace-nowrap">{formatPrice(gift.price)}</span>
          )}
        </div>

        {gift.description && (
          <p className="font-body text-gray-500 text-sm line-clamp-2 leading-snug">{gift.description}</p>
        )}

        {gift.external_link && (
          <a
            href={gift.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-green hover:underline"
          >
            View item →
          </a>
        )}

        {/* Admin: reserver info */}
        {isAdmin && isReserved && (
          <p className="font-body text-xs text-gray-400 italic">
            Reserved by: {gift.reserved_by}
          </p>
        )}

        {/* Spacer pushes footer to bottom */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="pt-2 border-t border-greige flex items-center justify-between gap-2">
          {isReserved ? (
            <>
              <span className="font-body text-sm text-gray-400 italic">Reserved</span>
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
