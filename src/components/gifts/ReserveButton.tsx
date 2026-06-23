'use client';
import { useTransition, useState } from 'react';
import { reserveGift } from '@/app/actions/gifts';

type Status = 'available' | 'pending' | 'reserved' | 'taken' | 'error';

export default function ReserveButton({ giftId }: { giftId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>('available');
  const [errorMsg, setErrorMsg] = useState('');

  function handleReserve() {
    if (status !== 'available') return;
    setStatus('pending');
    startTransition(async () => {
      const result = await reserveGift(giftId);
      if (result.ok) {
        setStatus('reserved');
      } else if (result.error === 'already_taken') {
        setStatus('taken');
      } else {
        setStatus('error');
        setErrorMsg(result.error ?? 'Something went wrong.');
      }
    });
  }

  if (status === 'reserved') {
    return (
      <p className="font-body text-green font-semibold text-sm">Reserved ✓</p>
    );
  }

  if (status === 'taken') {
    return (
      <p className="font-body text-gray-400 text-sm italic">Already reserved</p>
    );
  }

  return (
    <div>
      <button
        onClick={handleReserve}
        disabled={isPending}
        className="w-full min-h-[44px] bg-green text-white font-body font-semibold rounded-lg px-4 py-2 text-sm hover:bg-green-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {isPending ? 'Reserving…' : 'Reserve'}
      </button>
      {status === 'error' && (
        <p className="font-body text-red-600 text-xs mt-1">{errorMsg}</p>
      )}
    </div>
  );
}
