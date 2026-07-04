import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session.isAdmin) redirect('/tomma/bobba');
  return <AdminLoginForm />;
}
