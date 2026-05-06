import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { getAllDevices, updateDeviceById } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env'), override: true });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DATABASE || 'action1_inventory';
const isCloudDB = MONGO_URI.includes('mongodb+srv') || MONGO_URI.includes('mongodb.net');

const COLLECTION_BASES = 'bases';
const COLLECTION_USERS = 'users';
const COLLECTION_MOVEMENTS = 'movements';
const JSON_PATH = join(__dirname, '../../data/admin-state.json');

let client = null;
let db = null;
let useJSON = false;

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizeKey(value) {
    return normalizeText(value).toLowerCase();
}

function slugify(value) {
    return normalizeText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureJsonState() {
    const dataDir = join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(JSON_PATH)) {
        fs.writeFileSync(JSON_PATH, JSON.stringify({
            bases: [],
            users: [],
            movements: []
        }, null, 2));
    }
}

function readJsonState() {
    ensureJsonState();
    try {
        const raw = fs.readFileSync(JSON_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
            bases: Array.isArray(parsed.bases) ? parsed.bases : [],
            users: Array.isArray(parsed.users) ? parsed.users : [],
            movements: Array.isArray(parsed.movements) ? parsed.movements : []
        };
    } catch (_) {
        return { bases: [], users: [], movements: [] };
    }
}

function writeJsonState(state) {
    ensureJsonState();
    fs.writeFileSync(JSON_PATH, JSON.stringify(state, null, 2));
}

