import { ObjectId } from 'mongodb';
import { getDb } from '@/backend/db/mongodb';

function serialize(doc: Record<string, unknown>) {
  return { ...doc, _id: String(doc._id) };
}

export async function listNotificacoes(filter: Record<string, unknown> = {}, limit = 50) {
  const db = await getDb();
  const items = await db.collection('notificacoes').find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  return items.map(item => serialize(item as Record<string, unknown>));
}

export async function createNotificacao(data: Record<string, unknown>) {
  const db = await getDb();
  const doc = {
    ...data,
    lida: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const result = await db.collection('notificacoes').insertOne(doc);
  return serialize(await db.collection('notificacoes').findOne({ _id: result.insertedId }) as Record<string, unknown>);
}

export async function markNotificacaoLida(id: string) {
  const db = await getDb();
  await db.collection('notificacoes').updateOne(
    { _id: new ObjectId(id) },
    { $set: { lida: true, updatedAt: new Date().toISOString() } }
  );
  return serialize(await db.collection('notificacoes').findOne({ _id: new ObjectId(id) }) as Record<string, unknown>);
}
