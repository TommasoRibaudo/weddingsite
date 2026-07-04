'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, RefreshCw, Trash2, Check } from 'lucide-react';
import {
  createGuestLink,
  createGuestLinksBulk,
  revokeGuestLink,
  restoreGuestLink,
  regenerateGuestLink,
  deleteGuestLink,
} from '@/app/actions/guests';

export type AdminGuest = {
  id: string;
  slug: string;
  guest_name: string;
  party_label: string | null;
  revoked: boolean;
  created_at: string;
  redeemed_at: string | null;
  last_visited_at: string | null;
};

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

export default function AdminGuestList({ guests }: { guests: AdminGuest[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const bulkFormRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function refreshAfterWork() {
    setWorkingId(null);
    router.refresh();
  }

  function relativeLinkFor(slug: string) {
    return `/${slug}`;
  }

  function absoluteLinkFor(slug: string) {
    return `${window.location.origin}${relativeLinkFor(slug)}`;
  }
  function handleCopy(guest: AdminGuest) {
    navigator.clipboard.writeText(absoluteLinkFor(guest.slug));
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId((id) => (id === guest.id ? null : id)), 1500);
  }

  function handleAddGuest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createGuestLink(formData);
      if (result && 'error' in result) {
        setError(result.error ?? null);
      } else {
        formRef.current?.reset();
        setShowAddForm(false);
        router.refresh();
      }
    });
  }

  function handleBulkAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setBulkSummary(null);
    startTransition(async () => {
      const result = await createGuestLinksBulk(formData);
      if (result && 'error' in result) {
        setError(result.error ?? null);
      } else if (result) {
        bulkFormRef.current?.reset();
        setShowBulkForm(false);
        setBulkSummary(
          `Added ${result.created} guest${result.created !== 1 ? 's' : ''}.` +
            (result.errors.length > 0 ? ` ${result.errors.length} skipped.` : '')
        );
        router.refresh();
      }
    });
  }

  function handleRevoke(guest: AdminGuest) {
    setError(null);
    setWorkingId(guest.id);
    startTransition(async () => {
      const result = await revokeGuestLink(guest.id);
      if (result && 'error' in result) setError(result.error ?? null);
      refreshAfterWork();
    });
  }

  function handleRestore(guest: AdminGuest) {
    setError(null);
    setWorkingId(guest.id);
    startTransition(async () => {
      const result = await restoreGuestLink(guest.id);
      if (result && 'error' in result) setError(result.error ?? null);
      refreshAfterWork();
    });
  }

  function handleRegenerate(guest: AdminGuest) {
    if (!window.confirm(`Regenerate the link for "${guest.guest_name}"? The old link will stop working.`)) return;
    setError(null);
    setWorkingId(guest.id);
    startTransition(async () => {
      const result = await regenerateGuestLink(guest.id);
      if (result && 'error' in result) setError(result.error ?? null);
      refreshAfterWork();
    });
  }

  function handleDelete(guest: AdminGuest) {
    if (!window.confirm(`Delete the invite link for "${guest.guest_name}"?`)) return;
    setError(null);
    setWorkingId(guest.id);
    startTransition(async () => {
      const result = await deleteGuestLink(guest.id);
      if (result && 'error' in result) setError(result.error ?? null);
      refreshAfterWork();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="font-body text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {bulkSummary && (
        <p className="font-body text-sm text-green" role="status">
          {bulkSummary}
        </p>
      )}

      <p className="font-body text-xs text-gray-400">
        Names shown here are &ldquo;as invited&rdquo; — if a guest changes their display name
        after opening their link, this list won&apos;t reflect that.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setShowBulkForm(false);
          }}
          className="font-body text-sm text-green underline underline-offset-2"
        >
          {showAddForm ? 'Cancel' : '+ Add guest'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowBulkForm((v) => !v);
            setShowAddForm(false);
          }}
          className="font-body text-sm text-green underline underline-offset-2"
        >
          {showBulkForm ? 'Cancel' : '+ Bulk add'}
        </button>
      </div>

      {showAddForm && (
        <form ref={formRef} onSubmit={handleAddGuest} className="grid gap-4 md:grid-cols-2 bg-white border border-greige rounded-lg p-4">
          <label className="font-body text-sm text-gray-700">
            Name
            <input name="guest_name" type="text" required maxLength={50} className={`${inputClass()} mt-1`} />
          </label>
          <label className="font-body text-sm text-gray-700">
            Party label (optional)
            <input name="party_label" type="text" maxLength={50} className={`${inputClass()} mt-1`} />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-green hover:bg-green-light text-white font-body font-semibold rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-60"
            >
              Create link
            </button>
          </div>
        </form>
      )}

      {showBulkForm && (
        <form ref={bulkFormRef} onSubmit={handleBulkAdd} className="space-y-3 bg-white border border-greige rounded-lg p-4">
          <label className="font-body text-sm text-gray-700 block">
            One guest per line — optionally <code>Name | Party label</code>
            <textarea
              name="guests"
              rows={6}
              required
              placeholder={'Maria Smith\nJohn Doe | Smith Family'}
              className={`${inputClass()} mt-1 resize-none`}
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="bg-green hover:bg-green-light text-white font-body font-semibold rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-60"
          >
            Create links
          </button>
        </form>
      )}

      {guests.length === 0 ? (
        <p className="font-body text-gray-400 italic">No invite links yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm border-collapse">
            <thead>
              <tr className="border-b border-greige text-left">
                <th className="py-2 pr-4 font-semibold text-gray-700">Name</th>
                <th className="py-2 pr-4 font-semibold text-gray-700">Party</th>
                <th className="py-2 pr-4 font-semibold text-gray-700">Link</th>
                <th className="py-2 pr-4 font-semibold text-gray-700">Status</th>
                <th className="py-2 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => {
                const isWorking = isPending && workingId === guest.id;
                return (
                  <tr key={guest.id} className="border-b border-greige hover:bg-green-pale/50 transition-colors">
                    <td className="py-2 pr-4 text-gray-800">{guest.guest_name}</td>
                    <td className="py-2 pr-4 text-gray-600">{guest.party_label ?? '-'}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => handleCopy(guest)}
                        disabled={guest.revoked}
                        className="flex items-center gap-1 text-gray-500 hover:text-green transition-colors disabled:opacity-40"
                        title={relativeLinkFor(guest.slug)}
                      >
                        {copiedId === guest.id ? <Check size={14} /> : <Copy size={14} />}
                        <span className="truncate max-w-[12rem]">/{guest.slug}</span>
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      {guest.revoked ? (
                        <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200">
                          Revoked
                        </span>
                      ) : guest.redeemed_at ? (
                        <span
                          className="bg-green text-white text-xs font-semibold px-2 py-0.5 rounded-full"
                          title={`Last visited ${guest.last_visited_at ? formatDate(guest.last_visited_at) : ''}`}
                        >
                          Redeemed
                        </span>
                      ) : (
                        <span className="bg-green-pale text-green text-xs font-semibold px-2 py-0.5 rounded-full border border-green/20">
                          Not yet
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {guest.revoked ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(guest)}
                            disabled={isWorking}
                            className="font-body text-xs text-gray-400 hover:text-green transition-colors disabled:opacity-40 underline underline-offset-2"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevoke(guest)}
                            disabled={isWorking}
                            className="font-body text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 underline underline-offset-2"
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Regenerate link for ${guest.guest_name}`}
                          onClick={() => handleRegenerate(guest)}
                          disabled={isWorking}
                          className="p-1 text-gray-400 hover:text-green transition-colors disabled:opacity-40"
                        >
                          <RefreshCw size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete invite for ${guest.guest_name}`}
                          onClick={() => handleDelete(guest)}
                          disabled={isWorking}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
