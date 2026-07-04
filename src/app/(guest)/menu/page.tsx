import Image from 'next/image';
import { getMyDietaryResponses } from '@/app/actions/menu';
import MenuDisplay from '@/components/menu/MenuDisplay';
import DietaryForm from '@/components/menu/DietaryForm';
import PageIntro from '@/components/PageIntro';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const existing = await getMyDietaryResponses();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <PageIntro section="menu" />
      <div className="floral-panel rounded-lg border border-greige bg-white/92 p-6 md:p-8 shadow-sm">
        <Image
          src="/wedding-assets/bouquet-in-vase.svg"
          alt=""
          aria-hidden="true"
          width={480}
          height={480}
          className="pointer-events-none select-none !absolute top-0 right-0 w-[480px] opacity-20"
          style={{ zIndex: 0 }}
        />
        <div className="relative" style={{ zIndex: 10 }}>
          <MenuDisplay />
          <DietaryForm existing={existing} />
        </div>
      </div>
    </div>
  );
}
