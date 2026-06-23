'use server';
import { compareSync } from 'bcryptjs';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function verifyPassword(formData: FormData) {
  const password = formData.get('password') as string;
  const valid = compareSync(password, process.env.GUEST_PASSWORD_HASH!);
  if (!valid) return { error: 'Incorrect password.' };
  const session = await getSession();
  session.passwordVerified = true;
  await session.save();
  return { ok: true };
}

export async function setGuestName(formData: FormData) {
  const session = await getSession();
  if (!session.passwordVerified) redirect('/');
  const name = (formData.get('name') as string)?.trim().slice(0, 50);
  if (!name) return { error: 'Please enter your name.' };
  session.access = true;
  session.guestName = name;
  session.passwordVerified = false;
  await session.save();
  redirect('/home');
}
