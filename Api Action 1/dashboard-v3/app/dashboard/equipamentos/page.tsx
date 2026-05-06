import { auth } from '@/backend/auth';
import { getAllDevices, getSyncMetadata } from '@/backend/db/devices';
import Dashboard from '@/frontend/components/dashboard/Dashboard';

function getDeviceBase(device: Record<string, unknown>) {
  return String(device.baseNome || device.setor || '');
}

export default async function EquipamentosPage() {
  const session = await auth();
  const user = session?.user as { name: string; role: string; baseName: string | null };

  const [allDevices, metadata] = await Promise.all([getAllDevices(), getSyncMetadata()]);
  const isScoped = user.role === 'GESTOR_BASE' && user.baseName;
  const isMaintenance = user.role === 'MANUTENCAO';

  const devices = isMaintenance
    ? (allDevices as Record<string, unknown>[]).filter(device => String(device.baseNome || '') === 'MANUTENCAO' || String(device.status || '').toUpperCase() === 'MANUTENCAO')
    : isScoped
      ? (allDevices as Record<string, unknown>[]).filter(device => getDeviceBase(device) === user.baseName)
    : (allDevices as Record<string, unknown>[]);

  return (
    <Dashboard
      initialDevices={devices}
      metadata={metadata as Record<string, unknown>}
      userName={user.name || 'Usuário'}
      userRole={user.role || 'GESTOR_BASE'}
      userBaseName={user.baseName || ''}
    />
  );
}
