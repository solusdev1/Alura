import { auth } from '@/backend/auth';
import Sidebar from '@/frontend/components/dashboard/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as { name: string; role: string } | undefined;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 lg:h-screen lg:flex-row">
      <Sidebar userName={user?.name || 'Usuário'} userRole={user?.role || 'GESTOR_BASE'} />
      <div className="min-w-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
