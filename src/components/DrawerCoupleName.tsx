import { wedding } from '@/lib/wedding-config';

const [first, second] = wedding.coupleNames.split(' & ');

export default function DrawerCoupleName() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pl-5 translate-y-6"
      aria-hidden="true"
    >
      <p className="font-display text-8xl leading-tight text-green/80 select-none">
        {first}
      </p>
      <p className="font-display text-8xl leading-tight text-green/80 select-none">
        &amp;
      </p>
      <p className="font-display text-8xl leading-tight text-green/80 select-none">
        {second}
      </p>
    </div>
  );
}
