import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../../.env') });

// Configuração do MongoDB (Nuvem ou Local)
// Prioridade: 1. Variável de ambiente, 2. MongoDB local
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DATABASE || 'action1_inventory';
const COLLECTION_DEVICES = 'devices';
const COLLECTION_METADATA = 'metadata';
const SUPPLEMENTAL_PATH = join(__dirname, '../data/supplemental-inventory.json');
const EXTRA_DEVICE_TYPES = new Set(['bipe', 'celular', 'coletor', 'roteador', 'switch']);

// Detectar se é MongoDB Atlas (nuvem)
const isCloudDB = MONGO_URI.includes('mongodb+srv') || MONGO_URI.includes('mongodb.net');

// Fallback para JSON
const DB_PATH = join(__dirname, '../../data/inventory.json');
const METADATA_PATH = join(__dirname, '../../data/metadata.json');

let client = null;
let db = null;
let useJSON = false; // Flag para usar JSON como fallback

function isNonEmpty(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
}

function generateDeviceId() {
    return `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKey(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeHost(value) {
    const normalized = normalizeKey(value);
    if (!normalized) return '';
    return normalized.split('.')[0];
}

function readSupplementalDevices() {
    if (!fs.existsSync(SUPPLEMENTAL_PATH)) return [];
    try {
        const raw = fs.readFileSync(SUPPLEMENTAL_PATH, 'utf-8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn(`⚠️ Erro ao ler suplemento de inventário: ${error.message}`);
        return [];
    }
}

function buildSupplementalIndexes(supplemental) {
    const byId = new Map();
    const byNome = new Map();
    const byHost = new Map();

    supplemental.forEach(item => {
        if (isNonEmpty(item.id)) byId.set(String(item.id), item);
        if (isNonEmpty(item.nome)) byNome.set(normalizeKey(item.nome), item);
        if (isNonEmpty(item.nome)) byHost.set(normalizeHost(item.nome), item);
    });

    return { byId, byNome, byHost };
}

function getSupplementalMatch(device, indexes) {
    const byId = indexes.byId.get(String(device.id || ''));
    if (byId) return byId;
    const byNome = indexes.byNome.get(normalizeKey(device.nome));
    if (byNome) return byNome;
    return indexes.byHost.get(normalizeHost(device.nome));
}

function applySupplementalFields(apiDevice, existingDevice, supplementalDevice) {
    const merged = { ...apiDevice };
    const fields = ['cloud', 'setor', 'dataAlteracao'];

    fields.forEach(field => {
        if (isNonEmpty(existingDevice?.[field])) {
            merged[field] = existingDevice[field];
            return;
        }
        if (isNonEmpty(supplementalDevice?.[field])) {
            merged[field] = supplementalDevice[field];
        }
    });

    // Campos já gerenciados manualmente no dashboard também devem prevalecer.
    if (isNonEmpty(existingDevice?.adDisplayName)) merged.adDisplayName = existingDevice.adDisplayName;
    if (isNonEmpty(existingDevice?.city)) merged.city = existingDevice.city;

    return merged;
}

function supplementalToDevice(item) {
    const nome = item.nome || `Dispositivo-${item.id || Math.random().toString(36).slice(2)}`;
    const responsavel = item.responsavel || 'N/A';

    return {
        id: item.id || `manual-${normalizeKey(nome)}`,
        nome,
        dispositivo: nome,
        ip: item.ip || 'N/A',
        mac: item.mac || 'N/A',
        so: item.so || 'N/A',
        usuario: responsavel.replace(/\//g, '\\'),
        adDisplayName: item.responsavel || '',
        status: item.status || 'Em Uso',
        organizacao: item.organizacao || 'Carraro',
        tipo: item.tipo || 'Não especificado',
        modelo: item.modelo || 'N/A',
        fabricante: item.fabricante || 'N/A',
        serial: item.serial || 'N/A',
        memoria: item.memoria || 'N/A',
        disco: item.disco || 'N/A',
        cpu: item.cpu || 'N/A',
        gerenciado: item.gerenciado || 'Não',
        last_seen: item.last_seen || 'N/A',
        agent_version: item.agent_version || 'N/A',
        cloud: item.cloud || '',
        setor: item.setor || '',
        dataAlteracao: item.dataAlteracao || '',
        email: item.email || '',
        vulnerabilities: { critical: 0, other: 0 },
        missing_updates: { critical: 0, other: 0 }
    };
}

function mergeDevicesWithSupplemental(apiDevices, existingDevices) {
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

    const extras = supplemental
        .filter(item => EXTRA_DEVICE_TYPES.has(normalizeKey(item.tipo)))
        .filter(item => !existingIds.has(String(item.id || '')))
        .filter(item => !existingNames.has(normalizeKey(item.nome)))
        .map(supplementalToDevice);

    if (extras.length > 0) {
        console.log(`   ✅ ${extras.length} dispositivos extras adicionados do suplemento`);
    }

    return [...mergedApi, ...extras];
}

function removeFromSupplemental(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const idsSet = new Set(ids.map(x => String(x)));
    const supplemental = readSupplementalDevices();
    if (!supplemental.length) return;

    const filtered = supplemental.filter(item => !idsSet.has(String(item.id)));
    if (filtered.length !== supplemental.length) {
        fs.writeFileSync(SUPPLEMENTAL_PATH, JSON.stringify(filtered, null, 2));
    }
}

/**
 * Conectar ao MongoDB
 */
async function connectDB() {
    if (db) return db;
    
    try {
        // Configurações diferentes para MongoDB Atlas vs Local
        const clientOptions = isCloudDB 
            ? { 
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            }
            : { 
                serverSelectionTimeoutMS: 5000 
            };

        client = new MongoClient(MONGO_URI, clientOptions);
        await client.connect();
        
        // Testar conexão
        await client.db('admin').command({ ping: 1 });
        
        db = client.db(DB_NAME);
        
        // Criar índices para melhor performance
        await db.collection(COLLECTION_DEVICES).createIndex({ id: 1 }, { unique: true });
        await db.collection(COLLECTION_DEVICES).createIndex({ status: 1 });
        await db.collection(COLLECTION_DEVICES).createIndex({ organizacao: 1 });
        
        useJSON = false;
        
        const dbType = isCloudDB ? 'MongoDB Atlas (Nuvem)' : 'MongoDB Local';
        console.log(`✅ Conectado ao ${dbType}`);
        console.log(`📊 Database: ${DB_NAME}`);
        
        return db;
    } catch (error) {
        const errorMsg = isCloudDB 
            ? '⚠️  MongoDB Atlas não disponível, usando JSON como fallback'
            : '⚠️  MongoDB local não disponível, usando JSON como fallback';
        
        console.warn(errorMsg);
        console.warn(`   Erro: ${error.message}`);
        useJSON = true;
        ensureJSONFiles();
        return null;
    }
}

/**
 * Garantir que arquivos JSON existem
 */
function ensureJSONFiles() {
    const dataDir = join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(METADATA_PATH)) {
        fs.writeFileSync(METADATA_PATH, JSON.stringify({
            last_sync: null,
            total_devices: 0,
            status: 'never_synced'
        }, null, 2));
    }
}

/**
 * Obter instância do banco de dados
 */
async function getDB() {
    if (useJSON) {
        return null; // Retornar null quando está usando JSON
    }
    if (!db) {
        await connectDB();
    }
    return db;
}

/**
 * Salvar múltiplos dispositivos no banco de dados
 */
export async function saveDevices(devices) {
    if (useJSON) {
        let existing = [];
        try {
            existing = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
            if (!Array.isArray(existing)) existing = [];
        } catch (_) {
            existing = [];
        }

        const mergedDevices = mergeDevicesWithSupplemental(devices, existing);

        fs.writeFileSync(DB_PATH, JSON.stringify(mergedDevices, null, 2));
        fs.writeFileSync(METADATA_PATH, JSON.stringify({
            last_sync: new Date().toISOString(),
            total_devices: mergedDevices.length,
            status: 'success'
        }, null, 2));
        console.log(`✅ ${mergedDevices.length} dispositivos salvos no JSON`);
        return;
    }
    
    try {
        const database = await getDB();
        const collection = database.collection(COLLECTION_DEVICES);
        
        const existingDevices = await collection.find({}).toArray();
        const mergedDevices = mergeDevicesWithSupplemental(devices, existingDevices);
        
        // Limpar coleção antes de inserir novos dados
        await collection.deleteMany({});
        
        // Inserir novos dispositivos
        if (mergedDevices.length > 0) {
            await collection.insertMany(mergedDevices);
        }
        
        // Atualizar metadados
        await database.collection(COLLECTION_METADATA).updateOne(
            { _id: 'sync_info' },
            {
                $set: {
                    last_sync: new Date().toISOString(),
                    total_devices: mergedDevices.length,
                    status: 'success'
                }
            },
            { upsert: true }
        );
        
        console.log(`✅ ${mergedDevices.length} dispositivos salvos no MongoDB`);
    } catch (error) {
        console.error('❌ Erro ao salvar dispositivos:', error.message);
        throw error;
    }
}

/**
 * Obter todos os dispositivos
 */
export async function getAllDevices() {
    if (useJSON) {
        try {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            const parsed = JSON.parse(data);
            const merged = mergeDevicesWithSupplemental(parsed, parsed);
            if (merged.length !== parsed.length) {
                fs.writeFileSync(DB_PATH, JSON.stringify(merged, null, 2));
            }
            return merged;
        } catch (error) {
            return [];
        }
    }
    
    try {
        const database = await getDB();
        const devices = await database.collection(COLLECTION_DEVICES)
            .find({})
            .toArray();
        const merged = mergeDevicesWithSupplemental(devices, devices);

        if (merged.length !== devices.length) {
            const existingIds = new Set(devices.map(d => String(d.id)));
            const missing = merged.filter(d => !existingIds.has(String(d.id)));
            if (missing.length > 0) {
                try {
                    await database.collection(COLLECTION_DEVICES).insertMany(missing, { ordered: false });
                } catch (error) {
                    // Ignorar duplicados eventuais em leitura concorrente.
                    if (error.code !== 11000) {
                        throw error;
                    }
                }
            }
        }

        return merged;
    } catch (error) {
        console.error('❌ Erro ao obter dispositivos:', error.message);
        return [];
    }
}

/**
 * Obter dispositivos por status
 */
export async function getDevicesByStatus(status) {
    try {
        const devices = await getAllDevices();
        return devices.filter(d => String(d.status || '').toLowerCase() === String(status || '').toLowerCase());
    } catch (error) {
        console.error('❌ Erro ao filtrar dispositivos por status:', error.message);
        return [];
    }
}

/**
 * Obter metadados da última sincronização
 */
export async function getSyncMetadata() {
    if (useJSON) {
        try {
            const data = fs.readFileSync(METADATA_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return {
                last_sync: null,
                total_devices: 0,
                status: 'never_synced'
            };
        }
    }
    
    try {
        const database = await getDB();
        const metadata = await database.collection(COLLECTION_METADATA)
            .findOne({ _id: 'sync_info' });
        
        return metadata || {
            last_sync: null,
            total_devices: 0,
            status: 'never_synced'
        };
    } catch (error) {
        console.error('❌ Erro ao obter metadados:', error.message);
        return {
            last_sync: null,
            total_devices: 0,
            status: 'error'
        };
    }
}

/**
 * Limpar todo o inventário
 */
export async function clearInventory() {
    if (useJSON) {
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
        fs.writeFileSync(METADATA_PATH, JSON.stringify({
            last_sync: new Date().toISOString(),
            total_devices: 0,
            status: 'cleared'
        }, null, 2));
        console.log('✅ Inventário limpo do JSON');
        return;
    }
    
    try {
        const database = await getDB();
        await database.collection(COLLECTION_DEVICES).deleteMany({});
        
        await database.collection(COLLECTION_METADATA).updateOne(
            { _id: 'sync_info' },
            {
                $set: {
                    last_sync: new Date().toISOString(),
                    total_devices: 0,
                    status: 'cleared'
                }
            },
            { upsert: true }
        );
        
        console.log('✅ Inventário limpo do MongoDB');
    } catch (error) {
        console.error('❌ Erro ao limpar inventário:', error.message);
        throw error;
    }
}

/**
 * Remover dispositivos por IDs
 */
export async function deleteDevicesByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return { deletedCount: 0 };
    }

    if (useJSON) {
        try {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            const devices = JSON.parse(data);
            const beforeCount = devices.length;
            const idsSet = new Set(ids);
            const remaining = devices.filter(d => !idsSet.has(d.id));
            fs.writeFileSync(DB_PATH, JSON.stringify(remaining, null, 2));
            removeFromSupplemental(ids);

            const metadata = {
                last_sync: new Date().toISOString(),
                total_devices: remaining.length,
                status: 'manual_delete'
            };
            fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));

            return { deletedCount: beforeCount - remaining.length };
        } catch (error) {
            console.error('❌ Erro ao remover dispositivos (JSON):', error.message);
            return { deletedCount: 0 };
        }
    }
    
    try {
        const database = await getDB();
        const collection = database.collection(COLLECTION_DEVICES);

        const result = await collection.deleteMany({ id: { $in: ids } });
        removeFromSupplemental(ids);

        await database.collection(COLLECTION_METADATA).updateOne(
            { _id: 'sync_info' },
            {
                $set: {
                    last_sync: new Date().toISOString(),
                    total_devices: await collection.countDocuments(),
                    status: 'manual_delete'
                }
            },
            { upsert: true }
        );

        return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
        console.error('❌ Erro ao remover dispositivos:', error.message);
        return { deletedCount: 0 };
    }
}

/**
 * Atualizar um dispositivo por ID
 */
export async function updateDeviceById(id, updates) {
    if (!isNonEmpty(id) || !updates || typeof updates !== 'object') {
        return { matchedCount: 0, modifiedCount: 0 };
    }

    const allowedFields = new Set([
        'nome', 'tipo', 'usuario', 'adDisplayName', 'email', 'cloud', 'setor',
        'city', 'status', 'dataAlteracao', 'descricao', 'memoria', 'disco', 'so',
        'organizacao', 'serial', 'ip', 'mac', 'fabricante', 'modelo', 'cpu',
        'hostname', 'perifericos', 'duasTelas'
    ]);

    const sanitized = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (!allowedFields.has(key)) return;
        sanitized[key] = typeof value === 'string' ? value.trim() : value;
    });

    sanitized.updatedAt = new Date().toISOString();

    if (useJSON) {
        try {
            const raw = fs.readFileSync(DB_PATH, 'utf-8');
            const devices = JSON.parse(raw);
            const idx = devices.findIndex(d => String(d.id) === String(id));
            if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };
            devices[idx] = { ...devices[idx], ...sanitized };
            fs.writeFileSync(DB_PATH, JSON.stringify(devices, null, 2));
            return { matchedCount: 1, modifiedCount: 1, device: devices[idx] };
        } catch (error) {
            console.error('❌ Erro ao atualizar dispositivo (JSON):', error.message);
            return { matchedCount: 0, modifiedCount: 0 };
        }
    }

    try {
        const database = await getDB();
        const collection = database.collection(COLLECTION_DEVICES);
        const result = await collection.updateOne(
            { id: String(id) },
            { $set: sanitized }
        );

        if (!result.matchedCount) {
            return { matchedCount: 0, modifiedCount: 0 };
        }

        const device = await collection.findOne({ id: String(id) });
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            device
        };
    } catch (error) {
        console.error('❌ Erro ao atualizar dispositivo:', error.message);
        return { matchedCount: 0, modifiedCount: 0 };
    }
}

/**
 * Criar um novo dispositivo manualmente
 */
export async function createDevice(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Payload inválido');
    }

    const allowedFields = new Set([
        'id', 'nome', 'tipo', 'usuario', 'adDisplayName', 'email', 'cloud', 'setor',
        'city', 'status', 'dataAlteracao', 'descricao', 'memoria', 'disco', 'so',
        'organizacao', 'serial', 'ip', 'mac', 'fabricante', 'modelo', 'cpu',
        'hostname', 'perifericos', 'duasTelas'
    ]);

    const sanitized = {};
    Object.entries(payload).forEach(([key, value]) => {
        if (!allowedFields.has(key)) return;
        sanitized[key] = typeof value === 'string' ? value.trim() : value;
    });

    if (!isNonEmpty(sanitized.nome)) throw new Error('Campo obrigatório: nome');
    if (!isNonEmpty(sanitized.tipo)) throw new Error('Campo obrigatório: tipo');

    const device = {
        id: isNonEmpty(sanitized.id) ? String(sanitized.id) : generateDeviceId(),
        nome: sanitized.nome,
        dispositivo: sanitized.nome,
        tipo: sanitized.tipo,
        usuario: sanitized.usuario || sanitized.adDisplayName || 'N/A',
        adDisplayName: sanitized.adDisplayName || sanitized.usuario || '',
        email: sanitized.email || '',
        cloud: sanitized.cloud || '',
        setor: sanitized.setor || '',
        city: sanitized.city || '',
        status: sanitized.status || 'Em Uso',
        dataAlteracao: sanitized.dataAlteracao || '',
        descricao: sanitized.descricao || 'N/A',
        memoria: sanitized.memoria || 'N/A',
        disco: sanitized.disco || 'N/A',
        so: sanitized.so || 'N/A',
        organizacao: sanitized.organizacao || 'Carraro',
        serial: sanitized.serial || 'N/A',
        hostname: sanitized.hostname || sanitized.nome,
        perifericos: sanitized.perifericos || '',
        duasTelas: sanitized.duasTelas || 'Não',
        ip: sanitized.ip || 'N/A',
        mac: sanitized.mac || 'N/A',
        fabricante: sanitized.fabricante || 'N/A',
        modelo: sanitized.modelo || 'N/A',
        cpu: sanitized.cpu || 'N/A',
        gerenciado: 'Não',
        last_seen: 'N/A',
        agent_version: 'N/A',
        vulnerabilities: { critical: 0, other: 0 },
        missing_updates: { critical: 0, other: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (useJSON) {
        const devices = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        if (devices.some(d => String(d.id) === String(device.id))) {
            throw new Error('ID já existe no inventário');
        }
        devices.push(device);
        fs.writeFileSync(DB_PATH, JSON.stringify(devices, null, 2));
        return device;
    }

    const database = await getDB();
    const collection = database.collection(COLLECTION_DEVICES);
    const exists = await collection.findOne({ id: String(device.id) });
    if (exists) throw new Error('ID já existe no inventário');

    await collection.insertOne(device);
    return device;
}

/**
 * Obter estatísticas do inventário
 */
export async function getStats() {
    try {
        const devices = await getAllDevices();
        return {
            total: devices.length,
            online: devices.filter(d => d.status === 'Online').length,
            offline: devices.filter(d => d.status === 'Offline').length,
            gerenciados: devices.filter(d => d.gerenciado === 'Sim').length
        };
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error.message);
        return {
            total: 0,
            online: 0,
            offline: 0,
            gerenciados: 0
        };
    }
}

/**
 * Atualizar status da sincronização
 */
export async function updateSyncStatus(status, totalDevices = 0) {
    if (useJSON) {
        try {
            const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
            metadata.status = status;
            metadata.total_devices = totalDevices;
            if (status !== 'syncing') {
                metadata.last_sync = new Date().toISOString();
            }
            fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error.message);
        }
        return;
    }
    
    try {
        const database = await getDB();
        const update = {
            status,
            total_devices: totalDevices
        };
        
        if (status !== 'syncing') {
            update.last_sync = new Date().toISOString();
        }
        
        await database.collection(COLLECTION_METADATA).updateOne(
            { _id: 'sync_info' },
            { $set: update },
            { upsert: true }
        );
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error.message);
    }
}

/**
 * Fechar conexão com o banco de dados
 */
export async function closeDB() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('🔌 Conexão com MongoDB fechada');
    }
}

// Inicializar conexão ao importar o módulo
connectDB().then(() => {
    if (!useJSON) {
        console.log('💾 Usando MongoDB como banco de dados');
    } else {
        console.log('💾 Usando JSON como banco de dados (MongoDB não disponível)');
    }
});
