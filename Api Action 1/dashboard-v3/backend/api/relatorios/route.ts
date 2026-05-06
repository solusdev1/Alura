export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { getDb } from '@/backend/db/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session?.user as { role: string; baseName: string | null };
  const isScoped = user.role === 'GESTOR_BASE' && user.baseName;
  const isMaintenance = user.role === 'MANUTENCAO';

  const db = await getDb();
  const baseFilter: Record<string, unknown> = isMaintenance
     ? { $or: [{ baseNome: 'MANUTENCAO' }, { status: { $in: ['MANUTENCAO', 'Manutenção', 'MANUTENÇÃO'] } }] }
    : isScoped ? { baseNome: user.baseName } : {};

  const allDevices = await db.collection('devices').find(baseFilter).toArray();
  const total = allDevices.length;
  const action1Count = allDevices.filter(d => d.fonte === 'action1' || d.action1Id).length;
  const manual = total - action1Count;

  const byTipo: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byBase: Record<string, { action1: number; manual: number; total: number }> = {};

  for (const d of allDevices) {
    const tipo = String(d.tipo || 'OUTROS').toUpperCase();
    byTipo[tipo] = (byTipo[tipo] || 0) + 1;

    const status = String(d.status || 'ATIVO').toUpperCase();
    byStatus[status] = (byStatus[status] || 0) + 1;

    const base = String(d.baseNome || d.setor || 'SEM BASE');
    if (!byBase[base]) byBase[base] = { action1: 0, manual: 0, total: 0 };
    byBase[base].total++;
    if (d.fonte === 'action1' || d.action1Id) byBase[base].action1++;
    else byBase[base].manual++;
  }

  const byBaseArray = Object.entries(byBase)
    .map(([nome, counts]) => ({ nome, ...counts }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({ total, action1: action1Count, manual, byTipo, byStatus, byBase: byBaseArray });
}
