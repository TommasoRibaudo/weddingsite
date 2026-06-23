import { wedding } from '@/lib/wedding-config';

export default function HeroSection() {
  return (
    <section className="min-h-[50vh] md:min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-b from-cream to-green-pale">
      <h1 className="font-display text-6xl md:text-8xl text-green leading-tight">
        {wedding.coupleNames}
      </h1>
      <p className="font-body italic text-xl md:text-2xl text-gray-600 mt-4">
        {wedding.dateDisplay}
      </p>
      <hr className="border-green w-24 mx-auto mt-6" />
    </section>
  );
}
