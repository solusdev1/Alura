export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { createBase, getBasesWithStats } from '@/backend/db/bases';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const bases = await getBasesWithStats();
    return NextResponse.json(bases);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Erro ao carregar bases.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role: string }).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { nome, codigo, tipo } = await request.json();
    if (!nome || !codigo || !tipo) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const base = await createBase({
      nome: String(nome).trim(),
      codigo: String(codigo).trim().toUpperCase(),
      tipo: String(tipo).trim().toUpperCase()
    });
    return NextResponse.json(base, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Erro ao salvar base.' }, { status: 500 });
  }
}
