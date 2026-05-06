import { getDb } from '@/backend/db/mongodb';
import { ObjectId } from 'mongodb';
import { hash } from 'bcryptjs';
import { ensureBootstrapData } from '@/backend/db/bootstrap';

function serialize(doc: Record<string, unknown>): Record<string, unknown> {
  const { passwordHash, ...rest } = doc;
  return { ...rest, _id: String(doc._id) };
}

function assertStrongEnoughPassword(password: string) {
  if (password.trim().length < 6) {
    throw new Error('A senha deve ter no minimo 6 caracteres.');
  }
}

export async function listUsers() {
  await ensureBootstrapData();
  const db = await getDb();
  const items = await db.collection('users').find({}).sort({ name: 1 }).toArray();
  return items.map(d => serialize(d as Record<string, unknown>));
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  baseId: string | null;
  baseName: string | null;
}) {
  await ensureBootstrapData();
  const db = await getDb();
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = await db.collection('users').findOne({ email: normalizedEmail });
  if (existing) throw new Error('Já existe um usuário com esse e-mail.');
  if (data.role === 'GESTOR_BASE' && !data.baseId) throw new Error('Gestor de Base precisa ter uma base vinculada.');
  assertStrongEnoughPassword(data.password);

  const passwordHash = await hash(data.password, 12);
  const doc = {
    name: data.name,
    email: normalizedEmail,
    passwordHash,
    role: data.role,
    baseId: data.role === 'GESTOR_BASE' ? data.baseId || null : null,
    baseName: data.role === 'GESTOR_BASE' ? data.baseName || null : null,
    isActive: true,
    mustChangePassword: data.role !== 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const r = await db.collection('users').insertOne(doc);
  return serialize(await db.collection('users').findOne({ _id: r.insertedId }) as Record<string, unknown>);
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    role: string;
    baseId: string | null;
    baseName: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
    password: string;
  }>
) {
  await ensureBootstrapData();
  const db = await getDb();
  const current = await db.collection('users').findOne({ _id: new ObjectId(id) });
  if (!current) throw new Error('Usuário não encontrado.');

  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString()
  };

  if (data.name !== undefined) payload.name = data.name;
  if (data.role !== undefined) payload.role = data.role;
  if (data.isActive !== undefined) payload.isActive = data.isActive;

  const finalRole = String(data.role || current.role || '');

  if (finalRole !== 'GESTOR_BASE') {
    payload.baseId = null;
    payload.baseName = null;
  } else {
    if (data.baseId !== undefined) payload.baseId = data.baseId;
    if (data.baseName !== undefined) payload.baseName = data.baseName;
  }

  if (typeof data.password === 'string' && data.password.trim()) {
    assertStrongEnoughPassword(data.password);
    payload.passwordHash = await hash(data.password.trim(), 12);
    payload.mustChangePassword = finalRole !== 'ADMIN';
  } else if (data.mustChangePassword !== undefined) {
    payload.mustChangePassword = finalRole === 'ADMIN' ? false : data.mustChangePassword;
  } else if (data.role !== undefined && finalRole === 'ADMIN') {
    payload.mustChangePassword = false;
  }

  await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: payload });
  return serialize(await db.collection('users').findOne({ _id: new ObjectId(id) }) as Record<string, unknown>);
}
