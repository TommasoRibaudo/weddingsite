'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { unReserveGift } from '@/app/actions/gifts';
import { addGift } from '@/app/actions/admin';

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
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
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

export default function AdminGiftList({ gifts }: { gifts: AdminGift[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleUnReserve(giftId: string) {
    startTransition(async () => {
      await unReserveGift(giftId);
      router.refresh();
    });
  }

  function handleAddGift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setAddError(null);
    startTransition(async () => {
      const result = await addGift(formData);
      if (result && 'error' in result) {
        setAddError((result.error as string) ?? null);
      } else {
        formRef.current?.reset();
        setShowAddForm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
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
              {gifts.map((gift) => (
                <tr key={gift.id} className="border-b border-greige hover:bg-green-pale/50 transition-colors">
                  <td className="py-2 pr-4 text-gray-800">{gift.name}</td>
                  <td className="py-2 pr-4 text-gray-600">
                    {gift.price !== null ? formatPrice(gift.price) : '—'}
                  </td>
                  <td className="py-2 pr-4">
                    {gift.reserved_by ? (
                      <span className="bg-green text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        Reserved
                      </span>
                    ) : (
                      <span className="bg-green-pale text-green text-xs font-semibold px-2 py-0.5 rounded-full border border-green/20">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{gift.reserved_by ?? '—'}</td>
                  <td className="py-2 pr-4 text-gray-400">
                    {gift.reserved_at ? formatDate(gift.reserved_at) : '—'}
                  </td>
                  <td className="py-2">
                    {gift.reserved_by && (
                      <button
                        onClick={() => handleUnReserve(gift.id)}
                        disabled={isPending}
                        className="font-body text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 underline underline-offset-2"
                      >
                        Un-reserve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={() => { setShowAddForm(!showAddForm); setAddError(null); }}
          className="font-body text-sm text-green font-semibold hover:underline"
        >
          {showAddForm ? '↑ Cancel' : '+ Add gift'}
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
              <input
                id="gift-name"
                name="name"
                type="text"
                required
                className="w-full border border-greige rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="gift-description" className="font-body text-sm text-gray-700 block mb-1">
                Description
              </label>
              <textarea
                id="gift-description"
                name="description"
                rows={2}
                className="w-full border border-greige rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="gift-price" className="font-body text-sm text-gray-700 block mb-1">
                Price (£)
              </label>
              <input
                id="gift-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-greige rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="gift-link" className="font-body text-sm text-gray-700 block mb-1">
                External link
              </label>
              <input
                id="gift-link"
                name="external_link"
                type="url"
                className="w-full border border-greige rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="gift-image" className="font-body text-sm text-gray-700 block mb-1">
                Image URL
              </label>
              <input
                id="gift-image"
                name="image_url"
                type="url"
                className="w-full border border-greige rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
              />
            </div>

            {addError && (
              <p className="font-body text-sm text-red-600" role="alert">
                {addError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="bg-green text-white font-body font-semibold rounded-lg px-6 py-2 text-sm hover:bg-green-light transition-colors disabled:opacity-60"
            >
              {isPending ? 'Adding…' : 'Add gift'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
