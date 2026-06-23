'use client';
import { useTransition } from 'react';
import { unReserveGift } from '@/app/actions/gifts';

export default function UnReserveButton({ giftId }: { giftId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleUnReserve() {
    startTransition(async () => {
      await unReserveGift(giftId);
    });
  }

  return (
    <button
      onClick={handleUnReserve}
      disabled={isPending}
      className="font-body text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 underline underline-offset-2"
    >
      {isPending ? 'Releasing…' : 'Un-reserve'}
    </button>
  );
}
