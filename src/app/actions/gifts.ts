'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function reserveGift(giftId: string) {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };

  const guestName = session.guestName;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data, error } = await (adminSupabase.from('gifts') as any)
    .update({ reserved_by: guestName, reserved_at: new Date().toISOString() })
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
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  await (adminSupabase.from('gifts') as any)
    .update({ reserved_by: null, reserved_at: null })
    .eq('id', giftId);

  revalidatePath('/gifts');
  revalidatePath('/admin');
  return { ok: true };
}
