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

// Detectar se é MongoDB Atlas (nuvem)
const isCloudDB = MONGO_URI.includes('mongodb+srv') || MONGO_URI.includes('mongodb.net');

// Fallback para JSON
const DB_PATH = join(__dirname, '../../data/inventory.json');
const METADATA_PATH = join(__dirname, '../../data/metadata.json');

let client = null;
let db = null;
let useJSON = false; // Flag para usar JSON como fallback

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
        fs.writeFileSync(DB_PATH, JSON.stringify(devices, null, 2));
        fs.writeFileSync(METADATA_PATH, JSON.stringify({
            last_sync: new Date().toISOString(),
            total_devices: devices.length,
            status: 'success'
        }, null, 2));
        console.log(`✅ ${devices.length} dispositivos salvos no JSON`);
        return;
    }
    
    try {
        const database = await getDB();
        const collection = database.collection(COLLECTION_DEVICES);
        
        // PRESERVAR adDisplayName existentes
        console.log('   🔄 Preservando Display Names existentes...');
        const existingDevices = await collection.find({}, { projection: { id: 1, adDisplayName: 1 } }).toArray();
        const displayNameMap = new Map(
            existingDevices
                .filter(d => d.adDisplayName && d.adDisplayName.trim() !== '')
                .map(d => [d.id, d.adDisplayName])
        );
        
        // Aplicar Display Names preservados
        devices.forEach(device => {
            if (displayNameMap.has(device.id)) {
                device.adDisplayName = displayNameMap.get(device.id);
            }
        });
        
        console.log(`   ✅ ${displayNameMap.size} Display Names preservados`);
        
        // Limpar coleção antes de inserir novos dados
        await collection.deleteMany({});
        
        // Inserir novos dispositivos
        if (devices.length > 0) {
            await collection.insertMany(devices);
        }
        
        // Atualizar metadados
        await database.collection(COLLECTION_METADATA).updateOne(
            { _id: 'sync_info' },
            {
                $set: {
                    last_sync: new Date().toISOString(),
                    total_devices: devices.length,
                    status: 'success'
                }
            },
            { upsert: true }
        );
        
        console.log(`✅ ${devices.length} dispositivos salvos no MongoDB`);
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
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }
    
    try {
        const database = await getDB();
        const devices = await database.collection(COLLECTION_DEVICES)
            .find({})
            .toArray();
        return devices;
    } catch (error) {
        console.error('❌ Erro ao obter dispositivos:', error.message);
        return [];
    }
}

/**
 * Obter dispositivos por status
 */
export async function getDevicesByStatus(status) {
    if (useJSON) {
        try {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            const devices = JSON.parse(data);
            return devices.filter(d => d.status === status);
        } catch (error) {
            return [];
        }
    }
    
    try {
        const database = await getDB();
        const devices = await database.collection(COLLECTION_DEVICES)
            .find({ status })
            .toArray();
        return devices;
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
 * Obter estatísticas do inventário
 */
export async function getStats() {
    if (useJSON) {
        try {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            const devices = JSON.parse(data);
            return {
                total: devices.length,
                online: devices.filter(d => d.status === 'Online').length,
                offline: devices.filter(d => d.status === 'Offline').length,
                gerenciados: devices.filter(d => d.gerenciado === 'Sim').length
            };
        } catch (error) {
            return { total: 0, online: 0, offline: 0, gerenciados: 0 };
        }
    }
    
    try {
        const database = await getDB();
        const collection = database.collection(COLLECTION_DEVICES);
        
        const [total, online, offline, gerenciados] = await Promise.all([
            collection.countDocuments(),
            collection.countDocuments({ status: 'Online' }),
            collection.countDocuments({ status: 'Offline' }),
            collection.countDocuments({ gerenciado: 'Sim' })
        ]);
        
        return {
            total,
            online,
            offline,
            gerenciados
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
