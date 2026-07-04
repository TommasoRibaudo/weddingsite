import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import GateForm from '@/components/GateForm';

const TOKEN_RE = /^[A-Za-z0-9_-]{6,32}$/;

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) notFound();

  const session = await getSession();
  if (session.access) redirect('/home');

  const { data: guest } = await adminSupabase
    .from('guests')
    .select('guest_name, revoked')
    .eq('slug', token)
    .maybeSingle();

  if (!guest || guest.revoked) redirect('/');

  return <GateForm inviteToken={token} inviteName={guest.guest_name} />;
}
