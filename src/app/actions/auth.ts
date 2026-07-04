'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function confirmInvite(_prevState: unknown, formData: FormData) {
  const token = (formData.get('token') as string)?.trim();
  if (!token) return { error: 'invalid' };

  const { data: guest } = await adminSupabase
    .from('guests')
    .select('guest_name, revoked, redeemed_at')
    .eq('slug', token)
    .maybeSingle();

  if (!guest || guest.revoked) return { error: 'invalid' };

  const name = guest.guest_name;

  // An invite token guest has no way to pick a different name, so a unique-violation
  // here (admin reused a name another guest already claimed) must not strand them —
  // swallow it and let them share the existing profile row.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: claimError } = await (adminSupabase.from('guest_profiles') as any).insert({
    guest_name: name,
    bio: null,
    photo_path: null,
    updated_at: new Date().toISOString(),
  });
  if (claimError && claimError.code !== '23505') {
    console.error('[confirmInvite] profile claim error:', claimError.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase.from('guests') as any)
    .update({
      last_visited_at: new Date().toISOString(),
      ...(guest.redeemed_at ? {} : { redeemed_at: new Date().toISOString() }),
    })
    .eq('slug', token);

  const session = await getSession();
  session.access = true;
  session.guestName = name;
  await session.save();
  redirect('/home');
}

export async function changeGuestName(formData: FormData) {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };

  const oldName = session.guestName;
  const name = (formData.get('name') as string)?.trim().slice(0, 50);
  if (!name) return { error: 'Please enter your name.' };

  if (!oldName || oldName === name) {
    session.guestName = name;
    await session.save();
    return { ok: true, guestName: name };
  }

  // Block if the new name is already claimed by another guest
  const { data: existing } = await adminSupabase
    .from('guest_profiles')
    .select('guest_name')
    .eq('guest_name', name)
    .maybeSingle();

  if (existing) return { error: 'name_taken' };

  // Migrate all DB references from oldName to name
  await Promise.all([
    adminSupabase.from('gifts').update({ reserved_by: name } as never).eq('reserved_by', oldName),
    adminSupabase.from('gift_contributions').update({ contributed_by: name } as never).eq('contributed_by', oldName),
    adminSupabase.from('guest_profiles').update({ guest_name: name } as never).eq('guest_name', oldName),
    adminSupabase.from('photos').update({ uploaded_by: name } as never).eq('uploaded_by', oldName),
    adminSupabase.from('comments').update({ author: name } as never).eq('author', oldName),
    adminSupabase.from('photo_likes').update({ guest_name: name } as never).eq('guest_name', oldName),
    adminSupabase.from('menu_responses').update({ account_name: name } as never).eq('account_name', oldName),
  ]);

  // If the guest had no profile row yet, the update above created nothing.
  // Ensure the new name is claimed so it can't be taken by someone else.
  await adminSupabase.from('guest_profiles').upsert(
    { guest_name: name, bio: null, photo_path: null, updated_at: new Date().toISOString() },
    { onConflict: 'guest_name', ignoreDuplicates: true },
  );

  session.guestName = name;
  await session.save();
  return { ok: true, guestName: name };
}
