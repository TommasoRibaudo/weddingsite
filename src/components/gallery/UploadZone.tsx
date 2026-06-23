'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

type FileStatus = {
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

export default function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<FileStatus[]>([]);
  const [busy, setBusy] = useState(false);

  async function processFiles(files: File[]) {
    if (files.length === 0) return;
    const initial: FileStatus[] = files.map(f => ({ name: f.name, status: 'pending' }));
    setQueue(initial);
    setBusy(true);

    for (let i = 0; i < files.length; i++) {
      setQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'uploading' } : item));
      const fd = new FormData();
      fd.append('file', files[i]);
      try {
        const res = await fetch('/api/gallery/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (res.ok && json.ok) {
          setQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'done' } : item));
        } else {
          setQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'error', error: json.error ?? 'Upload failed.' } : item));
        }
      } catch {
        setQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'error', error: 'Network error.' } : item));
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

  return (
    <div className="mb-10">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none
          ${dragging ? 'border-green bg-green-muted' : 'border-greige hover:border-green-light bg-white'}
          ${busy ? 'pointer-events-none opacity-70' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !busy && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={e => e.target.files && processFiles(Array.from(e.target.files))}
        />
        <Upload className="mx-auto mb-3 text-green-light" size={28} />
        <p className="font-body text-base text-gray-600">
          {busy ? 'Uploading…' : 'Drop photos here or click to browse'}
        </p>
        <p className="font-body text-xs text-gray-400 mt-1">
          JPEG · PNG · WebP · HEIC &nbsp;·&nbsp; max 10 MB each
        </p>
      </div>

      {queue.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {queue.map((item, i) => (
            <li key={i} className="flex items-center gap-2 font-body text-sm">
              {item.status === 'done' && <CheckCircle size={15} className="text-green shrink-0" />}
              {item.status === 'error' && <AlertCircle size={15} className="text-red-500 shrink-0" />}
              {(item.status === 'pending' || item.status === 'uploading') && (
                <span className={`inline-block w-4 h-4 rounded-full border-2 border-green shrink-0 ${item.status === 'uploading' ? 'animate-spin border-t-transparent' : 'opacity-30'}`} />
              )}
              <span className="truncate text-gray-600">{item.name}</span>
              {item.error && <span className="ml-auto shrink-0 text-xs text-red-500">{item.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
