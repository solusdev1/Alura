import { auth } from '@/backend/auth';
import { redirect } from 'next/navigation';
import AdminBasesManager from '@/frontend/components/admin/AdminBasesManager';

export default async function BasesPage() {
  const session = await auth();
  const role = (session?.user as { role: string } | undefined)?.role;
  if (role !== 'ADMIN') redirect('/dashboard');

  return <AdminBasesManager />;
}
