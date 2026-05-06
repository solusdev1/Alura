import { ObjectId } from 'mongodb';
import { join } from 'path';
import fs from 'fs';
import { getDb } from './mongodb';

const COLLECTION_RESPONSAVEIS = 'responsaveis';
const COLLECTION_TERMOS = 'termos_responsabilidade';
const TERMS_DATA_DIR = join(process.cwd(), 'backend', 'data');
const TERMS_JSON_PATH = join(TERMS_DATA_DIR, 'terms.json');
const RESPONSAVEIS_JSON_PATH = join(TERMS_DATA_DIR, 'responsaveis.json');

let useJSON = false;
let indexesReady = false;

function ensureJsonStorage() {
  if (!fs.existsSync(TERMS_DATA_DIR)) fs.mkdirSync(TERMS_DATA_DIR, { recursive: true });
  if (!fs.existsSync(TERMS_JSON_PATH)) fs.writeFileSync(TERMS_JSON_PATH, JSON.stringify([], null, 2));
  if (!fs.existsSync(RESPONSAVEIS_JSON_PATH)) fs.writeFileSync(RESPONSAVEIS_JSON_PATH, JSON.stringify([], null, 2));
}

function readJson<T>(filePath: string): T[] {
  ensureJsonStorage();
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson<T>(filePath: string, value: T[]) {
  ensureJsonStorage();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function normalizeDocumento(documento: unknown): string {
  return String(documento || '').replace(/\D/g, '');
}

function serializeId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === 'object' && typeof (value as { toString: () => string }).toString === 'function') return (value as { toString: () => string }).toString();
  return String(value);
}

function serializeResponsavel(r: Record<string, unknown> | null) {
  if (!r) return null;
  return { ...r, _id: serializeId(r._id) };
}

function serializeTerm(t: Record<string, unknown> | null) {
  if (!t) return null;
  return { ...t, _id: serializeId(t._id), responsavelId: serializeId(t.responsavelId) };
}

async function getTermsDb() {
  try {
    const db = await getDb();
    useJSON = false;
    return db;
  } catch {
    if (!useJSON) {
      console.warn('[AVISO] Termos em fallback JSON');
      useJSON = true;
      ensureJsonStorage();
    }
    return null;
  }
}

export async function initTermsStorage() {
  const db = await getTermsDb();
  if (!db || indexesReady) return;
  await db.collection(COLLECTION_RESPONSAVEIS).createIndex({ documentoNormalizado: 1 }, { unique: true });
  await db.collection(COLLECTION_TERMOS).createIndex({ responsavelId: 1, version: -1 });
  await db.collection(COLLECTION_TERMOS).createIndex({ responsavelChave: 1, status: 1 });
  await db.collection(COLLECTION_TERMOS).createIndex({ createdAt: -1 });
  indexesReady = true;
}

function sanitizeRegex(input: string): string {
  return input.replace(/[.*+^${}()|[\]\\]/g, '\\$&');
}

export async function listResponsaveis(search = '') {
  await initTermsStorage();
  const normalized = String(search || '').toLowerCase().slice(0, 80);
  const db = await getTermsDb();

  if (!db) {
    const responsaveis = readJson<Record<string, unknown>>(RESPONSAVEIS_JSON_PATH);
    return responsaveis
      .filter((item: Record<string, unknown>) => !normalized
        || String(item.nome || '').toLowerCase().includes(normalized)
        || String(item.documento || '').includes(normalized))
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
  }

  const safeSearch = normalized ? sanitizeRegex(normalized) : '';
  const query = normalized ? { $or: [{ nome: { $regex: safeSearch, $options: 'i' } }, { documento: { $regex: safeSearch, $options: 'i' } }] } : {};
  const items = await db.collection(COLLECTION_RESPONSAVEIS).find(query).sort({ nome: 1 }).limit(20).toArray();
  return items.map(item => serializeResponsavel(item as Record<string, unknown>));
}

export async function upsertResponsavel(payload: Record<string, unknown>) {
  await initTermsStorage();
  const documentoNormalizado = normalizeDocumento(payload.documento);
  if (!documentoNormalizado) throw new Error('INVALID_RESPONSIBLE_DOCUMENT');

  const basePayload = {
    nome: String(payload.nome || '').trim(),
    documento: String(payload.documento || '').trim(),
    documentoNormalizado,
    tipoDocumento: documentoNormalizado.length > 11 ? 'CNPJ' : 'CPF',
    cargo: String(payload.cargo || 'Colaborador').trim() || 'Colaborador',
    status: 'ATIVO',
    updatedAt: new Date().toISOString()
  };

  const db = await getTermsDb();
  if (!db) {
    const responsaveis = readJson<Record<string, unknown>>(RESPONSAVEIS_JSON_PATH);
    const idx = responsaveis.findIndex(item => item.documentoNormalizado === documentoNormalizado);
    if (idx >= 0) {
      responsaveis[idx] = { ...responsaveis[idx], ...basePayload };
      writeJson(RESPONSAVEIS_JSON_PATH, responsaveis);
      return responsaveis[idx];
    }
    const created = { _id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), ...basePayload };
    responsaveis.push(created);
    writeJson(RESPONSAVEIS_JSON_PATH, responsaveis);
    return created;
  }

  const collection = db.collection(COLLECTION_RESPONSAVEIS);
  const existing = await collection.findOne({ documentoNormalizado });
  if (existing) {
    await collection.updateOne({ _id: existing._id }, { $set: basePayload });
    return serializeResponsavel(await collection.findOne({ _id: existing._id }) as Record<string, unknown>);
  }
  const created = { createdAt: new Date().toISOString(), ...basePayload };
  const result = await collection.insertOne(created);
  return serializeResponsavel(await collection.findOne({ _id: result.insertedId }) as Record<string, unknown>);
}

