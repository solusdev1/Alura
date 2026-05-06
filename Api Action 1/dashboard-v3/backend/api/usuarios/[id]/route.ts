export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { updateUser } from '@/backend/db/users-admin';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role: string }).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const updated = await updateUser(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}
