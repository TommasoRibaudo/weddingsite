'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type DietaryResponse = {
  id: string;
  account_name: string;
  guest_name: string;
  vegan: boolean;
  vegetarian: boolean;
  gluten_free: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonPayload = {
  guest_name: string;
  vegan: boolean;
  vegetarian: boolean;
  gluten_free: boolean;
  notes: string | null;
};

export async function saveAllDietaryPreferences(
  people: PersonPayload[]
): Promise<{ ok?: boolean; error?: string }> {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };
  if (!people.length || people.length > 5) return { error: 'Invalid number of people.' };

  const accountName = session.guestName as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminSupabase.from('menu_responses') as any;

  const { error: deleteError } = await db.delete().eq('account_name', accountName);
  if (deleteError) return { error: 'Something went wrong. Please try again.' };

  const rows = people.map((p) => ({
    account_name: accountName,
    guest_name: p.guest_name,
    vegan: p.vegan,
    vegetarian: p.vegetarian,
    gluten_free: p.gluten_free,
    notes: p.notes,
    updated_at: new Date().toISOString(),
  }));

  const { error: insertError } = await db.insert(rows);
  if (insertError) return { error: 'Something went wrong. Please try again.' };

  revalidatePath('/menu');
  revalidatePath('/tomma/bobba');
  return { ok: true };
}

export async function getMyDietaryResponses(): Promise<DietaryResponse[]> {
  const session = await getSession();
  if (!session.access) return [];

  const { data } = await adminSupabase
    .from('menu_responses')
    .select('*')
    .eq('account_name', session.guestName)
    .order('created_at', { ascending: true });

  return (data as DietaryResponse[]) ?? [];
}

export async function getAllDietaryResponses(): Promise<DietaryResponse[]> {
  const session = await getSession();
  if (!session.isAdmin) return [];

  const { data } = await adminSupabase
    .from('menu_responses')
    .select('*')
    .order('guest_name', { ascending: true });

  return (data as DietaryResponse[]) ?? [];
}
