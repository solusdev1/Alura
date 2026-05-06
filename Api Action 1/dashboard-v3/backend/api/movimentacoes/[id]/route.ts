export const runtime = 'nodejs';

import { ObjectId } from 'mongodb';
import { auth } from '@/backend/auth';
import { getDb } from '@/backend/db/mongodb';
import { resolverMovimentacao } from '@/backend/db/movimentacoes';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session?.user as { id: string; name: string; role: string; baseName: string | null };
  const { id } = await params;
  const { action, observacao } = await request.json();

  if (!['APROVADA', 'REJEITADA'].includes(action)) {
    return NextResponse.json({ error: 'Acao invalida.' }, { status: 400 });
  }

  const db = await getDb();
  const movement = await db.collection('movimentacoes').findOne({ _id: new ObjectId(id) }) as Record<string, unknown> | null;

  if (!movement) {
    return NextResponse.json({ error: 'Movimentacao nao encontrada.' }, { status: 404 });
  }

  const tipo = String(movement.tipo || '').toUpperCase();
  const destino = String(movement.baseDestinoNome || '');

  if (user.role === 'GESTOR_BASE' && user.baseName) {
    if (destino !== user.baseName || !['TRANSFERENCIA', 'RETORNO_MANUTENCAO'].includes(tipo)) {
      return NextResponse.json({ error: 'Gestor de base so pode aprovar transferencias ou retornos destinados a propria base.' }, { status: 403 });
    }
  }

  if (user.role === 'MANUTENCAO') {
    if (destino !== 'MANUTENCAO' || tipo !== 'MANUTENCAO') {
      return NextResponse.json({ error: 'Manutenção só pode aceitar equipamentos destinados a fila de manutenção.' }, { status: 403 });
    }
  }

  try {
    const updated = await resolverMovimentacao(id, action as 'APROVADA' | 'REJEITADA', user.id || '', user.name || '', observacao);
    return NextResponse.json(updated);
  } catch (error) {
    const message = String((error as Error).message || '');
    const status = message === 'MOVIMENTACAO_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? 'Movimentacao nao encontrada.' : message || 'Erro interno.' }, { status });
  }
}
