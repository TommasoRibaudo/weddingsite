import { Clock, MapPin, Shirt } from 'lucide-react';
import { wedding } from '@/lib/wedding-config';

function DetailCard({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border-t-4 border-green p-6 flex flex-col items-center text-center gap-2">
      <div className="text-green">{icon}</div>
      <p className="font-body font-semibold text-gray-800 text-lg">{title}</p>
      {lines.map((line, i) => (
        <p key={i} className="font-body text-gray-600 text-sm leading-snug">
          {line}
        </p>
      ))}
    </div>
  );
}

export default function DetailsStrip() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        <DetailCard
          icon={<Clock size={28} />}
          title="Ceremony"
          lines={[wedding.ceremonyTime]}
        />
        <DetailCard
          icon={<MapPin size={28} />}
          title={wedding.venueName}
          lines={[
            wedding.venueAddress.slice(0, wedding.venueAddress.indexOf(',')),
            wedding.venueAddress.slice(wedding.venueAddress.indexOf(',') + 2),
          ]}
        />
        <DetailCard
          icon={<Shirt size={28} />}
          title="Dress Code"
          lines={[wedding.dressCode]}
        />
      </div>
    </section>
  );
}
