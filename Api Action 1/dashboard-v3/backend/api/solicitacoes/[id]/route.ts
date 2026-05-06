export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { getSolicitacaoById, updateSolicitacao } from '@/backend/db/solicitacoes';
import { getAllDevices } from '@/backend/db/devices';
import { createMovimentacao } from '@/backend/db/movimentacoes';
import { NextResponse } from 'next/server';

type SessionUser = { id: string; name: string; role: string; baseName: string | null };

function isTiStockDevice(device: Record<string, unknown>) {
  const base = String(device.baseNome || '').trim().toUpperCase();
  const setor = String(device.setor || '').trim().toUpperCase();
  const status = String(device.status || '').trim().toUpperCase();
  return (base === 'TI' || setor === 'TI') && !['BAIXADO', 'MANUTENCAO'].includes(status);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session?.user as SessionUser;
  const { id } = await params;
  const body = await request.json();
  const action = String(body.action || '').toUpperCase();

  const solicitacao = await getSolicitacaoById(id) as Record<string, unknown> | null;
  if (!solicitacao) {
    return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  }

  if (action === 'APROVAR_GERENTE' || action === 'REJEITAR_GERENTE') {
    if (!['GERENTE', 'ADMIN'].includes(String(user.role || ''))) {
      return NextResponse.json({ error: 'Somente gerente ou admin pode aprovar solicitações.' }, { status: 403 });
    }
    const approved = action === 'APROVAR_GERENTE';
    const item = await updateSolicitacao(id, {
      gerenteStatus: approved ? 'APROVADA' : 'REJEITADA',
      status: approved ? 'APROVADA_GERENTE' : 'REJEITADA_GERENTE',
      gerenteAprovadorId: user.id || '',
      gerenteAprovadorNome: user.name || '',
      gerenteObservacao: String(body.observacao || '')
    });
    return NextResponse.json(item);
  }

  if (!['ADMIN'].includes(String(user.role || ''))) {
    return NextResponse.json({ error: 'Somente admin pode atender solicitações aprovadas.' }, { status: 403 });
  }

  if (action === 'MARCAR_COMPRA') {
    const item = await updateSolicitacao(id, {
      adminStatus: 'AGUARDANDO_COMPRA',
      status: 'AGUARDANDO_COMPRA',
      atendimentoModo: 'COMPRA',
      adminExecutorId: user.id || '',
      adminExecutorNome: user.name || '',
      adminObservacao: String(body.observacao || '')
    });
    return NextResponse.json(item);
  }

  if (action === 'REJEITAR_ADMIN') {
    if (!['APROVADA_GERENTE', 'AGUARDANDO_COMPRA'].includes(String(solicitacao.status || ''))) {
      return NextResponse.json({ error: 'Esta solicitacao nao esta em uma etapa rejeitavel pelo admin.' }, { status: 400 });
    }

    const justificativa = String(body.justificativa || body.observacao || '').trim();
    if (!justificativa) {
      return NextResponse.json({ error: 'Informe a justificativa da rejeicao.' }, { status: 400 });
    }

    const item = await updateSolicitacao(id, {
      adminStatus: 'REJEITADA',
      status: 'REJEITADA_ADMIN',
      atendimentoModo: 'REJEITADO',
      adminExecutorId: user.id || '',
      adminExecutorNome: user.name || '',
      adminObservacao: justificativa,
      adminRejeicaoJustificativa: justificativa,
      finalizadoEm: new Date().toISOString(),
      finalizadoPorId: user.id || '',
      finalizadoPorNome: user.name || ''
    });
    return NextResponse.json(item);
  }

  if (action === 'ATENDER_ESTOQUE' || action === 'VINCULAR_COMPRA') {
    const deviceId = String(body.deviceId || '');
    const devices = await getAllDevices();
    const device = devices.find(item => String(item.id) === deviceId) as Record<string, unknown> | undefined;
    if (!device) {
      return NextResponse.json({ error: 'Equipamento não encontrado para atendimento.' }, { status: 404 });
    }

    if (!isTiStockDevice(device)) {
      return NextResponse.json({ error: 'Atendimento via estoque permite apenas equipamentos localizados no TI.' }, { status: 400 });
    }

    const movement = await createMovimentacao({
      deviceId,
      deviceNome: String(device.nome || device.hostname || ''),
      deviceTipo: String(device.tipo || ''),
      baseOrigemNome: String(device.baseNome || ''),
      baseDestinoNome: String(solicitacao.baseSolicitanteNome || ''),
      setorOrigemNome: String(device.setor || ''),
      setorDestinoNome: String(body.setorDestinoNome || ''),
      tipo: 'TRANSFERENCIA',
      observacao: `Atendimento da solicitação ${String(solicitacao._id || id)}`
    });

    const item = await updateSolicitacao(id, {
      adminStatus: 'CONCLUIDA',
      status: 'ATENDIDA',
      atendimentoModo: action === 'ATENDER_ESTOQUE' ? 'ESTOQUE' : 'COMPRA',
      equipamentoVinculadoId: deviceId,
      equipamentoVinculadoNome: String(device.nome || ''),
      movimentacaoId: String(movement._id || ''),
      adminExecutorId: user.id || '',
      adminExecutorNome: user.name || '',
      adminObservacao: String(body.observacao || '')
    });
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
