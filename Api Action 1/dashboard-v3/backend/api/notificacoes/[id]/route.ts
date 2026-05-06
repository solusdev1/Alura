export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { markNotificacaoLida } from '@/backend/db/notificacoes';
import { NextResponse } from 'next/server';

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const item = await markNotificacaoLida(id);
  return NextResponse.json(item);
}
