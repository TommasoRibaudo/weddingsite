import { gallery } from '@/lib/wedding-config';

function formatOpenDate() {
  const date = new Date(gallery.opensAt);
  return {
    date: date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
  };
}

export default function GalleryLocked() {
  const { date, time } = formatOpenDate();
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-px bg-green mx-auto mb-8" />
        <h1 className="font-display text-4xl md:text-5xl text-green mb-6">
          Gallery opens on our wedding day
        </h1>
        <div className="w-16 h-px bg-green mx-auto my-6" />
        <p className="font-body text-lg text-gray-700">{date}</p>
        <p className="font-body text-sm text-gray-500 mt-1">{time}</p>
        <p className="font-body italic text-sm text-gray-400 mt-4">
          Come back then to share your photos and memories.
        </p>
      </div>
    </div>
  );
}
