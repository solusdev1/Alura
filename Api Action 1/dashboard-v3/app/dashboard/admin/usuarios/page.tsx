import { auth } from '@/backend/auth';
import { redirect } from 'next/navigation';
import AdminUsersManager from '@/frontend/components/admin/AdminUsersManager';

export default async function UsuariosPage() {
  const session = await auth();
  const role = (session?.user as { role: string } | undefined)?.role;
  if (role !== 'ADMIN') redirect('/dashboard');

  return <AdminUsersManager />;
}
