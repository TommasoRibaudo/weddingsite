'use client';

import { Fragment, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X } from 'lucide-react';
import { unReserveGift } from '@/app/actions/gifts';
import { addGift, deleteGift, updateGift, removeContribution } from '@/app/actions/admin';

export type AdminGiftContribution = {
  id: string;
  contributed_by: string;
  amount: number;
  created_at?: string;
};

export type AdminGift = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_link: string | null;
  price: number | null;
  reserved_by: string | null;
  reserved_at: string | null;
  created_at: string;
  divideable: boolean;
  gift_contributions?: AdminGiftContribution[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function inputClass() {
  return 'w-full border border-greige rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent';
}

export default function AdminGiftList({ gifts }: { gifts: AdminGift[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function refreshAfterWork() {
    setWorkingId(null);
    router.refresh();
  }

  function handleUnReserve(giftId: string) {
    setError(null);
    setWorkingId(giftId);
    startTransition(async () => {
      const result = await unReserveGift(giftId);
      if (result && 'error' in result) setError(result.error ?? null);
      refreshAfterWork();
    });
  }

  function handleDelete(gift: AdminGift) {
    if (!window.confirm(`Delete "${gift.name}"?`)) return;
    setError(null);
    setWorkingId(gift.id);
    startTransition(async () => {
      const result = await deleteGift(gift.id);
      if (result && 'error' in result) setError(result.error ?? null);
      if (editingId === gift.id) setEditingId(null);
      refreshAfterWork();
    });
  }

  function handleRemoveContribution(contributionId: string, contributorName: string) {
    if (!window.confirm(`Remove contribution from "${contributorName}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeContribution(contributionId);
      if (result && 'error' in result) setError(result.error ?? null);
      router.refresh();
    });
  }

  function handleAddGift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await addGift(formData);
      if (result && 'error' in result) {
        setError(result.error ?? null);
      } else {
        formRef.current?.reset();
        setShowAddForm(false);
        router.refresh();
      }
    });
  }

  function handleUpdateGift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const giftId = String(formData.get('giftId') ?? '');
    setError(null);
    setWorkingId(giftId);
    startTransition(async () => {
      const result = await updateGift(formData);
      if (result && 'error' in result) {
        setError(result.error ?? null);
      } else {
        setEditingId(null);
        router.refresh();
      }
      setWorkingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="font-body text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {gifts.length === 0 ? (
        <p className="font-body text-gray-400 italic">No gifts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm border-collapse">
            <thead>
              <tr className="border-b border-greige text-left">
                <th className="py-2 pr-4 font-semibold text-gray-700">Name</th>
                <th className="py-2 pr-4 font-semibold text-gray-700">Price</th>
                <th className="py-2 pr-4 font-semibold text-gray-700">Status</th>
                <th className="py-2 pr-4 font-semibold text-gray-700">Reserved by</th>
                <th className="py-2 pr-4 font-semibold text-gray-700">Reserved at</th>
                <th className="py-2 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((gift) => {
                const isWorking = isPending && workingId === gift.id;
                const isEditing = editingId === gift.id;
                const contributions = gift.gift_contributions ?? [];
                const totalContributed = contributions.reduce((s, c) => s + c.amount, 0);
                const isFullyFunded = gift.divideable && gift.price !== null && totalContributed >= gift.price;
                const fundedPct = gift.divideable && gift.price ? Math.min(100, Math.round((totalContributed / gift.price) * 100)) : 0;

                return (
                  <Fragment key={gift.id}>
                    <tr className="border-b border-greige hover:bg-green-pale/50 transition-colors">
                      <td className="py-2 pr-4 text-gray-800">{gift.name}</td>
                      <td className="py-2 pr-4 text-gray-600">
                        {gift.price !== null ? formatPrice(gift.price) : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        {gift.divideable ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            isFullyFunded
                              ? 'bg-green text-white border-transparent'
                              : 'bg-green-pale text-green border-green/20'
                          }`}>
                            {isFullyFunded ? 'Funded' : `Group ${fundedPct}%`}
                          </span>
                        ) : gift.reserved_by ? (
                          <span className="bg-green text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            Reserved
                          </span>
                        ) : (
                          <span className="bg-green-pale text-green text-xs font-semibold px-2 py-0.5 rounded-full border border-green/20">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {gift.divideable
                          ? contributions.length > 0
                            ? `${contributions.length} contributor${contributions.length !== 1 ? 's' : ''}`
                            : '-'
                          : (gift.reserved_by ?? '-')}
                      </td>
                      <td className="py-2 pr-4 text-gray-400">
                        {gift.divideable
                          ? '-'
                          : gift.reserved_at
                            ? formatDate(gift.reserved_at)
                            : '-'}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Edit ${gift.name}`}
                            onClick={() => {
                              setEditingId(isEditing ? null : gift.id);
                              setError(null);
                            }}
                            className="p-1 text-gray-400 hover:text-green transition-colors"
                          >
                            {isEditing ? <X size={15} /> : <Pencil size={15} />}
                          </button>
                          {!gift.divideable && gift.reserved_by && (
                            <button
                              type="button"
                              onClick={() => handleUnReserve(gift.id)}
                              disabled={isWorking}
                              className="font-body text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 underline underline-offset-2"
                            >
                              Un-reserve
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={`Delete ${gift.name}`}
                            onClick={() => handleDelete(gift)}
                            disabled={isWorking}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isEditing && (
                      <tr className="border-b border-greige bg-white">
                        <td colSpan={6} className="p-4 space-y-4">
                          <form onSubmit={handleUpdateGift} className="grid gap-4 md:grid-cols-2">
                            <input type="hidden" name="giftId" value={gift.id} />
                            <label className="font-body text-sm text-gray-700">
                              Name
                              <input
                                name="name"
                                type="text"
                                required
                                defaultValue={gift.name}
                                className={`${inputClass()} mt-1`}
                              />
                            </label>
                            <label className="font-body text-sm text-gray-700">
                              Price
                              <input
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={gift.price ?? ''}
                                className={`${inputClass()} mt-1`}
                              />
                            </label>
                            <label className="font-body text-sm text-gray-700 md:col-span-2">
                              Description
                              <textarea
                                name="description"
                                rows={2}
                                defaultValue={gift.description ?? ''}
                                className={`${inputClass()} mt-1 resize-none`}
                              />
                            </label>
                            <label className="font-body text-sm text-gray-700">
                              External link
                              <input
                                name="external_link"
                                type="url"
                                defaultValue={gift.external_link ?? ''}
                                className={`${inputClass()} mt-1`}
                              />
                            </label>
                            <label className="font-body text-sm text-gray-700">
                              Image URL
                              <input
                                name="image_url"
                                type="url"
                                defaultValue={gift.image_url ?? ''}
                                className={`${inputClass()} mt-1`}
                              />
                            </label>
                            <label className="font-body text-sm text-gray-700 flex items-center gap-2 md:col-span-2">
                              <input
                                type="checkbox"
                                name="divideable"
                                defaultChecked={gift.divideable}
                                className="rounded border-greige accent-green"
                              />
                              Group gift (multiple guests can contribute toward the total)
                            </label>
                            <div className="md:col-span-2 flex gap-3">
                              <button
                                type="submit"
                                disabled={isWorking}
                                className="bg-green text-white font-body font-semibold rounded-lg px-5 py-2 text-sm hover:bg-green-light transition-colors disabled:opacity-60"
                              >
                                {isWorking ? 'Saving...' : 'Save changes'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="border border-greige text-gray-600 font-body font-semibold rounded-lg px-5 py-2 text-sm hover:border-green hover:text-green transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>

                          {gift.divideable && contributions.length > 0 && (
                            <div className="border-t border-greige pt-4">
                              <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Contributions ({contributions.length})
                                {gift.price !== null && (
                                  <span className="ml-2 normal-case font-normal text-gray-400">
                                    — {formatPrice(totalContributed)} of {formatPrice(gift.price)}
                                  </span>
                                )}
                              </p>
                              <ul className="space-y-1">
                                {contributions.map((c) => (
                                  <li key={c.id} className="flex items-center justify-between gap-4 font-body text-sm text-gray-600">
                                    <span>
                                      <span className="font-medium">{c.contributed_by}</span>
                                      <span className="text-gray-400"> — {formatPrice(c.amount)}</span>
                                      {c.created_at && (
                                        <span className="text-gray-400"> · {formatDate(c.created_at)}</span>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveContribution(c.id, c.contributed_by)}
                                      disabled={isPending}
                                      className="font-body text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 underline underline-offset-2 whitespace-nowrap"
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setError(null);
          }}
          className="font-body text-sm text-green font-semibold hover:underline"
        >
          {showAddForm ? 'Cancel' : '+ Add gift'}
        </button>

        {showAddForm && (
          <form
            ref={formRef}
            onSubmit={handleAddGift}
            className="mt-4 bg-white border border-greige rounded-xl p-6 space-y-4 max-w-lg"
          >
            <h3 className="font-body font-semibold text-gray-800">Add a gift</h3>

            <div>
              <label htmlFor="gift-name" className="font-body text-sm text-gray-700 block mb-1">
                Name *
              </label>
              <input id="gift-name" name="name" type="text" required className={inputClass()} />
            </div>

            <div>
              <label htmlFor="gift-description" className="font-body text-sm text-gray-700 block mb-1">
                Description
              </label>
              <textarea
                id="gift-description"
                name="description"
                rows={2}
                className={`${inputClass()} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="gift-price" className="font-body text-sm text-gray-700 block mb-1">
                Price
              </label>
              <input
                id="gift-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                className={inputClass()}
              />
            </div>

            <div>
              <label htmlFor="gift-link" className="font-body text-sm text-gray-700 block mb-1">
                External link
              </label>
              <input id="gift-link" name="external_link" type="url" className={inputClass()} />
            </div>

            <div>
              <label htmlFor="gift-image" className="font-body text-sm text-gray-700 block mb-1">
                Image URL
              </label>
              <input id="gift-image" name="image_url" type="url" className={inputClass()} />
            </div>

            <label className="font-body text-sm text-gray-700 flex items-center gap-2">
              <input
                type="checkbox"
                name="divideable"
                className="rounded border-greige accent-green"
              />
              Group gift (multiple guests can contribute toward the total)
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="bg-green text-white font-body font-semibold rounded-lg px-6 py-2 text-sm hover:bg-green-light transition-colors disabled:opacity-60"
            >
              {isPending ? 'Adding...' : 'Add gift'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
