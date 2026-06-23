import { adminSupabase } from '@/lib/supabase/admin';
import { getSession } from '@/lib/session';
import GiftGrid from '@/components/gifts/GiftGrid';
import type { Gift } from '@/components/gifts/GiftCard';

export const dynamic = 'force-dynamic';

export default async function GiftsPage() {
  const session = await getSession();

  const { data } = await adminSupabase
    .from('gifts')
    .select('id, name, description, image_url, external_link, price, reserved_by, created_at')
    .order('created_at', { ascending: true });

  const gifts: Gift[] = data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-display text-6xl md:text-7xl text-green mb-4">Our Wishlist</h1>
        <p className="font-body italic text-lg text-gray-500">
          Your presence is our greatest gift, but if you&rsquo;d like to bring something&hellip;
        </p>
      </div>
      <GiftGrid gifts={gifts} isAdmin={session.isAdmin ?? false} />
    </div>
  );
}
