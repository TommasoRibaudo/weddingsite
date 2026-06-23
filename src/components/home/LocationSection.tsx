import { wedding } from '@/lib/wedding-config';

export default function LocationSection() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-body font-semibold text-3xl md:text-4xl text-gray-800 mb-6">
          Where to Find Us
        </h2>
        <p className="font-body text-xl text-gray-700">{wedding.venueName}</p>
        <p className="font-body text-gray-500 mt-1">{wedding.venueAddress}</p>
        <a
          href={wedding.venueMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-8 px-8 py-3 border-2 border-green text-green font-body font-semibold rounded-full hover:bg-green hover:text-white transition-colors"
        >
          Get Directions
        </a>
      </div>
    </section>
  );
}
