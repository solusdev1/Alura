export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { createMovimentacao, listMovimentacoes } from '@/backend/db/movimentacoes';
import { getAllDevices } from '@/backend/db/devices';
import { NextResponse } from 'next/server';

type SessionUser = { id: string; name: string; role: string; baseName: string | null };

function isMaintenanceUser(user: SessionUser) {
  return user.role === 'MANUTENCAO';
}

function getMaintenanceOrigin(device: Record<string, unknown>) {
  return String(device.manutencaoOrigemBase || device.baseNome || '');
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session?.user as SessionUser;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');
  const deviceId = searchParams.get('deviceId');

  const filter: Record<string, unknown> = {};
  if (user.role === 'GESTOR_BASE' && user.baseName) {
    filter.$or = [{ baseOrigemNome: user.baseName }, { baseDestinoNome: user.baseName }, { baseReferenciaNome: user.baseName }];
  } else if (isMaintenanceUser(user)) {
    filter.$or = [{ baseDestinoNome: 'MANUTENCAO' }, { baseOrigemNome: 'MANUTENCAO' }, { tipo: 'MANUTENCAO' }, { tipo: 'RETORNO_MANUTENCAO' }, { tipo: 'BAIXA' }];
  }
  if (tipo === 'pendentes') filter.status = 'PENDENTE';
  if (deviceId) filter.deviceId = deviceId;

  const items = await listMovimentacoes(filter, 150);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session?.user as SessionUser;
  const body = await request.json();
  const tipo = String(body.tipo || 'TRANSFERENCIA').toUpperCase();
  const allDevices = await getAllDevices();
  const device = allDevices.find(item => String(item.id) === String(body.deviceId)) as Record<string, unknown> | undefined;

  if (!device) {
    return NextResponse.json({ error: 'Dispositivo não encontrado.' }, { status: 404 });
  }

  if (user.role === 'GESTOR_BASE' && user.baseName) {
    const baseOrigem = String(body.baseOrigemNome || device.baseNome || '').trim();
    if (baseOrigem && baseOrigem !== user.baseName) {
      return NextResponse.json({ error: 'Gestor de base so pode movimentar equipamentos da propria base.' }, { status: 403 });
    }
  }

  if (isMaintenanceUser(user) && !['RETORNO_MANUTENCAO', 'BAIXA'].includes(tipo)) {
    return NextResponse.json({ error: 'Usuário de manutenção só pode devolver ou dar baixa.' }, { status: 403 });
  }

  if (tipo === 'MANUTENCAO') {
    const mov = await createMovimentacao({
      ...body,
      tipo,
      baseOrigemNome: String(body.baseOrigemNome || device.baseNome || ''),
      baseDestinoNome: 'MANUTENCAO',
      setorOrigemNome: String(body.setorOrigemNome || device.setor || ''),
      setorDestinoNome: 'MANUTENCAO',
      baseReferenciaNome: String(body.baseOrigemNome || device.baseNome || ''),
      setorReferenciaNome: String(body.setorOrigemNome || device.setor || ''),
      etapaAtual: 'AGUARDANDO_ACEITE_MANUTENCAO',
      status: 'PENDENTE',
      solicitadoPorId: user.id || '',
      solicitadoPorNome: user.name || ''
    });
    return NextResponse.json(mov, { status: 201 });
  }

  if (tipo === 'RETORNO_MANUTENCAO') {
    if (!['MANUTENCAO', 'ADMIN'].includes(String(user.role || ''))) {
      return NextResponse.json({ error: 'Somente manutenção ou admin pode devolver equipamento.' }, { status: 403 });
    }
    const baseDestinoNome = String(body.baseDestinoNome || getMaintenanceOrigin(device));
    const mov = await createMovimentacao({
      ...body,
      tipo,
      baseOrigemNome: 'MANUTENCAO',
      baseDestinoNome,
      setorOrigemNome: 'MANUTENCAO',
      setorDestinoNome: String(body.setorDestinoNome || device.manutencaoOrigemSetor || ''),
      baseReferenciaNome: baseDestinoNome,
      setorReferenciaNome: String(body.setorDestinoNome || device.manutencaoOrigemSetor || ''),
      etapaAtual: 'AGUARDANDO_ACEITE_BASE',
      status: 'PENDENTE',
      solicitadoPorId: user.id || '',
      solicitadoPorNome: user.name || '',
      diagnostico: body.diagnostico || '',
      resultado: body.resultado || 'CONSERTO_REALIZADO'
    });
    return NextResponse.json(mov, { status: 201 });
  }

  if (tipo === 'BAIXA') {
    const isMaintenanceFlow = String(device.baseNome || '') === 'MANUTENCAO' || String(device.status || '').toUpperCase() === 'MANUTENCAO';
    if (isMaintenanceFlow && !['MANUTENCAO', 'ADMIN'].includes(String(user.role || ''))) {
      return NextResponse.json({ error: 'Baixa de item em manutenção deve ser feita pela manutenção ou admin.' }, { status: 403 });
    }

    const mov = await createMovimentacao({
      ...body,
      tipo,
      baseOrigemNome: String(body.baseOrigemNome || device.baseNome || ''),
      baseDestinoNome: String(body.baseDestinoNome || body.baseOrigemNome || device.baseNome || ''),
      setorOrigemNome: String(body.setorOrigemNome || device.setor || ''),
      setorDestinoNome: String(body.setorDestinoNome || device.setor || ''),
      baseReferenciaNome: String(body.baseReferenciaNome || device.manutencaoOrigemBase || body.baseOrigemNome || device.baseNome || ''),
      setorReferenciaNome: String(body.setorReferenciaNome || device.manutencaoOrigemSetor || body.setorOrigemNome || device.setor || ''),
      status: 'APROVADA',
      etapaAtual: 'CONCLUIDA_BAIXA',
      solicitadoPorId: user.id || '',
      solicitadoPorNome: user.name || '',
      resolvidoPorId: user.id || '',
      resolvidoPorNome: user.name || '',
      resultado: body.resultado || 'SEM_CONSERTO'
    });
    return NextResponse.json(mov, { status: 201 });
  }

  const mov = await createMovimentacao({
    ...body,
    tipo,
    baseOrigemNome: user.role === 'GESTOR_BASE' && user.baseName ? user.baseName : body.baseOrigemNome,
    baseDestinoNome: body.baseDestinoNome,
    setorOrigemNome: body.setorOrigemNome || body.setorAtual || device.setor || '',
    setorDestinoNome: body.setorDestinoNome || body.setorOrigemNome || body.setorAtual || device.setor || '',
    etapaAtual: 'AGUARDANDO_ACEITE_BASE',
    status: 'PENDENTE',
    solicitadoPorId: user.id || '',
    solicitadoPorNome: user.name || ''
  });
  return NextResponse.json(mov, { status: 201 });
}
