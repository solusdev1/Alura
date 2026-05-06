import { saveDevices, updateSyncStatus, Device } from '../db/devices';
import { authenticateAction1, listAllEndpoints } from './client';

type Endpoint = Record<string, unknown>;

function getCustomValue(custom: { name: string; value: string }[], names: string[]): string {
  return custom.find(a => names.includes(a.name))?.value || '';
}

function normalizeEndpoint(endpoint: Endpoint): Device {
  const hw = (endpoint.hardware_summary || {}) as Record<string, unknown>;
  const inv = (endpoint.inventory || {}) as Record<string, unknown>;
  const custom = (endpoint.custom || []) as { name: string; value: string }[];

  const memory = endpoint.memory_total ?? endpoint.memory_size ?? hw.memory_total ?? hw.memory_size ?? (inv.memory as Record<string, unknown>).total ?? 'N/A';
  const disk = endpoint.storage_total ?? endpoint.storage_total_size ?? hw.storage_total ?? hw.storage_total_size ?? (inv.storage as Record<string, unknown>).total ?? 'N/A';

  let status = String(endpoint.status || 'Desconhecido');
  if (status.toLowerCase() === 'connected') status = 'Online';
  if (status.toLowerCase() === 'disconnected') status = 'Offline';

  const nome = String(endpoint.name || endpoint.device_name || '');
  let tipo = String(endpoint.type || 'Não especificado');
  if (nome.includes('SJPCRONOT')) tipo = 'Notebook';
  else if (endpoint.type === 'Endpoint') tipo = 'Workstation';

  return {
    id: endpoint.id,
    nome: nome || `Dispositivo-${endpoint.id}`,
    dispositivo: String(endpoint.device_name || endpoint.name || 'N/A'),
    ip: endpoint.address || 'N/A',
    mac: endpoint.MAC || 'N/A',
    so: endpoint.OS || endpoint.os || endpoint.operating_system || 'N/A',
    status,
    organizacao: endpoint.organization_name || 'Carraro',
    modelo: endpoint.model || hw.model || 'N/A',
    fabricante: endpoint.manufacturer || hw.manufacturer || 'N/A',
    serial: endpoint.serial || endpoint.serial_number || hw.serial_number || 'N/A',
    memoria: memory,
    disco: disk,
    cpu: endpoint.CPU_name || endpoint.CPU_model || hw.processor || (inv.processor as Record<string, unknown>).name || 'N/A',
    tipo,
    usuario: String(endpoint.user || endpoint.last_logged_in_user || 'N/A').replace(/\\/g, '/'),
    adDisplayName: getCustomValue(custom, ['AD Display Name']),
    city: getCustomValue(custom, ['City']),
    gerenciado: endpoint.managed ? 'Sim' : 'Não',
    last_seen: endpoint.last_seen || 'N/A',
    agent_version: endpoint.agent_version || 'N/A',
    custom
  };
}

function deduplicateDevices(devices: Device[]): { devices: Device[]; duplicatesRemoved: number } {
  const groups = new Map<string, Device[]>();
  for (const device of devices) {
    const key = String(device.dispositivo || device.nome || '').toLowerCase().split('.')[0].trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(device);
  }
  const unique: Device[] = [];
  let duplicatesRemoved = 0;
  for (const group of groups.values()) {
    if (group.length === 1) { unique.push(group[0]); continue; }
    group.sort((a, b) => {
      if (a.status === 'Online' && b.status !== 'Online') return -1;
      if (b.status === 'Online' && a.status !== 'Online') return 1;
      const dateA = a.last_seen && a.last_seen !== 'N/A' ? new Date(String(a.last_seen)) : new Date(0);
      const dateB = b.last_seen && b.last_seen !== 'N/A' ? new Date(String(b.last_seen)) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    unique.push(group[0]);
    duplicatesRemoved += group.length - 1;
  }
  return { devices: unique, duplicatesRemoved };
}

export async function runInventorySync() {
  await updateSyncStatus('syncing', 0);
  try {
    const token = await authenticateAction1();
    const allEndpoints = await listAllEndpoints(token);
    const processed = (allEndpoints as Endpoint[]).map(normalizeEndpoint);
    const { devices: unique, duplicatesRemoved } = deduplicateDevices(processed);
    await saveDevices(unique);
    await updateSyncStatus('completed', unique.length);
    return {
      success: true,
      stats: {
        total: unique.length,
        sourceEndpoints: allEndpoints.length,
        processed: processed.length,
        duplicatesRemoved,
        online: unique.filter(d => d.status === 'Online').length,
        offline: unique.filter(d => d.status === 'Offline').length
      },
      devices: unique
    };
  } catch (error) {
    await updateSyncStatus('error', 0);
    throw error;
  }
}
