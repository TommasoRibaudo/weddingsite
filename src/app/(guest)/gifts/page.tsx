import { adminSupabase } from '@/lib/supabase/admin';
import { getSession } from '@/lib/session';
import GiftMapSection from '@/components/gifts/GiftMapSection';
import GiftGrid from '@/components/gifts/GiftGrid';
import type { Gift } from '@/components/gifts/GiftCard';
import { isWeddingDay } from '@/lib/wedding-config';
import { redirect } from 'next/navigation';
import PageIntro from '@/components/PageIntro';
import { getGiftDepositConfig } from '@/lib/gift-deposit-config';

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

async function loadGifts(includeContributionAmounts = true): Promise<Gift[]> {
  const contributionSelect = includeContributionAmounts
    ? 'gift_contributions(id, contributed_by, amount)'
    : 'gift_contributions(id, contributed_by)';

  const ordered = await adminSupabase
    .from('gifts')
    .select(`id, name, description, image_url, external_link, price, reserved_by, created_at, sort_order, divideable, ${contributionSelect}`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (!ordered.error) return (ordered.data ?? []) as Gift[];

  const fallback = await adminSupabase
    .from('gifts')
    .select(`id, name, description, image_url, external_link, price, reserved_by, created_at, divideable, ${contributionSelect}`)
    .order('created_at', { ascending: true });

  return ((fallback.data ?? []) as Omit<Gift, 'sort_order'>[]).map((gift, index) => ({
    ...gift,
    sort_order: index,
  }));
}

export default async function GiftsPage() {
  if (isWeddingDay()) redirect('/home');

  const session = await getSession();
  const isAdmin = session.isAdmin ?? false;
  const guestName = session.guestName ?? '';
  const giftMapEmbedUrl = getGiftMapEmbedUrl();
  const depositConfig = getGiftDepositConfig();

  const gifts = (await loadGifts()).map((gift) => {
    const contributions = gift.gift_contributions ?? [];
    const contributionTotal = contributions.reduce((sum, contribution) => sum + (contribution.amount ?? 0), 0);
    const fundingPercent = gift.divideable && gift.price ? Math.min(100, (contributionTotal / gift.price) * 100) : undefined;
    const viewerHasContribution = contributions.some((contribution) => contribution.contributed_by === guestName);

    if (isAdmin) {
      return {
        ...gift,
        fundingPercent,
        viewerHasContribution,
        gift_contributions: contributions.map((contribution) => ({
          id: contribution.id,
          contributed_by: contribution.contributed_by,
        })),
      };
    }

    return {
      ...gift,
      price: gift.divideable ? null : gift.price,
      gift_contributions: [],
      fundingPercent,
      viewerHasContribution,
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <PageIntro section="gifts" />
      <p className="mx-auto mb-8 max-w-2xl text-center font-body text-sm leading-relaxed text-charcoal/70">
        Elige el regalo en el que quieres participar, escribe el monto que prefieres aportar y presiona Aportar.
      </p>
      <GiftMapSection embedUrl={giftMapEmbedUrl} />
      <GiftGrid gifts={gifts} isAdmin={isAdmin} guestName={guestName} depositConfig={depositConfig} />
    </div>
  );
}
