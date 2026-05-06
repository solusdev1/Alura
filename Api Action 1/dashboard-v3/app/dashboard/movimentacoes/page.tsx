import { auth } from '@/backend/auth';
import MovimentacoesView from '@/frontend/components/dashboard/MovimentacoesView';

export default async function MovimentacoesPage() {
  const session = await auth();
  const user = session?.user as { role: string; baseName: string | null };
  return <MovimentacoesView isAdmin={user.role === 'ADMIN'} userRole={user.role || 'GESTOR_BASE'} userBaseName={user.baseName || ''} />;
}
