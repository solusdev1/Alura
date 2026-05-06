import { getDb } from '@/backend/db/mongodb';
import { ObjectId } from 'mongodb';
import { updateDeviceById } from './devices';
import { createNotificacao } from './notificacoes';

function serialize(doc: Record<string, unknown>): Record<string, unknown> {
  return { ...doc, _id: String(doc._id) };
}

function nowBr() {
  return new Date().toLocaleString('pt-BR');
}

function getEtapaInicial(tipo: string, status: string) {
  if (status === 'REJEITADA') return 'ENCERRADA_REJEITADA';
  if (status === 'APROVADA') {
    if (tipo === 'BAIXA') return 'CONCLUIDA_BAIXA';
    if (tipo === 'TRANSFERENCIA') return 'CONCLUIDA_TRANSFERENCIA';
    if (tipo === 'RETORNO_MANUTENCAO') return 'CONCLUIDA_RETORNO';
    if (tipo === 'MANUTENCAO') return 'EM_MANUTENCAO';
  }
  if (tipo === 'MANUTENCAO') return 'AGUARDANDO_ACEITE_MANUTENCAO';
  if (tipo === 'RETORNO_MANUTENCAO') return 'AGUARDANDO_ACEITE_BASE';
  if (tipo === 'TRANSFERENCIA') return 'AGUARDANDO_ACEITE_BASE';
  return 'PENDENTE';
}

export async function listMovimentacoes(filter: Record<string, unknown> = {}, limit = 100) {
  const db = await getDb();
  const items = await db.collection('movimentacoes').find(filter).sort({ dataAbertura: -1 }).limit(limit).toArray();
  return items.map(d => serialize(d as Record<string, unknown>));
}

export async function getMovimentacaoById(id: string) {
  const db = await getDb();
  const item = await db.collection('movimentacoes').findOne({ _id: new ObjectId(id) }) as Record<string, unknown> | null;
  return item ? serialize(item) : null;
}

export async function createMovimentacao(data: Record<string, unknown>) {
  const db = await getDb();
  const tipo = String(data.tipo || 'TRANSFERENCIA').toUpperCase();
  const status = String(data.status || 'PENDENTE').toUpperCase();
  const isResolved = status !== 'PENDENTE';
  const doc = {
    ...data,
    tipo,
    status,
    etapaAtual: String(data.etapaAtual || getEtapaInicial(tipo, status)),
    dataAbertura: new Date().toISOString(),
    resolvidoPorId: isResolved ? String(data.resolvidoPorId || '') : null,
    resolvidoPorNome: isResolved ? String(data.resolvidoPorNome || '') : null,
    dataResolucao: isResolved ? new Date().toISOString() : null
  };
  const r = await db.collection('movimentacoes').insertOne(doc);
  const inserted = { ...doc, _id: r.insertedId };
  if (isResolved) {
    await syncDeviceFromMovement(inserted, status);
  }
  return serialize(inserted);
}

export async function resolverMovimentacao(
  id: string,
  status: 'APROVADA' | 'REJEITADA',
  resolvidoPorId: string,
  resolvidoPorNome: string,
  observacao: string
) {
  const db = await getDb();
  const existing = await db.collection('movimentacoes').findOne({ _id: new ObjectId(id) }) as Record<string, unknown> | null;
  if (!existing) throw new Error('MOVIMENTACAO_NOT_FOUND');

  const tipo = String(existing.tipo || '').toUpperCase();
  const etapaAtual = status === 'REJEITADA'
     ? 'ENCERRADA_REJEITADA'
    : tipo === 'MANUTENCAO'
      ? 'EM_MANUTENCAO'
      : tipo === 'RETORNO_MANUTENCAO'
        ? 'CONCLUIDA_RETORNO'
        : 'CONCLUIDA_TRANSFERENCIA';

  await db.collection('movimentacoes').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, resolvidoPorId, resolvidoPorNome, dataResolucao: new Date().toISOString(), etapaAtual, observacao: observacao || existing.observacao || null } }
  );
  const updated = await db.collection('movimentacoes').findOne({ _id: new ObjectId(id) }) as Record<string, unknown>;
  await syncDeviceFromMovement(updated, status);
  return serialize(updated);
}

export async function countPendentes(baseDestinoNome: string) {
  const db = await getDb();
  const filter: Record<string, unknown> = { status: 'PENDENTE' };
  if (baseDestinoNome) filter.baseDestinoNome = baseDestinoNome;
  return db.collection('movimentacoes').countDocuments(filter);
}

async function syncDeviceFromMovement(movement: Record<string, unknown>, status: string) {
  if (status !== 'APROVADA') return;

  const deviceId = String(movement.deviceId || '');
  if (!deviceId) return;

  const tipo = String(movement.tipo || '').toUpperCase();
  const now = nowBr();
  const baseReferencia = String(movement.baseReferenciaNome || movement.baseOrigemNome || '');
  const setorReferencia = String(movement.setorReferenciaNome || movement.setorOrigemNome || '');

  if (tipo === 'TRANSFERENCIA') {
    await updateDeviceById(deviceId, {
      baseNome: String(movement.baseDestinoNome || movement.baseOrigemNome || ''),
      setor: String(movement.setorDestinoNome || movement.setorOrigemNome || movement.setorAtual || ''),
      dataAlteracao: now,
      status: 'Em Uso'
    });
    return;
  }

  if (tipo === 'MANUTENCAO') {
    await updateDeviceById(deviceId, {
      baseNome: 'MANUTENCAO',
      setor: 'MANUTENCAO',
      status: 'MANUTENCAO',
      dataAlteracao: now,
      manutencaoOrigemBase: baseReferencia,
      manutencaoOrigemSetor: setorReferencia,
      manutencaoOrigemMovimentacaoId: String(movement._id || ''),
      diagnosticoManutencao: String(movement.diagnostico || movement.observacao || '')
    });
    return;
  }

  if (tipo === 'RETORNO_MANUTENCAO') {
    await updateDeviceById(deviceId, {
      baseNome: String(movement.baseDestinoNome || baseReferencia || ''),
      setor: String(movement.setorDestinoNome || setorReferencia || ''),
      status: 'Em Uso',
      dataAlteracao: now,
      diagnosticoManutencao: String(movement.diagnostico || ''),
      resultadoManutencao: String(movement.resultado || 'CONSERTO_REALIZADO'),
      manutencaoOrigemBase: '',
      manutencaoOrigemSetor: '',
      manutencaoOrigemMovimentacaoId: ''
    });
    return;
  }

  if (tipo === 'BAIXA') {
    const baseNotificada = String(movement.baseReferenciaNome || movement.baseOrigemNome || '');
    await updateDeviceById(deviceId, {
      baseNome: baseNotificada || String(movement.baseOrigemNome || ''),
      setor: String(movement.setorReferenciaNome || movement.setorOrigemNome || ''),
      status: 'BAIXADO',
      dataAlteracao: now,
      resultadoManutencao: String(movement.resultado || 'SEM_CONSERTO')
    });

    if (baseNotificada) {
      await createNotificacao({
        tipo: 'BAIXA_MANUTENCAO',
        titulo: 'Equipamento baixado pela manutenção',
        mensagem: `${String(movement.deviceNome || 'Equipamento')} foi baixado pela manutenção.`,
        baseDestinoNome: baseNotificada,
        deviceId,
        movementId: String(movement._id || ''),
        metadata: {
          tipoMovimentacao: tipo,
          motivo: String(movement.observacao || ''),
          resultado: String(movement.resultado || 'SEM_CONSERTO')
        }
      });
    }
  }
}
