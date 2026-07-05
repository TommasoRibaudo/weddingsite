'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { withdrawContribution } from '@/app/actions/gifts';
import { useLanguage } from '@/components/LanguageProvider';

export default function WithdrawContributionButton({
  giftId,
  onWithdrawn,
}: {
  giftId: string;
  onWithdrawn?: () => void;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  function handleWithdraw() {
    setErrorMsg('');
    startTransition(async () => {
      try {
        const result = await withdrawContribution(giftId);
        if (result.ok) {
          setDone(true);
          onWithdrawn?.();
          router.refresh();
        } else {
          setErrorMsg(result.error ?? t.menu.genericError);
        }
      } catch {
        setErrorMsg(t.menu.genericError);
      }
    });
  }

  if (done) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={handleWithdraw}
        disabled={isPending}
        className="font-body text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 underline underline-offset-2"
      >
        {isPending ? t.gifts.withdrawing : t.gifts.withdrawContribution}
      </button>
      {errorMsg && <p className="font-body text-red-600 text-xs">{errorMsg}</p>}
    </div>
  );
}
