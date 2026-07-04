'use client';
import { useTransition } from 'react';
import { unReserveGift } from '@/app/actions/gifts';
import { useLanguage } from '@/components/LanguageProvider';

export default function UnReserveButton({ giftId }: { giftId: string }) {
  const { t } = useLanguage();
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
      {isPending ? t.gifts.release : t.gifts.unreserve}
    </button>
  );
}
