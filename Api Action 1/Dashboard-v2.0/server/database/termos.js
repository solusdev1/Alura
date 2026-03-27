import { MongoClient, ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env'), override: true });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DATABASE || 'action1_inventory';
const COLLECTION_RESPONSAVEIS = 'responsaveis';
const COLLECTION_TERMOS = 'termos_responsabilidade';

const isCloudDB = MONGO_URI.includes('mongodb+srv') || MONGO_URI.includes('mongodb.net');
const TERMS_JSON_PATH = join(__dirname, '../../data/terms.json');
const RESPONSAVEIS_JSON_PATH = join(__dirname, '../../data/responsaveis.json');

let client = null;
let db = null;
let useJSON = false;
let indexesReady = false;

function ensureFile(filePath, initialValue) {
    const dir = join(__dirname, '../../data');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialValue, null, 2));
    }
}

function ensureJsonStorage() {
    ensureFile(TERMS_JSON_PATH, []);
    ensureFile(RESPONSAVEIS_JSON_PATH, []);
}

function readJson(filePath) {
    ensureJsonStorage();
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, value) {
    ensureJsonStorage();
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function normalizeDocumento(documento) {
    return String(documento || '').replace(/\D/g, '');
}

function serializeId(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value instanceof ObjectId) return value.toString();
    if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
    return String(value);
}

function serializeResponsavel(responsavel) {
    if (!responsavel) return null;
    return {
        ...responsavel,
        _id: serializeId(responsavel._id)
    };
}

function serializeTerm(term) {
    if (!term) return null;
    return {
        ...term,
        _id: serializeId(term._id),
        responsavelId: serializeId(term.responsavelId)
    };
}

