import { join } from 'path';
import fs from 'fs';
import { getDb } from './mongodb';

const COLLECTION_DEVICES = 'devices';
const COLLECTION_METADATA = 'metadata';
const SUPPLEMENTAL_PATH = join(process.cwd(), 'backend', 'data', 'supplemental-inventory.json');
const DB_PATH = join(process.cwd(), 'backend', 'data', 'inventory.json');
const METADATA_PATH = join(process.cwd(), 'backend', 'data', 'metadata.json');
const EXTRA_DEVICE_TYPES = new Set(['bipe', 'bip', 'celular', 'coletor', 'roteador', 'switch']);

export type Device = Record<string, unknown>;

let useJSON = false;

function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isNonEmpty(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function generateDeviceId(): string {
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKey(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeHost(value: unknown): string {
  const normalized = normalizeKey(value);
  if (!normalized) return '';
  return normalized.split('.')[0];
}

function ensureJSONFiles() {
  const dataDir = join(process.cwd(), 'backend', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
  if (!fs.existsSync(METADATA_PATH)) {
    fs.writeFileSync(METADATA_PATH, JSON.stringify({ last_sync: null, total_devices: 0, status: 'never_synced' }, null, 2));
  }
}

function readSupplementalDevices(): Device[] {
  if (!fs.existsSync(SUPPLEMENTAL_PATH)) return [];
  try {
    const raw = fs.readFileSync(SUPPLEMENTAL_PATH, 'utf-8').replace(/^ï»¿/, '');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildSupplementalIndexes(supplemental: Device[]) {
  const byId = new Map<string, Device>();
  const byNome = new Map<string, Device>();
  const byHost = new Map<string, Device>();
  supplemental.forEach(item => {
    if (isNonEmpty(item.id)) byId.set(String(item.id), item);
    if (isNonEmpty(item.nome)) byNome.set(normalizeKey(item.nome), item);
    if (isNonEmpty(item.nome)) byHost.set(normalizeHost(item.nome), item);
  });
  return { byId, byNome, byHost };
}

function getSupplementalMatch(device: Device, indexes: ReturnType<typeof buildSupplementalIndexes>): Device | undefined {
  return indexes.byId.get(String(device.id || ''))
    ?? indexes.byNome.get(normalizeKey(device.nome))
    ?? indexes.byHost.get(normalizeHost(device.nome));
}

function applySupplementalFields(apiDevice: Device, existingDevice: Device | undefined, supplementalDevice: Device | undefined): Device {
  const merged = { ...apiDevice };
  const fields = [
    'cloud', 'setor', 'dataAlteracao',
    'responsavelAtualId', 'responsavelAtualNome', 'responsavelAtualDocumento',
    'responsavelAtualCargo', 'termoAtualId', 'termoAtualVersion'
  ];
  fields.forEach(field => {
    if (isNonEmpty(existingDevice?.[field])) { merged[field] = existingDevice![field]; return; }
    if (isNonEmpty(supplementalDevice?.[field])) merged[field] = supplementalDevice![field];
  });
  if (isNonEmpty(existingDevice?.adDisplayName)) merged.adDisplayName = existingDevice!.adDisplayName;
  if (isNonEmpty(existingDevice?.city)) merged.city = existingDevice!.city;
  return merged;
}

function supplementalToDevice(item: Device, index = 0): Device {
  const tipo = item.tipo === 'Bipe' ? 'Bip' : (item.tipo || 'Desconhecido');
  const nome = item.nome || item.responsavel || `${tipo}-${index}`;
  const responsavel = item.responsavel || 'N/A';
  return {
    id: item.id || `manual-${normalizeKey(tipo)}-${index}`,
    nome, dispositivo: nome,
    ip: item.ip || 'N/A', mac: item.mac || 'N/A', so: item.so || 'N/A',
    usuario: String(responsavel).replace(/\//g, '\\'),
    adDisplayName: item.responsavel || '',
    status: item.status || 'Em Uso',
    organizacao: item.organizacao || 'Carraro',
    tipo: item.tipo === 'Bipe' ? 'Bip' : (item.tipo || 'Não especificado'),
    modelo: item.modelo || 'N/A', fabricante: item.fabricante || 'N/A',
    serial: item.serial || 'N/A', memoria: item.memoria || 'N/A',
    disco: item.disco || 'N/A', cpu: item.cpu || 'N/A',
    gerenciado: item.gerenciado || 'Não', last_seen: item.last_seen || 'N/A',
    agent_version: item.agent_version || 'N/A',
    cloud: item.cloud || '', setor: item.setor || '',
    dataAlteracao: item.dataAlteracao || '', email: item.email || '',
    vulnerabilities: { critical: 0, other: 0 },
    missing_updates: { critical: 0, other: 0 }
  };
}

function mergeDevicesWithSupplemental(apiDevices: Device[], existingDevices: Device[]): Device[] {
  const supplemental = readSupplementalDevices();
  const indexes = buildSupplementalIndexes(supplemental);
  const existingById = new Map(existingDevices.map(d => [String(d.id), d]));

  const mergedApi = apiDevices.map(device => {
    const existing = existingById.get(String(device.id));
    const supplementalMatch = getSupplementalMatch(device, indexes);
    return applySupplementalFields(device, existing, supplementalMatch);
  });

  const existingIds = new Set(mergedApi.map(d => String(d.id)));
  const existingNames = new Set(mergedApi.map(d => normalizeKey(d.nome)));

  const extras: Device[] = [];
  let extraIdx = 0;
  for (const item of supplemental) {
    if (!EXTRA_DEVICE_TYPES.has(normalizeKey(item.tipo))) continue;
    const device = supplementalToDevice(item, extraIdx++);
    if (!existingIds.has(String(device.id)) && !existingNames.has(normalizeKey(device.nome))) {
      extras.push(device);
    }
  }
  return [...mergedApi, ...extras];
}

function removeFromSupplemental(ids: string[]) {
  if (!ids.length) return;
  const idsSet = new Set(ids.map(x => String(x)));
  const supplemental = readSupplementalDevices();
  if (!supplemental.length) return;
  const filtered = supplemental.filter(item => !idsSet.has(String(item.id)));
  if (filtered.length !== supplemental.length) {
    fs.writeFileSync(SUPPLEMENTAL_PATH, JSON.stringify(filtered, null, 2));
  }
}

async function tryGetDb() {
  try {
    const db = await getDb();
    useJSON = false;
    return db;
  } catch {
    if (!useJSON) {
      console.warn('[AVISO] MongoDB não disponível, usando JSON como fallback');
      useJSON = true;
      ensureJSONFiles();
    }
    return null;
  }
}

export async function saveDevices(devices: Device[]) {
  const db = await tryGetDb();
  if (!db) {
    let existing: Device[] = [];
    try { existing = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); } catch { existing = []; }
    const merged = mergeDevicesWithSupplemental(devices, existing);
    fs.writeFileSync(DB_PATH, JSON.stringify(merged, null, 2));
    fs.writeFileSync(METADATA_PATH, JSON.stringify({ last_sync: new Date().toISOString(), total_devices: merged.length, status: 'success' }, null, 2));
    return;
  }
  const collection = db.collection(COLLECTION_DEVICES);
  const existingDevices = await collection.find({}).toArray() as Device[];
  const merged = mergeDevicesWithSupplemental(devices, existingDevices);
  await collection.deleteMany({});
  if (merged.length > 0) await collection.insertMany(merged);
  await db.collection(COLLECTION_METADATA).updateOne(
    { _id: 'sync_info' as unknown as never },
    { $set: { last_sync: new Date().toISOString(), total_devices: merged.length, status: 'success' } },
    { upsert: true }
  );
}

export async function getAllDevices(): Promise<Device[]> {
  const db = await tryGetDb();
  if (!db) {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); } catch { return []; }
  }
  return toPlainObject(await db.collection(COLLECTION_DEVICES).find({}).toArray() as Device[]);
}

export async function getDevicesByIds(ids: string[]): Promise<Device[]> {
  if (!ids.length) return [];
  const normalizedIds = new Set(ids.map(id => String(id)));
  const devices = await getAllDevices();
  return devices.filter(d => normalizedIds.has(String(d.id)));
}

export async function getDevicesByStatus(status: string): Promise<Device[]> {
  const devices = await getAllDevices();
  return devices.filter(d => String(d.status || '').toLowerCase() === String(status || '').toLowerCase());
}

export async function getSyncMetadata() {
  const db = await tryGetDb();
  if (!db) {
    try { return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8')); } catch { return { last_sync: null, total_devices: 0, status: 'never_synced' }; }
  }
  return toPlainObject((await db.collection(COLLECTION_METADATA).findOne({ _id: 'sync_info' as unknown as never })) ?? { last_sync: null, total_devices: 0, status: 'never_synced' });
}

export async function clearInventory() {
  const db = await tryGetDb();
  if (!db) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    fs.writeFileSync(METADATA_PATH, JSON.stringify({ last_sync: new Date().toISOString(), total_devices: 0, status: 'cleared' }, null, 2));
    return;
  }
  await db.collection(COLLECTION_DEVICES).deleteMany({});
  await db.collection(COLLECTION_METADATA).updateOne(
    { _id: 'sync_info' as unknown as never },
    { $set: { last_sync: new Date().toISOString(), total_devices: 0, status: 'cleared' } },
    { upsert: true }
  );
}

export async function deleteDevicesByIds(ids: string[]) {
  if (!ids.length) return { deletedCount: 0 };
  const db = await tryGetDb();
  if (!db) {
    const data: Device[] = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const idsSet = new Set(ids);
    const remaining = data.filter(d => !idsSet.has(String(d.id)));
    fs.writeFileSync(DB_PATH, JSON.stringify(remaining, null, 2));
    removeFromSupplemental(ids);
    return { deletedCount: data.length - remaining.length };
  }
  const result = await db.collection(COLLECTION_DEVICES).deleteMany({ id: { $in: ids } });
  removeFromSupplemental(ids);
  return { deletedCount: result.deletedCount || 0 };
}

const ALLOWED_UPDATE_FIELDS = new Set([
  'nome', 'tipo', 'usuario', 'adDisplayName', 'email', 'cloud', 'baseNome', 'setor',
  'city', 'status', 'dataAlteracao', 'descricao', 'memoria', 'disco', 'so',
  'organizacao', 'serial', 'ip', 'mac', 'fabricante', 'modelo', 'cpu',
  'hostname', 'perifericos', 'duasTelas', 'responsavelAtualId',
  'responsavelAtualNome', 'responsavelAtualDocumento', 'responsavelAtualCargo',
  'termoAtualId', 'termoAtualVersion', 'adDisplayName', 'lastPublicIP',
  'patrimonioCodigo', 'imei', 'linhaChip', 'operadora', 'observacoesIniciais',
  'responsavelFinal', 'marca', 'manutencaoOrigemBase', 'manutencaoOrigemSetor',
  'manutencaoOrigemMovimentacaoId', 'diagnosticoManutencao', 'resultadoManutencao'
]);

export async function updateDeviceById(id: string, updates: Record<string, unknown>) {
  if (!isNonEmpty(id)) return { matchedCount: 0, modifiedCount: 0 };
  const sanitized: Record<string, unknown> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (!ALLOWED_UPDATE_FIELDS.has(key)) return;
    sanitized[key] = typeof value === 'string' ? value.trim() : value;
  });
  sanitized.updatedAt = new Date().toISOString();

  const db = await tryGetDb();
  if (!db) {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const devices: Device[] = JSON.parse(raw);
    const idx = devices.findIndex(d => String(d.id) === String(id));
    if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };
    devices[idx] = { ...devices[idx], ...sanitized };
    fs.writeFileSync(DB_PATH, JSON.stringify(devices, null, 2));
    return { matchedCount: 1, modifiedCount: 1, device: devices[idx] };
  }
  const collection = db.collection(COLLECTION_DEVICES);
  const result = await collection.updateOne({ id: String(id) }, { $set: sanitized });
  if (!result.matchedCount) return { matchedCount: 0, modifiedCount: 0 };
  const device = await collection.findOne({ id: String(id) });
  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, device };
}

