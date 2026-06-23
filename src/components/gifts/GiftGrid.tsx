'use client';
import GiftCard, { type Gift } from './GiftCard';

export default function GiftGrid({ gifts, isAdmin }: { gifts: Gift[]; isAdmin: boolean }) {
  if (gifts.length === 0) {
    return (
      <p className="font-body italic text-gray-500 text-center py-16">Gift list coming soon.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {gifts.map((gift) => (
        <GiftCard key={gift.id} gift={gift} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
