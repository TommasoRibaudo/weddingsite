import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import GateForm from '@/components/GateForm';

export default async function GatePage() {
  const session = await getSession();
  if (session.access) redirect('/home');
  return <GateForm />;
}