export async function createDevice(payload: Record<string, unknown>): Promise<Device> {
  const sanitized: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (!ALLOWED_UPDATE_FIELDS.has(key) && key !== 'id') return;
    sanitized[key] = typeof value === 'string' ? value.trim() : value;
  });
  if (!isNonEmpty(sanitized.tipo)) throw new Error('Campo obrigatório: tipo');

  const tipo = String(sanitized.tipo || '').trim() === 'Bipe' ? 'Bip' : String(sanitized.tipo || '');
  sanitized.tipo = tipo;
  const isCelular = tipo === 'Celular';
  const isPortable = ['Celular', 'Bip', 'Coletor', 'Switch'].includes(tipo);

  if (isPortable && !isNonEmpty(sanitized.marca)) throw new Error('Campo obrigatorio: marca');
  if (isPortable && !isNonEmpty(sanitized.modelo)) throw new Error('Campo obrigatorio: modelo');
  if (isPortable && !isNonEmpty(sanitized.serial)) throw new Error('Campo obrigatorio: serial');
  if (isCelular && !isNonEmpty(sanitized.imei)) throw new Error('Campo obrigatorio: imei');
  if (!isNonEmpty(sanitized.baseNome)) throw new Error('Campo obrigatorio: baseNome');
  if (!isNonEmpty(sanitized.setor)) throw new Error('Campo obrigatorio: setor');
  if (!isNonEmpty(sanitized.nome)) {
    sanitized.nome =
      String(sanitized.patrimonioCodigo || '').trim() ||
      [tipo, sanitized.marca, sanitized.modelo].filter(isNonEmpty).join(' - ') ||
      `${tipo}-${Date.now()}`;
  }

  const device: Device = {
    id: isNonEmpty(sanitized.id) ? String(sanitized.id) : generateDeviceId(),
    nome: sanitized.nome, dispositivo: sanitized.nome, tipo: sanitized.tipo,
    usuario: sanitized.usuario || sanitized.responsavelFinal || sanitized.adDisplayName || 'N/A',
    adDisplayName: sanitized.adDisplayName || sanitized.responsavelFinal || sanitized.usuario || '',
    email: sanitized.email || '', cloud: sanitized.cloud || '',
    baseNome: sanitized.baseNome || sanitized.setor || '',
    setor: sanitized.setor || '', city: sanitized.city || '',
    status: sanitized.status || 'Em Uso',
    responsavelAtualId: '', responsavelAtualNome: '',
    responsavelAtualDocumento: '', responsavelAtualCargo: '',
    termoAtualId: '', termoAtualVersion: null,
    dataAlteracao: sanitized.dataAlteracao || '',
    descricao: sanitized.descricao || 'N/A', memoria: sanitized.memoria || 'N/A',
    disco: sanitized.disco || 'N/A', so: sanitized.so || 'N/A',
    organizacao: sanitized.organizacao || 'Carraro', serial: sanitized.serial || 'N/A',
    hostname: sanitized.hostname || sanitized.nome, ip: sanitized.ip || 'N/A',
    mac: sanitized.mac || 'N/A', fabricante: sanitized.fabricante || sanitized.marca || 'N/A',
    modelo: sanitized.modelo || 'N/A', cpu: sanitized.cpu || 'N/A',
    patrimonioCodigo: sanitized.patrimonioCodigo || '',
    imei: sanitized.imei || '',
    linhaChip: sanitized.linhaChip || '',
    operadora: sanitized.operadora || '',
    observacoesIniciais: sanitized.observacoesIniciais || '',
    responsavelFinal: sanitized.responsavelFinal || '',
    marca: sanitized.marca || sanitized.fabricante || '',
    gerenciado: 'Não', last_seen: 'N/A', agent_version: 'N/A',
    vulnerabilities: { critical: 0, other: 0 }, missing_updates: { critical: 0, other: 0 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };

  const db = await tryGetDb();
  if (!db) {
    const devices: Device[] = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    if (devices.some(d => String(d.id) === String(device.id))) throw new Error('ID já existe no inventário');
    devices.push(device);
    fs.writeFileSync(DB_PATH, JSON.stringify(devices, null, 2));
    return device;
  }
  const collection = db.collection(COLLECTION_DEVICES);
  const exists = await collection.findOne({ id: String(device.id) });
  if (exists) throw new Error('ID já existe no inventário');
  await collection.insertOne(device);
  return device;
}

