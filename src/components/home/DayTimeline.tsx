import { wedding } from '@/lib/wedding-config';

export default function DayTimeline() {
  return (
    <section className="py-16 md:py-24 px-4 bg-green-pale">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-5xl md:text-6xl text-green text-center mb-12">
          Our Day
        </h2>
        <ol className="relative border-l-2 border-green ml-4 md:ml-0 md:max-w-xl md:mx-auto flex flex-col gap-0">
          {wedding.schedule.map(({ time, event }, i) => (
            <li key={i} className="pl-8 pb-10 last:pb-0 relative">
              {/* green dot */}
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green border-2 border-cream" />
              <p className="font-body text-sm text-green font-semibold uppercase tracking-wide">
                {time}
              </p>
              <p className="font-body text-lg text-gray-800">{event}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
