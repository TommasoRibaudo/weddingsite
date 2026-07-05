import HeroSection from '@/components/home/HeroSection';
import DetailsStrip from '@/components/home/DetailsStrip';
import DayTimeline from '@/components/home/DayTimeline';
import LocationSection from '@/components/home/LocationSection';
import ServiceCards from '@/components/home/ServiceCards';
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
            <div className="floral-panel bg-green-pale/80 rounded-lg border border-greige p-8">
              <p className="font-body text-charcoal leading-relaxed">
                {wedding.additionalNotes}
              </p>
            </div>
          </div>
        </section>
      )}
      <ServiceCards />
    </>
  );
}
