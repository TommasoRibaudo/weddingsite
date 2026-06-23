import HeroSection from '@/components/home/HeroSection';
import DetailsStrip from '@/components/home/DetailsStrip';
import DayTimeline from '@/components/home/DayTimeline';
import LocationSection from '@/components/home/LocationSection';
import { wedding } from '@/lib/wedding-config';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <DetailsStrip />
      <DayTimeline />
      <LocationSection />
      {wedding.additionalNotes && (
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-green-pale rounded-xl p-8">
              <p className="font-body text-gray-700 leading-relaxed">
                {wedding.additionalNotes}
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