async function connectAdminDB() {
    if (db || useJSON) return db;

    try {
        client = new MongoClient(MONGO_URI, isCloudDB
            ? { serverSelectionTimeoutMS: 10000, socketTimeoutMS: 45000 }
            : { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        db = client.db(DB_NAME);

        await db.collection(COLLECTION_BASES).createIndex({ id: 1 }, { unique: true });
        await db.collection(COLLECTION_BASES).createIndex({ codigo: 1 }, { unique: true });
        await db.collection(COLLECTION_USERS).createIndex({ id: 1 }, { unique: true });
        await db.collection(COLLECTION_USERS).createIndex({ email: 1 }, { unique: true });
        await db.collection(COLLECTION_MOVEMENTS).createIndex({ id: 1 }, { unique: true });
        await db.collection(COLLECTION_MOVEMENTS).createIndex({ status: 1 });

        useJSON = false;
        return db;
    } catch (error) {
        console.warn(`⚠️ Admin storage em JSON: ${error.message}`);
        useJSON = true;
        ensureJsonState();
        return null;
    }
}

async function getCollections() {
    if (useJSON) return null;
    if (!db) {
        await connectAdminDB();
    }
    return db;
}

function buildBaseSeed(devices) {
    const byKey = new Map();

    devices.forEach(device => {
        const nome = normalizeText(device.baseNome || device.city || device.organizacao || 'Base sem nome');
        const key = slugify(nome);
        if (!key || byKey.has(key)) return;

        const codigo = normalizeText(device.baseCodigo) || nome.toUpperCase();
        byKey.set(key, {
            id: `base-${key}`,
            codigo,
            nome,
            tipo: normalizeText(device.baseTipo) || 'Operacional',
            status: 'Ativa',
            createdAt: new Date().toISOString()
        });
    });

    if (!byKey.size) {
        byKey.set('matriz-principal', {
            id: 'base-matriz-principal',
            codigo: 'MATRIZ',
            nome: 'Matriz Principal',
            tipo: 'Matriz',
            status: 'Ativa',
            createdAt: new Date().toISOString()
        });
    }

    return Array.from(byKey.values());
}

function mergeBaseSeeds(existingBases, seededBases) {
    const next = [...existingBases];
    const knownIds = new Set(existingBases.map(item => item.id));
    const knownCodes = new Set(existingBases.map(item => normalizeKey(item.codigo)));

    seededBases.forEach(base => {
        if (knownIds.has(base.id) || knownCodes.has(normalizeKey(base.codigo))) return;
        next.push(base);
    });

    return next;
}

function ensureDefaultAdmin(users, bases) {
    if (users.length > 0) return users;
    return [{
        id: 'user-admin-principal',
        nome: 'Administrador Master',
        email: 'admin@carrarologistica.com.br',
        senhaTemporaria: 'Carraro@123',
        perfil: 'Administrador',
        baseId: '',
        baseNome: 'Todas as bases',
        status: 'Ativo',
        precisaTrocarSenha: true,
        createdAt: new Date().toISOString()
    }];
}

async function loadAdminState() {
    const devices = await getAllDevices();
    const seededBases = buildBaseSeed(devices);

    if (useJSON) {
        const state = readJsonState();
        const bases = mergeBaseSeeds(state.bases, seededBases);
        const users = ensureDefaultAdmin(state.users, bases);
        const nextState = { ...state, bases, users };
        writeJsonState(nextState);
        return nextState;
    }

    const database = await getCollections();
    if (!database) {
        const state = readJsonState();
        const bases = mergeBaseSeeds(state.bases, seededBases);
        const users = ensureDefaultAdmin(state.users, bases);
        return { ...state, bases, users };
    }

    const [basesRaw, usersRaw, movements] = await Promise.all([
        database.collection(COLLECTION_BASES).find({}).toArray(),
        database.collection(COLLECTION_USERS).find({}).toArray(),
        database.collection(COLLECTION_MOVEMENTS).find({}).sort({ createdAt: -1 }).toArray()
    ]);

    const bases = mergeBaseSeeds(basesRaw.map(stripMongoId), seededBases);
    const users = ensureDefaultAdmin(usersRaw.map(stripMongoId), bases);

    await syncCollection(database, COLLECTION_BASES, bases);
    await syncCollection(database, COLLECTION_USERS, users);

    return {
        bases,
        users,
        movements: movements.map(stripMongoId)
    };
}

function stripMongoId(item) {
    if (!item) return item;
    const { _id, ...rest } = item;
    return rest;
}

async function syncCollection(database, collectionName, items) {
    const collection = database.collection(collectionName);
    for (const item of items) {
        await collection.updateOne({ id: item.id }, { $set: item }, { upsert: true });
    }
}

function buildBaseRef(base, fallbackName = '') {
    return {
        baseId: base?.id || '',
        baseCodigo: base?.codigo || '',
        baseNome: base?.nome || fallbackName || '',
        baseTipo: base?.tipo || ''
    };
}

function buildReports(bases, users, movements, devices) {
    return bases.map(base => {
        const activeDevices = devices.filter(device => matchDeviceToBase(device, base));
        const gestores = users.filter(user => user.status === 'Ativo' && user.perfil === 'Gestor de Base' && user.baseId === base.id);
        const pendencias = movements.filter(item => item.status === 'Pendente' && item.destinoBaseId === base.id);

        return {
            baseId: base.id,
            codigo: base.codigo,
            nome: base.nome,
            tipo: base.tipo,
            status: base.status,
            totalEquipamentos: activeDevices.length,
            gestoresAtivos: gestores.length,
            transferenciasPendentes: pendencias.length,
            online: activeDevices.filter(device => String(device.status || '').toLowerCase() === 'online').length,
            offline: activeDevices.filter(device => String(device.status || '').toLowerCase() === 'offline').length,
            emUso: activeDevices.filter(device => String(device.status || '').toLowerCase() === 'em uso').length
        };
    });
}

function matchDeviceToBase(device, base) {
    const baseId = normalizeKey(device.baseId);
    const baseCodigo = normalizeKey(device.baseCodigo);
    const baseNome = normalizeKey(device.baseNome || device.city || device.organizacao);
    return baseId === normalizeKey(base.id) || baseCodigo === normalizeKey(base.codigo) || baseNome === normalizeKey(base.nome);
}

export async function getAdminSnapshot() {
    await connectAdminDB();
    const { bases, users, movements } = await loadAdminState();
    const devices = await getAllDevices();
    return {
        bases,
        users,
        movements,
        reports: buildReports(bases, users, movements, devices)
    };
}

export async function createBase(payload) {
    await connectAdminDB();
    const state = await loadAdminState();
    const nome = normalizeText(payload?.nome);
    const codigo = normalizeText(payload?.codigo).toUpperCase();
    const tipo = normalizeText(payload?.tipo) || 'Operacional';

    if (!nome) throw new Error('Informe o nome da base');
    if (!codigo) throw new Error('Informe o código da base');

    if (state.bases.some(base => normalizeKey(base.codigo) === normalizeKey(codigo))) {
        throw new Error('Já existe uma base com esse código');
    }

    const base = {
        id: `base-${slugify(codigo || nome)}`,
        codigo,
        nome,
        tipo,
        status: 'Ativa',
        createdAt: new Date().toISOString()
    };

    if (useJSON) {
        const nextState = { ...state, bases: [base, ...state.bases] };
        writeJsonState(nextState);
    } else {
        const database = await getCollections();
        await database.collection(COLLECTION_BASES).insertOne(base);
    }

    return base;
}

export async function toggleBaseStatus(id) {
    await connectAdminDB();
    const state = await loadAdminState();
    const current = state.bases.find(base => base.id === String(id));
    if (!current) throw new Error('Base não encontrada');

    const nextBase = {
        ...current,
        status: current.status === 'Ativa' ? 'Inativa' : 'Ativa',
        updatedAt: new Date().toISOString()
    };

    if (useJSON) {
        const nextState = {
            ...state,
            bases: state.bases.map(base => base.id === nextBase.id ? nextBase : base)
        };
        writeJsonState(nextState);
    } else {
        const database = await getCollections();
        await database.collection(COLLECTION_BASES).updateOne(
            { id: nextBase.id },
            { $set: nextBase }
        );
    }

    return nextBase;
}

export async function createUser(payload) {
    await connectAdminDB();
    const state = await loadAdminState();
    const nome = normalizeText(payload?.nome);
    const email = normalizeText(payload?.email).toLowerCase();
    const senhaTemporaria = normalizeText(payload?.senhaTemporaria);
    const perfil = normalizeText(payload?.perfil) || 'Gestor de Base';
    const baseId = normalizeText(payload?.baseId);
    const base = state.bases.find(item => item.id === baseId);

    if (!nome) throw new Error('Informe o nome do usuário');
    if (!email) throw new Error('Informe o e-mail do usuário');
    if (!senhaTemporaria) throw new Error('Informe a senha provisória');
    if (perfil === 'Gestor de Base' && !base) throw new Error('Selecione a base vinculada');
    if (state.users.some(user => normalizeKey(user.email) === normalizeKey(email))) {
        throw new Error('Já existe um usuário com esse e-mail');
    }

    const user = {
        id: createId('user'),
        nome,
        email,
        senhaTemporaria,
        perfil,
        baseId: base?.id || '',
        baseNome: base?.nome || 'Todas as bases',
        status: 'Ativo',
        precisaTrocarSenha: true,
        createdAt: new Date().toISOString()
    };

    if (useJSON) {
        const nextState = { ...state, users: [user, ...state.users] };
        writeJsonState(nextState);
    } else {
        const database = await getCollections();
        await database.collection(COLLECTION_USERS).insertOne(user);
    }

    return user;
}

export async function updateUser(id, payload) {
    await connectAdminDB();
    const state = await loadAdminState();
    const current = state.users.find(user => user.id === String(id));
    if (!current) throw new Error('Usuário não encontrado');

    const next = { ...current };
    if (payload?.nome !== undefined) next.nome = normalizeText(payload.nome);
    if (payload?.perfil !== undefined) next.perfil = normalizeText(payload.perfil) || next.perfil;
    if (payload?.status !== undefined) next.status = normalizeText(payload.status) || next.status;
    if (payload?.senhaTemporaria !== undefined) next.senhaTemporaria = normalizeText(payload.senhaTemporaria) || next.senhaTemporaria;
    if (payload?.precisaTrocarSenha !== undefined) next.precisaTrocarSenha = Boolean(payload.precisaTrocarSenha);

    if (payload?.baseId !== undefined) {
        const base = state.bases.find(item => item.id === normalizeText(payload.baseId));
        if (next.perfil === 'Gestor de Base' && !base) {
            throw new Error('Gestor precisa estar vinculado a uma base');
        }
        next.baseId = base?.id || '';
        next.baseNome = base?.nome || 'Todas as bases';
    }

    next.updatedAt = new Date().toISOString();

    if (useJSON) {
        const nextState = {
            ...state,
            users: state.users.map(user => user.id === next.id ? next : user)
        };
        writeJsonState(nextState);
    } else {
        const database = await getCollections();
        await database.collection(COLLECTION_USERS).updateOne({ id: next.id }, { $set: next });
    }

    return next;
}

export async function createMovement(payload) {
    await connectAdminDB();
    const state = await loadAdminState();
    const devices = await getAllDevices();
    const device = devices.find(item => String(item.id) === String(payload?.deviceId));
    if (!device) throw new Error('Equipamento não encontrado');

    const origemBase = state.bases.find(base => matchDeviceToBase(device, base));
    const destinoBase = state.bases.find(base => base.id === normalizeText(payload?.destinoBaseId));
    const requestedBy = state.users.find(user => user.id === normalizeText(payload?.requestedByUserId));
    const motivo = normalizeText(payload?.motivo);

    if (!destinoBase) throw new Error('Selecione a base de destino');
    if (!motivo) throw new Error('Informe o motivo da movimentação');

    const movement = {
        id: createId('mov'),
        deviceId: String(device.id),
        deviceNome: device.nome || device.dispositivo || 'Equipamento',
        tipo: device.tipo || 'Equipamento',
        status: 'Pendente',
        motivo,
        solicitanteId: requestedBy?.id || '',
        solicitanteNome: requestedBy?.nome || 'Sistema',
        origemBaseId: origemBase?.id || device.baseId || '',
        origemBaseNome: origemBase?.nome || device.baseNome || device.city || device.organizacao || 'Sem base',
        destinoBaseId: destinoBase.id,
        destinoBaseNome: destinoBase.nome,
        createdAt: new Date().toISOString(),
        history: [{
            tipo: 'solicitacao',
            status: 'Pendente',
            descricao: `Solicitação criada por ${requestedBy?.nome || 'Sistema'}`,
            motivo,
            data: new Date().toISOString()
        }]
    };

    if (useJSON) {
        const nextState = { ...state, movements: [movement, ...state.movements] };
        writeJsonState(nextState);
    } else {
        const database = await getCollections();
        await database.collection(COLLECTION_MOVEMENTS).insertOne(movement);
    }

    return movement;
}

export async function respondMovement(id, payload) {
    await connectAdminDB();
    const state = await loadAdminState();
    const movement = state.movements.find(item => item.id === String(id));
    if (!movement) throw new Error('Movimentação não encontrada');
    if (movement.status !== 'Pendente') throw new Error('Essa movimentação já foi tratada');

    const acao = normalizeKey(payload?.acao);
    const gestor = state.users.find(user => user.id === normalizeText(payload?.userId));
    const observacao = normalizeText(payload?.observacao);
    if (!['aceitar', 'rejeitar'].includes(acao)) throw new Error('Ação inválida');

    const nextStatus = acao === 'aceitar' ? 'Aceita' : 'Rejeitada';
    const next = {
        ...movement,
        status: nextStatus,
        respondedAt: new Date().toISOString(),
        respondedByUserId: gestor?.id || '',
        respondedByNome: gestor?.nome || 'Sistema',
        history: [
            ...(Array.isArray(movement.history) ? movement.history : []),
            {
                tipo: acao,
                status: nextStatus,
                descricao: `Movimentação ${nextStatus.toLowerCase()} por ${gestor?.nome || 'Sistema'}`,
                observacao,
                data: new Date().toISOString()
            }
        ]
    };

    if (acao === 'aceitar') {
        const destination = state.bases.find(base => base.id === movement.destinoBaseId);
        await updateDeviceById(movement.deviceId, buildBaseRef(destination, movement.destinoBaseNome));
    }

    if (useJSON) {
        const nextState = {
            ...state,
            movements: state.movements.map(item => item.id === next.id ? next : item)
        };
        writeJsonState(nextState);
    } else {
        const database = await getCollections();
        await database.collection(COLLECTION_MOVEMENTS).updateOne({ id: next.id }, { $set: next });
    }

    return next;
}

