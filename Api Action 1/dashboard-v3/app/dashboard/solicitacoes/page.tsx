import { auth } from '@/backend/auth';
import SolicitacoesView from '@/frontend/components/dashboard/SolicitacoesView';

export default async function SolicitacoesPage() {
  const session = await auth();
  const user = session?.user as { role: string; baseName: string | null } | undefined;

  return (
    <SolicitacoesView
      userRole={user?.role || 'GESTOR_BASE'}
      userBaseName={user?.baseName || ''}
    />
  );
}
