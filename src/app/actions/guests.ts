'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { generateInviteSlug } from '@/lib/invite-token';
import { revalidatePath } from 'next/cache';

const MAX_SLUG_ATTEMPTS = 5;

async function insertGuestWithSlug(guest_name: string, party_label: string | null) {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = generateInviteSlug();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('guests') as any).insert({
      slug,
      guest_name,
      party_label,
    });
    if (!error) return { ok: true as const, slug };
    if (error.code !== '23505') return { ok: false as const, error: error.message };
  }
  return { ok: false as const, error: 'Could not generate a unique link after several attempts.' };
}

export async function createGuestLink(formData: FormData) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  const guest_name = (formData.get('guest_name') as string)?.trim();
  if (!guest_name) return { error: 'Name is required.' };
  const party_label = (formData.get('party_label') as string)?.trim() || null;

  const result = await insertGuestWithSlug(guest_name, party_label);
  if (!result.ok) return { error: result.error };

  revalidatePath('/tomma/bobba');
  return { ok: true, slug: result.slug };
}

export async function createGuestLinksBulk(formData: FormData) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  const raw = (formData.get('guests') as string) ?? '';
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return { error: 'Enter at least one guest.' };

  let created = 0;
  const errors: string[] = [];

  for (const line of lines) {
    const [namePart, partyPart] = line.split('|').map((s) => s.trim());
    if (!namePart) continue;
    const result = await insertGuestWithSlug(namePart, partyPart || null);
    if (result.ok) created++;
    else errors.push(`${namePart}: ${result.error}`);
  }

  revalidatePath('/tomma/bobba');
  return { ok: true, created, errors };
}

export async function revokeGuestLink(id: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  await adminSupabase.from('guests').update({ revoked: true } as never).eq('id', id);

  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function restoreGuestLink(id: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  await adminSupabase.from('guests').update({ revoked: false } as never).eq('id', id);

  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function regenerateGuestLink(id: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = generateInviteSlug();
    const { error } = await adminSupabase
      .from('guests')
      .update({ slug, redeemed_at: null, last_visited_at: null } as never)
      .eq('id', id);
    if (!error) {
      revalidatePath('/tomma/bobba');
      return { ok: true, slug };
    }
    if (error.code !== '23505') return { error: error.message };
  }
  return { error: 'Could not generate a unique link after several attempts.' };
}

export async function deleteGuestLink(id: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };
  if (!id) return { error: 'Guest is required.' };

  const { error } = await adminSupabase.from('guests').delete().eq('id', id);
  if (error) return { error: 'Failed to delete guest link.' };

  revalidatePath('/tomma/bobba');
  return { ok: true };
}
