import { ObjectId } from 'mongodb';
import { getDb } from '@/backend/db/mongodb';

function serialize(doc: Record<string, unknown>) {
  return { ...doc, _id: String(doc._id) };
}

export async function listSolicitacoes(filter: Record<string, unknown> = {}, limit = 100) {
  const db = await getDb();
  const items = await db.collection('solicitacoes').find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  return items.map(item => serialize(item as Record<string, unknown>));
}

export async function createSolicitacao(data: Record<string, unknown>) {
  const db = await getDb();
  const doc = {
    ...data,
    status: 'ABERTA',
    gerenteStatus: 'PENDENTE',
    adminStatus: 'PENDENTE',
    atendimentoModo: null,
    equipamentoVinculadoId: null,
    movimentacaoId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const result = await db.collection('solicitacoes').insertOne(doc);
  return serialize(await db.collection('solicitacoes').findOne({ _id: result.insertedId }) as Record<string, unknown>);
}

export async function getSolicitacaoById(id: string) {
  const db = await getDb();
  return serialize(await db.collection('solicitacoes').findOne({ _id: new ObjectId(id) }) as Record<string, unknown>);
}

export async function updateSolicitacao(id: string, payload: Record<string, unknown>) {
  const db = await getDb();
  await db.collection('solicitacoes').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...payload, updatedAt: new Date().toISOString() } }
  );
  return serialize(await db.collection('solicitacoes').findOne({ _id: new ObjectId(id) }) as Record<string, unknown>);
}
