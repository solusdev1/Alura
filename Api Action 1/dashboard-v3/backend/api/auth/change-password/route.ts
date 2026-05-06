export const runtime = 'nodejs';

import { auth } from '@/backend/auth';
import { getDb } from '@/backend/db/mongodb';
import { compare, hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
  }
  if (String(newPassword).length < 6) {
    return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection('users').findOne({ email: session.user.email, isActive: true });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const match = await compare(String(currentPassword), String(user.passwordHash));
  if (!match) return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });

  const newHash = await hash(String(newPassword), 12);
  await db.collection('users').updateOne(
    { email: session.user.email },
    { $set: { passwordHash: newHash, mustChangePassword: false } }
  );

  return NextResponse.json({ ok: true });
}
