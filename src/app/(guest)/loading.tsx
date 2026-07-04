import { wedding } from '@/lib/wedding-config';

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center gap-8 px-4 text-center animate-fade-in">
      <span className="font-display text-5xl text-green loader-text">
        {wedding.coupleNames}
      </span>
      <div className="loader-ring" />
    </div>
  );
}
