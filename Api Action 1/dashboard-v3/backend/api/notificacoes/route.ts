export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { listNotificacoes } from '@/backend/db/notificacoes';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session?.user as { role: string; baseName: string | null };
  const filter: Record<string, unknown> = {};

  if (user.role === 'GESTOR_BASE' && user.baseName) {
    filter.baseDestinoNome = user.baseName;
  } else if (user.role === 'MANUTENCAO') {
    return NextResponse.json([]);
  }

  const items = await listNotificacoes(filter);
  return NextResponse.json(items);
}