export async function updateDevicesCurrentAssignment(ids: string[], assignment: Record<string, unknown>) {
  if (!ids.length) return { matchedCount: 0, modifiedCount: 0 };
  const normalizedIds = ids.map(id => String(id));
  const payload = {
    responsavelAtualId: assignment.responsavelAtualId || '',
    responsavelAtualNome: assignment.responsavelAtualNome || '',
    responsavelAtualDocumento: assignment.responsavelAtualDocumento || '',
    responsavelAtualCargo: assignment.responsavelAtualCargo || '',
    termoAtualId: assignment.termoAtualId || '',
    termoAtualVersion: assignment.termoAtualVersion ?? null,
    updatedAt: new Date().toISOString()
  };

  const db = await tryGetDb();
  if (!db) {
    const devices: Device[] = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    let modifiedCount = 0;
    const next = devices.map(d => {
      if (!normalizedIds.includes(String(d.id))) return d;
      modifiedCount++;
      return { ...d, ...payload };
    });
    fs.writeFileSync(DB_PATH, JSON.stringify(next, null, 2));
    return { matchedCount: modifiedCount, modifiedCount };
  }
  const result = await db.collection(COLLECTION_DEVICES).updateMany(
    { id: { $in: normalizedIds } },
    { $set: payload }
  );
  return { matchedCount: result.matchedCount || 0, modifiedCount: result.modifiedCount || 0 };
}

