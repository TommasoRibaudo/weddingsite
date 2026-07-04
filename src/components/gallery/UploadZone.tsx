'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { postTextPost } from '@/app/actions/gallery';
import { useLanguage } from '@/components/LanguageProvider';

type FileStatus = {
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

export default function UploadZone() {
  const { t } = useLanguage();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<FileStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messagePosted, setMessagePosted] = useState(false);
  const [isPostingMessage, startPostingMessage] = useTransition();

  async function processFiles(files: File[]) {
    if (files.length === 0) return;
    const initial: FileStatus[] = files.map((f) => ({ name: f.name, status: 'pending' }));
    setQueue(initial);
    setBusy(true);

    for (let i = 0; i < files.length; i++) {
      setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'uploading' } : item));
      const fd = new FormData();
      fd.append('file', files[i]);
      try {
        const res = await fetch('/api/gallery/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (res.ok && json.ok) {
          setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'done' } : item));
        } else {
          setQueue((q) => q.map((item, idx) => idx === i ? {
            ...item,
            status: 'error',
            error: json.error ?? t.gallery.uploadFailed,
          } : item));
        }
      } catch {
        setQueue((q) => q.map((item, idx) => idx === i ? {
          ...item,
          status: 'error',
          error: t.gallery.networkError,
        } : item));
      }
    }

    setBusy(false);
    router.refresh();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }

  function submitMessage() {
    const text = message.trim();
    if (!text || isPostingMessage) return;
    setMessageError(null);
    setMessagePosted(false);

    startPostingMessage(async () => {
      const result = await postTextPost(text);
      if (result.error) {
        setMessageError(result.error);
        return;
      }
      setMessage('');
      setMessagePosted(true);
      router.refresh();
    });
  }

  return (
    <div className="mb-10 grid gap-4 md:grid-cols-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={t.gallery.uploadLabel}
        className={`floral-card border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors select-none
          ${dragging ? 'border-green bg-green-muted' : 'border-greige hover:border-green-light bg-white/92'}
          ${busy ? 'pointer-events-none opacity-70' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !busy && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))}
        />
        <Upload className="mx-auto mb-3 text-green-light" size={28} />
        <p className="font-body text-base text-charcoal/75">
          {busy ? t.gallery.uploading : t.gallery.uploadPrompt}
        </p>
        <p className="font-body text-xs text-gray-400 mt-1">
          {t.gallery.uploadHelp}
        </p>
      </div>

      <div className="floral-card rounded-lg border border-greige bg-white/92 p-5 flex flex-col">
        <label htmlFor="feed-message" className="font-body font-semibold text-charcoal">
          {t.gallery.shareNote}
        </label>
        <textarea
          id="feed-message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setMessagePosted(false);
          }}
          placeholder={t.gallery.notePlaceholder}
          maxLength={700}
          rows={5}
          className="mt-3 min-h-32 w-full flex-1 rounded-lg border border-greige px-3 py-2 font-body text-sm text-charcoal resize-none focus:outline-none focus:ring-1 focus:ring-green placeholder:text-gray-300"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-body text-xs text-gray-400">{message.length}/700</p>
          <button
            type="button"
            onClick={submitMessage}
            disabled={isPostingMessage || !message.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2 font-body text-sm text-white transition-colors hover:bg-green-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} />
            {isPostingMessage ? t.gallery.posting : t.gallery.postNote}
          </button>
        </div>
        {messageError && <p className="mt-2 font-body text-xs text-red-500">{messageError}</p>}
        {messagePosted && <p className="mt-2 font-body text-xs text-green">{t.gallery.posted}</p>}
      </div>

      {queue.length > 0 && (
        <ul className="md:col-span-2 mt-1 space-y-1.5">
          {queue.map((item, i) => (
            <li key={i} className="flex items-center gap-2 font-body text-sm">
              {item.status === 'done' && <CheckCircle size={15} className="text-green shrink-0" />}
              {item.status === 'error' && <AlertCircle size={15} className="text-red-500 shrink-0" />}
              {(item.status === 'pending' || item.status === 'uploading') && (
                <span className={`inline-block w-4 h-4 rounded-full border-2 border-green shrink-0 ${item.status === 'uploading' ? 'animate-spin border-t-transparent' : 'opacity-30'}`} />
              )}
              <span className="truncate text-charcoal/75">{item.name}</span>
              {item.error && <span className="ml-auto shrink-0 text-xs text-red-500">{item.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
