'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateGalleryOverride } from '@/app/actions/admin';

type Override = 'open' | 'closed' | null;

type Props = {
  override: Override;
  scheduledOpen: boolean;
};

const OPTIONS: { value: Override; label: string }[] = [
  { value: null, label: 'Automatic' },
  { value: 'open', label: 'Force open' },
  { value: 'closed', label: 'Force closed' },
];

export default function GalleryOverrideControl({ override, scheduledOpen }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedOverride, setSelectedOverride] = useState<Override>(override);
  const [prevOverride, setPrevOverride] = useState<Override>(override);
  const [pendingValue, setPendingValue] = useState<Override>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (override !== prevOverride) {
    setPrevOverride(override);
    setSelectedOverride(override);
  }

  const effectiveOpen = selectedOverride === 'open' ? true : selectedOverride === 'closed' ? false : scheduledOpen;

  function handleSelect(value: Override) {
    if (value === selectedOverride || isPending) return;
    setError(null);
    setPendingValue(value);
    startTransition(async () => {
      const result = await updateGalleryOverride(value);
      setPendingValue(null);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSelectedOverride(value);
      router.refresh();
    });
  }

  return (
    <div className="mb-4 rounded-xl border border-greige bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-sm text-gray-700">
          Feed is currently{' '}
          <span className={effectiveOpen ? 'font-semibold text-green' : 'font-semibold text-red-500'}>
            {effectiveOpen ? 'open' : 'closed'}
          </span>
          {selectedOverride ? (
            <span className="text-gray-400"> - manual override, ignores the schedule</span>
          ) : (
            <span className="text-gray-400"> - following the schedule</span>
          )}
        </p>
        <div className="flex gap-2">
          {OPTIONS.map((option) => {
            const isActive = selectedOverride === option.value;
            const isSaving = isPending && pendingValue === option.value;
            return (
              <button
                key={option.label}
                type="button"
                disabled={isPending}
                onClick={() => handleSelect(option.value)}
                className={`rounded-full px-3 py-1 font-body text-xs font-semibold transition-colors disabled:opacity-40 ${
                  isActive ? 'bg-green text-white' : 'bg-green-pale text-gray-700 hover:bg-greige'
                }`}
              >
                {isSaving ? 'Saving...' : option.label}
              </button>
            );
          })}
        </div>
      </div>
      {error ? <p className="mt-3 font-body text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