export async function getLatestTermVersion(responsavelId: string): Promise<number> {
  await initTermsStorage();
  const normalizedId = serializeId(responsavelId);
  const db = await getTermsDb();
  if (!db) {
    const terms = readJson<Record<string, unknown>>(TERMS_JSON_PATH);
    return terms.filter(item => serializeId(item.responsavelId) === normalizedId)
      .reduce((max, item) => Math.max(max, Number(item.version || 0)), 0);
  }
  const latest = await db.collection(COLLECTION_TERMOS).find({ responsavelId: new ObjectId(normalizedId) }).sort({ version: -1 }).limit(1).toArray();
  return (latest[0] as Record<string, unknown>).version as number || 0;
}

export async function deactivateActiveTerms(responsavelChave: string) {
  await initTermsStorage();
  const db = await getTermsDb();
  if (!db) {
    const terms = readJson<Record<string, unknown>>(TERMS_JSON_PATH);
    writeJson(TERMS_JSON_PATH, terms.map(item =>
      item.responsavelChave === responsavelChave && item.status === 'ATIVO'
        ? { ...item, status: 'HISTORICO', updatedAt: new Date().toISOString() }
        : item
    ));
    return;
  }
  await db.collection(COLLECTION_TERMOS).updateMany({ responsavelChave, status: 'ATIVO' }, { $set: { status: 'HISTORICO', updatedAt: new Date().toISOString() } });
}

export async function insertTerm(term: Record<string, unknown>) {
  await initTermsStorage();
  const db = await getTermsDb();
  if (!db) {
    const terms = readJson<Record<string, unknown>>(TERMS_JSON_PATH);
    const created = { ...term, _id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    terms.push(created);
    writeJson(TERMS_JSON_PATH, terms);
    return created;
  }
  const payload = { ...term, responsavelId: new ObjectId(serializeId(term.responsavelId)) };
  const result = await db.collection(COLLECTION_TERMOS).insertOne(payload);
  return serializeTerm(await db.collection(COLLECTION_TERMOS).findOne({ _id: result.insertedId }) as Record<string, unknown>);
}

export async function getTermById(id: string) {
  await initTermsStorage();
  const normalizedId = serializeId(id);
  const db = await getTermsDb();
  if (!db) {
    const terms = readJson<Record<string, unknown>>(TERMS_JSON_PATH);
    return terms.find(item => serializeId(item._id) === normalizedId) || null;
  }
  if (!ObjectId.isValid(normalizedId)) return null;
  return serializeTerm(await db.collection(COLLECTION_TERMOS).findOne({ _id: new ObjectId(normalizedId) }) as Record<string, unknown> | null);
}

export async function listTerms(filters: { search?: string } = {}) {
  await initTermsStorage();
  const search = String(filters.search || '').toLowerCase().slice(0, 80);
  const db = await getTermsDb();
  if (!db) {
    const terms = readJson<Record<string, unknown>>(TERMS_JSON_PATH);
    return terms
      .filter(item => {
        if (!search) return true;
        const responsavel = (item.contextSnapshot as Record<string, unknown>).responsavel as Record<string, unknown> || {};
        return String(responsavel.nome || '').toLowerCase().includes(search)
          || String(responsavel.documento || '').includes(search)
          || String(item.fileName || '').toLowerCase().includes(search);
      })
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }
  const safeSearch = search ? sanitizeRegex(search) : '';
  const query = search ? { $or: [{ 'contextSnapshot.responsavel.nome': { $regex: safeSearch, $options: 'i' } }, { 'contextSnapshot.responsavel.documento': { $regex: safeSearch, $options: 'i' } }, { fileName: { $regex: safeSearch, $options: 'i' } }] } : {};
  const terms = await db.collection(COLLECTION_TERMOS).find(query).sort({ createdAt: -1 }).limit(100).toArray();
  return terms.map((t: Record<string, unknown>) => serializeTerm(t));
}

export function buildTermsRepository() {
  return { listResponsaveis, upsertResponsavel, getLatestTermVersion, deactivateActiveTerms, insertTerm, getTermById, listTerms };
}
