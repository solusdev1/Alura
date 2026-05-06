export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { listUsers, createUser } from '@/backend/db/users-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role: string }).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const users = await listUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Erro ao carregar usuários.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role: string }).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { name, email, password, role, baseId, baseName } = await request.json();
    if (!name || !email || !password || !role) return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    const user = await createUser({ name, email, password, role, baseId, baseName });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Erro ao salvar usuário.' }, { status: 500 });
  }
}
