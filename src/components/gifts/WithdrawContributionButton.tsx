'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { withdrawContribution } from '@/app/actions/gifts';
import { useLanguage } from '@/components/LanguageProvider';

export default function WithdrawContributionButton({ giftId }: { giftId: string }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  function handleWithdraw() {
    startTransition(async () => {
      await withdrawContribution(giftId);
      setDone(true);
      router.refresh();
    });
  }

  if (done) return null;

  return (
    <button
      onClick={handleWithdraw}
      disabled={isPending}
      className="font-body text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 underline underline-offset-2"
    >
      {isPending ? t.gifts.withdrawing : t.gifts.withdrawContribution}
    </button>
  );
}
