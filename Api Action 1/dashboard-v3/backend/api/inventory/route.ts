import { NextResponse } from 'next/server';
import { auth } from '@/backend/auth';
import { getAllDevices, createDevice, clearInventory } from '@/backend/db/devices';

export const runtime = 'nodejs';

type SessionUser = { role: string; baseName: string | null };

function getDeviceBase(device: Record<string, unknown>) {
  return String(device.baseNome || device.setor || '');
}

function getScopedPayload(user: SessionUser, payload: Record<string, unknown>) {
  if (user.role !== 'GESTOR_BASE' || !user.baseName) return payload;

  const setor = String(payload.setor || '').trim();
  const tipo = String(payload.tipo || '').trim();
  if (setor && !['Frota', 'Frete'].includes(setor)) {
    throw new Error('Gestor de base pode cadastrar apenas nos setores Frota ou Frete.');
  }
  if (tipo && !['Bip', 'Celular'].includes(tipo)) {
    throw new Error('Gestor de base pode cadastrar apenas Bip e Celular.');
  }

  return {
    ...payload,
    baseNome: user.baseName
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session?.user as SessionUser;
    const devices = await getAllDevices();
    const filtered = user.role === 'MANUTENCAO'
      ? devices.filter(device => String((device as Record<string, unknown>).baseNome || '') === 'MANUTENCAO' || String((device as Record<string, unknown>).status || '').toUpperCase() === 'MANUTENCAO')
      : user.role === 'GESTOR_BASE' && user.baseName
        ? devices.filter(device => getDeviceBase(device as Record<string, unknown>) === user.baseName)
        : devices;
    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session?.user as SessionUser;
    if (user.role === 'MANUTENCAO') {
      return NextResponse.json({ error: 'Usuário de manutenção não pode cadastrar equipamentos manualmente.' }, { status: 403 });
    }
    const payload = await request.json();
    const scopedPayload = getScopedPayload(user, payload);
    const device = await createDevice(scopedPayload);
    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    const message = (error as Error).message || 'Erro ao criar dispositivo';
    const status = message.toLowerCase().includes('obrigatorio') || message.includes('Frota ou Frete') || message.includes('Bip e Celular') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session?.user as SessionUser;
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await clearInventory();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
