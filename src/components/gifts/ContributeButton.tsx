'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { contributeToGift } from '@/app/actions/gifts';
import { useLanguage } from '@/components/LanguageProvider';

type Status = 'idle' | 'pending' | 'done' | 'error';

export default function ContributeButton({ giftId }: { giftId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>('idle');
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function getErrorMessage(error: string | undefined) {
    if (error === 'invalid_amount') return t.gifts.invalidAmount;
    return error ?? t.menu.genericError;
  }

  function handleContribute() {
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
      setErrorMsg(t.gifts.invalidAmount);
      return;
    }
    setErrorMsg('');
    setStatus('pending');
    startTransition(async () => {
      try {
        const result = await contributeToGift(giftId, val);
        if (result.ok) {
          setStatus('done');
          router.refresh();
        } else {
          setStatus('error');
          setErrorMsg(getErrorMessage(result.error));
        }
      } catch {
        setStatus('error');
        setErrorMsg(t.menu.genericError);
      }
    });
  }

  if (status === 'done') {
    return <p className="font-body text-green font-semibold text-sm">{t.gifts.contributed}</p>;
  }

  return (
    <div className="w-full space-y-2">
      <p className="font-body text-xs text-gray-500">{t.gifts.amountLabel}</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-gray-400 pointer-events-none">
            $
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-7 pr-3 py-2 border border-greige rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
          />
        </div>
        <button
          onClick={handleContribute}
          disabled={isPending}
          className="bg-green text-white font-body font-semibold rounded-lg px-4 py-2 text-sm hover:bg-green-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          {isPending && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {isPending ? t.gifts.contributing : t.gifts.contribute}
        </button>
      </div>
      {errorMsg && <p className="font-body text-red-600 text-xs">{errorMsg}</p>}
    </div>
  );
}
