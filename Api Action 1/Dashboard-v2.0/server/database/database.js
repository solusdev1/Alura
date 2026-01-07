import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Arquivo JSON para armazenar dados
const DB_PATH = join(__dirname, '../../data/inventory.json');
const METADATA_PATH = join(__dirname, '../../data/metadata.json');

// Garantir que o diretório existe
const dataDir = join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Inicializar arquivos se não existirem
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

/**
 * Ler dados do arquivo
 */
function readData() {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

/**
 * Escrever dados no arquivo
 */
function writeData(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

/**
 * Ler metadados
 */
function readMetadata() {
    const data = fs.readFileSync(METADATA_PATH, 'utf-8');
    return JSON.parse(data);
}

/**
 * Escrever metadados
 */
function writeMetadata(metadata) {
    fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
}

/**
 * Salvar múltiplos dispositivos no banco de dados
 */
export function saveDevices(devices) {
    writeData(devices);
    writeMetadata({
        last_sync: new Date().toISOString(),
        total_devices: devices.length,
        status: 'success'
    });
}

/**
 * Obter todos os dispositivos
 */
export function getAllDevices() {
    return readData();
}

/**
 * Obter dispositivos por status
 */
export function getDevicesByStatus(status) {
    const devices = readData();
    return devices.filter(d => d.status === status);
}

/**
 * Obter metadados da última sincronização
 */
export function getSyncMetadata() {
    return readMetadata();
}

/**
 * Limpar todo o inventário
 */
export function clearInventory() {
    writeData([]);
    writeMetadata({
        last_sync: new Date().toISOString(),
        total_devices: 0,
        status: 'cleared'
    });
}

/**
 * Obter estatísticas do inventário
 */
export function getStats() {
    const devices = readData();
    return {
        total: devices.length,
        online: devices.filter(d => d.status === 'Online').length,
        offline: devices.filter(d => d.status === 'Offline').length,
        gerenciados: devices.filter(d => d.gerenciado === 'Sim').length
    };
}

/**
 * Atualizar status da sincronização
 */
export function updateSyncStatus(status, totalDevices = 0) {
    const metadata = readMetadata();
    metadata.status = status;
    metadata.total_devices = totalDevices;
    if (status !== 'syncing') {
        metadata.last_sync = new Date().toISOString();
    }
    writeMetadata(metadata);
}