async function connectTermsDB() {
    if (db || useJSON) return db;

    try {
        client = new MongoClient(MONGO_URI, isCloudDB
            ? { serverSelectionTimeoutMS: 10000, socketTimeoutMS: 45000 }
            : { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        db = client.db(DB_NAME);
        useJSON = false;
        return db;
    } catch (error) {
        console.warn(`⚠️ Termos em fallback JSON: ${error.message}`);
        useJSON = true;
        ensureJsonStorage();
        return null;
    }
}

export async function initTermsStorage() {
    await connectTermsDB();

    if (useJSON || indexesReady) return;

    const database = db;
    await database.collection(COLLECTION_RESPONSAVEIS).createIndex({ documentoNormalizado: 1 }, { unique: true });
    await database.collection(COLLECTION_TERMOS).createIndex({ responsavelId: 1, version: -1 });
    await database.collection(COLLECTION_TERMOS).createIndex({ responsavelChave: 1, status: 1 });
    await database.collection(COLLECTION_TERMOS).createIndex({ createdAt: -1 });
    indexesReady = true;
}

export async function listResponsaveis(search = '') {
    await initTermsStorage();
    const normalized = String(search || '').trim().toLowerCase();

    if (useJSON) {
        const responsaveis = readJson(RESPONSAVEIS_JSON_PATH);
        return responsaveis
            .filter(item => {
                if (!normalized) return true;
                return String(item.nome || '').toLowerCase().includes(normalized)
                    || String(item.documento || '').includes(normalized);
            })
            .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
    }

    const query = normalized
        ? {
            $or: [
                { nome: { $regex: normalized, $options: 'i' } },
                { documento: { $regex: normalized, $options: 'i' } }
            ]
        }
        : {};

    const items = await db.collection(COLLECTION_RESPONSAVEIS)
        .find(query)
        .sort({ nome: 1 })
        .limit(20)
        .toArray();

    return items.map(serializeResponsavel);
}

export async function upsertResponsavel(payload) {
    await initTermsStorage();

    const documentoNormalizado = normalizeDocumento(payload?.documento);
    if (!documentoNormalizado) {
        throw new Error('INVALID_RESPONSIBLE_DOCUMENT');
    }

    const basePayload = {
        nome: String(payload?.nome || '').trim(),
        documento: String(payload?.documento || '').trim(),
        documentoNormalizado,
        tipoDocumento: documentoNormalizado.length > 11 ? 'CNPJ' : 'CPF',
        cargo: String(payload?.cargo || 'Colaborador').trim() || 'Colaborador',
        status: 'ATIVO',
        updatedAt: new Date().toISOString()
    };

    if (useJSON) {
        const responsaveis = readJson(RESPONSAVEIS_JSON_PATH);
        const existingIndex = responsaveis.findIndex(item => item.documentoNormalizado === documentoNormalizado);

        if (existingIndex >= 0) {
            responsaveis[existingIndex] = {
                ...responsaveis[existingIndex],
                ...basePayload
            };
            writeJson(RESPONSAVEIS_JSON_PATH, responsaveis);
            return responsaveis[existingIndex];
        }

        const created = {
            _id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            ...basePayload
        };
        responsaveis.push(created);
        writeJson(RESPONSAVEIS_JSON_PATH, responsaveis);
        return created;
    }

    const collection = db.collection(COLLECTION_RESPONSAVEIS);
    const existing = await collection.findOne({ documentoNormalizado });

    if (existing) {
        await collection.updateOne(
            { _id: existing._id },
            { $set: basePayload }
        );
        return serializeResponsavel(await collection.findOne({ _id: existing._id }));
    }

    const created = {
        createdAt: new Date().toISOString(),
        ...basePayload
    };
    const result = await collection.insertOne(created);
    return serializeResponsavel(await collection.findOne({ _id: result.insertedId }));
}

export async function getLatestTermVersion(responsavelId) {
    await initTermsStorage();
    const normalizedId = serializeId(responsavelId);

    if (useJSON) {
        const terms = readJson(TERMS_JSON_PATH);
        return terms
            .filter(item => serializeId(item.responsavelId) === normalizedId)
            .reduce((max, item) => Math.max(max, Number(item.version || 0)), 0);
    }

    const latest = await db.collection(COLLECTION_TERMOS)
        .find({ responsavelId: new ObjectId(normalizedId) })
        .sort({ version: -1 })
        .limit(1)
        .toArray();

    return latest[0]?.version || 0;
}

export async function deactivateActiveTerms(responsavelChave) {
    await initTermsStorage();

    if (useJSON) {
        const terms = readJson(TERMS_JSON_PATH);
        const next = terms.map(item => (
            item.responsavelChave === responsavelChave && item.status === 'ATIVO'
                ? { ...item, status: 'HISTORICO', updatedAt: new Date().toISOString() }
                : item
        ));
        writeJson(TERMS_JSON_PATH, next);
        return;
    }

    await db.collection(COLLECTION_TERMOS).updateMany(
        { responsavelChave, status: 'ATIVO' },
        { $set: { status: 'HISTORICO', updatedAt: new Date().toISOString() } }
    );
}

export async function insertTerm(term) {
    await initTermsStorage();

    if (useJSON) {
        const terms = readJson(TERMS_JSON_PATH);
        const created = {
            ...term,
            _id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        };
        terms.push(created);
        writeJson(TERMS_JSON_PATH, terms);
        return created;
    }

    const payload = {
        ...term,
        responsavelId: new ObjectId(serializeId(term.responsavelId))
    };
    const result = await db.collection(COLLECTION_TERMOS).insertOne(payload);
    return serializeTerm(await db.collection(COLLECTION_TERMOS).findOne({ _id: result.insertedId }));
}

export async function getTermById(id) {
    await initTermsStorage();
    const normalizedId = serializeId(id);

    if (useJSON) {
        const terms = readJson(TERMS_JSON_PATH);
        return terms.find(item => serializeId(item._id) === normalizedId) || null;
    }

    if (!ObjectId.isValid(normalizedId)) return null;
    return serializeTerm(await db.collection(COLLECTION_TERMOS).findOne({ _id: new ObjectId(normalizedId) }));
}

export async function listTerms(filters = {}) {
    await initTermsStorage();
    const search = String(filters?.search || '').trim().toLowerCase();

    if (useJSON) {
        const terms = readJson(TERMS_JSON_PATH);
        return terms
            .filter(item => {
                if (!search) return true;
                const responsavel = item.contextSnapshot?.responsavel || {};
                return String(responsavel.nome || '').toLowerCase().includes(search)
                    || String(responsavel.documento || '').includes(search)
                    || String(item.fileName || '').toLowerCase().includes(search);
            })
            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }

    const query = search
        ? {
            $or: [
                { 'contextSnapshot.responsavel.nome': { $regex: search, $options: 'i' } },
                { 'contextSnapshot.responsavel.documento': { $regex: search, $options: 'i' } },
                { fileName: { $regex: search, $options: 'i' } }
            ]
        }
        : {};

    const terms = await db.collection(COLLECTION_TERMOS)
        .find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

    return terms.map(serializeTerm);
}

export function buildTermsRepository() {
    return {
        listResponsaveis,
        upsertResponsavel,
        getLatestTermVersion,
        deactivateActiveTerms,
        insertTerm,
        getTermById,
        listTerms
    };
}
