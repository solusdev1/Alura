export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { createSolicitacao, listSolicitacoes } from '@/backend/db/solicitacoes';
import { NextResponse } from 'next/server';

type SessionUser = { id: string; name: string; role: string; baseName: string | null };

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session?.user as SessionUser;

  const filter: Record<string, unknown> = {};
  if (user.role === 'GESTOR_BASE' && user.baseName) {
    filter.baseSolicitanteNome = user.baseName;
  } else if (user.role === 'MANUTENCAO') {
    return NextResponse.json([]);
  }

  const items = await listSolicitacoes(filter);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session?.user as SessionUser;
  if (user.role !== 'GESTOR_BASE' || !user.baseName) {
    return NextResponse.json({ error: 'Apenas gestor de base pode abrir solicitações.' }, { status: 403 });
  }

  const body = await request.json();
  const tipo = String(body.tipoSolicitado || '').trim();
  const quantidade = Number(body.quantidade || 1);
  if (!['Celular', 'Bip'].includes(tipo)) {
    return NextResponse.json({ error: 'Somente Celular e Bip podem ser solicitados.' }, { status: 400 });
  }
  if (quantidade !== 1) {
    return NextResponse.json({ error: 'Nesta primeira versão, cada solicitação atende apenas 1 item.' }, { status: 400 });
  }

  const item = await createSolicitacao({
    tipoSolicitado: tipo,
    quantidade,
    justificativa: String(body.justificativa || '').trim(),
    baseSolicitanteNome: user.baseName,
    solicitadoPorId: user.id || '',
    solicitadoPorNome: user.name || ''
  });
  return NextResponse.json(item, { status: 201 });
}
