import { adminSupabase } from '@/lib/supabase/admin';
import { getSession } from '@/lib/session';
import GiftMapSection from '@/components/gifts/GiftMapSection';
import GiftGrid from '@/components/gifts/GiftGrid';
import type { Gift } from '@/components/gifts/GiftCard';
import { isWeddingDay } from '@/lib/wedding-config';
import { redirect } from 'next/navigation';
import PageIntro from '@/components/PageIntro';

export const dynamic = 'force-dynamic';

function getGiftMapEmbedUrl() {
  const rawUrl = process.env.GOOGLE_MYMAPS_GIFTS_EMBED_URL?.trim();
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const isGoogleMaps = url.hostname === 'www.google.com' && url.pathname.startsWith('/maps/d/');
    return isGoogleMaps ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function GiftsPage() {
  if (isWeddingDay()) redirect('/home');

  const session = await getSession();
  const giftMapEmbedUrl = getGiftMapEmbedUrl();

  const { data } = await adminSupabase
    .from('gifts')
    .select('id, name, description, image_url, external_link, price, reserved_by, created_at, divideable, gift_contributions(id, contributed_by, amount)')
    .order('created_at', { ascending: true });

  const gifts = (data ?? []) as Gift[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <PageIntro section="gifts" />
      <GiftMapSection embedUrl={giftMapEmbedUrl} />
      <GiftGrid gifts={gifts} isAdmin={session.isAdmin ?? false} guestName={session.guestName ?? ''} />
    </div>
  );
}