export async function updateSyncStatus(status: string, totalDevices = 0) {
  const db = await tryGetDb();
  const update: Record<string, unknown> = { status, total_devices: totalDevices };
  if (status !== 'syncing') update.last_sync = new Date().toISOString();

  if (!db) {
    try {
      const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      Object.assign(metadata, update);
      fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
    } catch { /* silent */ }
    return;
  }
  await db.collection(COLLECTION_METADATA).updateOne(
    { _id: 'sync_info' as unknown as never },
    { $set: update },
    { upsert: true }
  );
}

export async function acquireSyncLock(options: { owner?: string; ttlMs?: number } = {}): Promise<string | null> {
  const owner = String(options.owner || 'unknown');
  const ttlMs = Number(options.ttlMs || 5 * 60 * 1000);
  const now = Date.now();
  const expiresAt = now + ttlMs;
  const token = `sync-${now}-${Math.random().toString(36).slice(2, 8)}`;

  const db = await tryGetDb();
  if (!db) {
    try {
      const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      if (metadata.sync_lock_token && Number(metadata.sync_lock_expires_at || 0) > now) return null;
      metadata.sync_lock_token = token;
      metadata.sync_lock_owner = owner;
      metadata.sync_lock_expires_at = expiresAt;
      fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
      return token;
    } catch { return null; }
  }

  const collection = db.collection(COLLECTION_METADATA);
  const updateResult = await collection.updateOne(
    { _id: 'sync_lock' as unknown as never, $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $lte: new Date(now) } }, { token: null }] },
    { $set: { token, owner, acquiredAt: new Date(now), expiresAt: new Date(expiresAt) } }
  );
  if (updateResult.matchedCount === 1) return token;
  try {
    await collection.insertOne({ _id: 'sync_lock' as unknown as never, token, owner, acquiredAt: new Date(now), expiresAt: new Date(expiresAt) });
    return token;
  } catch (e: unknown) {
    if ((e as { code: number }).code === 11000) return null;
    throw e;
  }
}

export async function releaseSyncLock(token: string) {
  if (!token) return;
  const db = await tryGetDb();
  if (!db) {
    try {
      const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      if (metadata.sync_lock_token !== token) return;
      metadata.sync_lock_token = '';
      metadata.sync_lock_expires_at = 0;
      fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
    } catch { /* silent */ }
    return;
  }
  await db.collection(COLLECTION_METADATA).updateOne(
    { _id: 'sync_lock' as unknown as never, token },
    { $set: { token: null, owner: null, expiresAt: new Date(0) } }
  );
}

export async function getStats() {
  const devices = await getAllDevices();
  return {
    total: devices.length,
    online: devices.filter(d => d.status === 'Online').length,
    offline: devices.filter(d => d.status === 'Offline').length,
    gerenciados: devices.filter(d => d.gerenciado === 'Sim').length
  };
}
