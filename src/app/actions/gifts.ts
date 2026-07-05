'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { refresh, revalidatePath } from 'next/cache';

export async function contributeToGift(giftId: string, amount: number) {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };

  const guestName = session.guestName;
  if (!guestName) return { error: 'Not authenticated.' };

  const parsedAmount = Math.round(amount);
  if (!Number.isFinite(amount) || !parsedAmount || parsedAmount <= 0) return { error: 'invalid_amount' };

  const { data: giftData } = await adminSupabase
    .from('gifts')
    .select('id, price, divideable')
    .eq('id', giftId)
    .single();

  const gift = giftData as { id: string; price: number | null; divideable: boolean } | null;
  if (!gift) return { error: 'Gift not found.' };
  if (!gift.divideable) return { error: 'This gift does not support group contributions.' };
  if (!gift.price || gift.price <= 0) return { error: 'This gift has no price set.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminSupabase.from('gift_contributions') as any).insert({
    gift_id: giftId,
    contributed_by: guestName,
    amount: parsedAmount,
  });

  if (error) return { error: 'Something went wrong. Please try again.' };

  revalidatePath('/gifts');
  refresh();
  return { ok: true };
}

export async function reserveGift(giftId: string) {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };

  const guestName = session.guestName;

  const reservation = {
    reserved_by: guestName,
    reserved_at: new Date().toISOString(),
  } as never;

  const { data, error } = await adminSupabase
    .from('gifts')
    .update(reservation)
    .eq('id', giftId)
    .is('reserved_by', null)
    .select('id');

  if (error) return { error: 'Something went wrong. Please try again.' };
  if (!data || data.length === 0) return { error: 'already_taken' };

  revalidatePath('/gifts');
  return { ok: true };
}

export async function unReserveGift(giftId: string) {
  const session = await getSession();
  if (!session.access) return { error: 'Unauthorised.' };

  if (!session.isAdmin) {
    const guestName = session.guestName;
    const { data } = await adminSupabase
      .from('gifts')
      .select('reserved_by')
      .eq('id', giftId)
      .single();
    if (!data || data.reserved_by !== guestName) return { error: 'Unauthorised.' };
  }

  const reservationClear = {
    reserved_by: null,
    reserved_at: null,
  } as never;

  await adminSupabase
    .from('gifts')
    .update(reservationClear)
    .eq('id', giftId);

  revalidatePath('/gifts');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function withdrawContribution(giftId: string) {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };

  const guestName = session.guestName;
  if (!guestName) return { error: 'Not authenticated.' };

  const { error } = await adminSupabase
    .from('gift_contributions')
    .delete()
    .eq('gift_id', giftId)
    .eq('contributed_by', guestName);

  if (error) return { error: 'Something went wrong. Please try again.' };

  revalidatePath('/gifts');
  refresh();
  return { ok: true };
}
