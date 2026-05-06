import { getDb } from '@/backend/db/mongodb';
import { ObjectId } from 'mongodb';
import { ensureBootstrapData } from '@/backend/db/bootstrap';

function serialize(doc: Record<string, unknown>): Record<string, unknown> {
  return { ...doc, _id: String(doc._id) };
}

export async function listBases(onlyActive = false) {
  await ensureBootstrapData();
  const db = await getDb();
  const filter = onlyActive ? { isActive: true } : {};
  const items = await db.collection('bases').find(filter).sort({ nome: 1 }).toArray();
  return items.map(d => serialize(d as Record<string, unknown>));
}

export async function createBase(data: { nome: string; codigo: string; tipo: string }) {
  await ensureBootstrapData();
  const db = await getDb();
  const exists = await db.collection('bases').findOne({ codigo: data.codigo });
  if (exists) throw new Error('Já existe uma base com esse código.');
  const doc = {
    ...data,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const r = await db.collection('bases').insertOne(doc);
  return serialize(await db.collection('bases').findOne({ _id: r.insertedId }) as Record<string, unknown>);
}

export async function updateBase(id: string, data: Partial<{ nome: string; codigo: string; tipo: string; isActive: boolean }>) {
  await ensureBootstrapData();
  const db = await getDb();

  if (data.codigo) {
    const duplicated = await db.collection('bases').findOne({
      codigo: data.codigo,
      _id: { $ne: new ObjectId(id) }
    });
    if (duplicated) throw new Error('Já existe uma base com esse código.');
  }

  const current = await db.collection('bases').findOne({ _id: new ObjectId(id) });
  if (!current) throw new Error('Base não encontrada.');

  await db.collection('bases').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date().toISOString() } }
  );

  const updated = await db.collection('bases').findOne({ _id: new ObjectId(id) }) as Record<string, unknown>;

  const oldName = String(current.nome || '');
  const newName = String(updated.nome || oldName);
  if (oldName && newName && oldName !== newName) {
    await Promise.all([
      db.collection('devices').updateMany({ baseNome: oldName }, { $set: { baseNome: newName, updatedAt: new Date().toISOString() } }),
      db.collection('users').updateMany({ baseId: id }, { $set: { baseName: newName, updatedAt: new Date().toISOString() } }),
      db.collection('movimentacoes').updateMany({ baseOrigemNome: oldName }, { $set: { baseOrigemNome: newName } }),
      db.collection('movimentacoes').updateMany({ baseDestinoNome: oldName }, { $set: { baseDestinoNome: newName } })
    ]);
  }

  return serialize(updated);
}

export async function deleteBase(id: string) {
  await ensureBootstrapData();
  const db = await getDb();
  const base = await db.collection('bases').findOne({ _id: new ObjectId(id) });
  if (!base) throw new Error('Base não encontrada.');

  const baseName = String(base.nome || '');
  const [linkedDevices, linkedUsers] = await Promise.all([
    db.collection('devices').countDocuments({ $or: [{ baseNome: baseName }, { setor: baseName }] }),
    db.collection('users').countDocuments({ baseId: id })
  ]);

  if (linkedDevices > 0 || linkedUsers > 0) {
    throw new Error('A base possui equipamentos ou usuários vinculados e não pode ser excluída.');
  }

  await db.collection('bases').deleteOne({ _id: new ObjectId(id) });
  return { success: true };
}

export async function getBasesWithStats() {
  await ensureBootstrapData();
  const db = await getDb();
  const bases = await db.collection('bases').find({}).sort({ nome: 1 }).toArray();
  return Promise.all(
    bases.map(async (base) => {
      const baseName = String(base.nome || '');
      const [totalEquipamentos, totalGestores] = await Promise.all([
        db.collection('devices').countDocuments({ $or: [{ baseNome: baseName }, { $and: [{ baseNome: { $exists: false } }, { setor: baseName }] }] }),
        db.collection('users').countDocuments({ baseId: String(base._id), role: 'GESTOR_BASE', isActive: true })
      ]);
      return { ...serialize(base as Record<string, unknown>), totalEquipamentos, totalGestores };
    })
  );
}
