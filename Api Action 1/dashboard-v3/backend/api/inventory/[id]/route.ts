import { NextResponse } from 'next/server';
import { auth } from '@/backend/auth';
import { getAllDevices, updateDeviceById } from '@/backend/db/devices';

export const runtime = 'nodejs';

type SessionUser = { role: string; baseName: string | null };

function getDeviceBase(device: Record<string, unknown>) {
  return String(device.baseNome || device.setor || '');
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session?.user as SessionUser;
    const { id } = await params;
    const devices = await getAllDevices();
    const device = devices.find(item => String(item.id) === String(id)) as Record<string, unknown> | undefined;

    if (!device) {
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }

    if (user.role === 'GESTOR_BASE' && user.baseName && getDeviceBase(device) !== user.baseName) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'MANUTENCAO' && getDeviceBase(device) !== 'MANUTENCAO' && String(device.status || '').toUpperCase() !== 'MANUTENCAO') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await request.json();
    let scopedUpdates = updates;
    if (user.role === 'GESTOR_BASE' && user.baseName) {
      const setor = String(updates.setor || '').trim();
      if (setor && !['Frota', 'Frete'].includes(setor)) {
        return NextResponse.json({ error: 'Gestor de base pode editar apenas os setores Frota ou Frete.' }, { status: 400 });
      }
      scopedUpdates = { ...updates, baseNome: user.baseName };
    } else if (user.role === 'MANUTENCAO') {
      scopedUpdates = {
        diagnosticoManutencao: updates.diagnosticoManutencao,
        resultadoManutencao: updates.resultadoManutencao,
        observacoesIniciais: updates.observacoesIniciais,
        descricao: updates.descricao
      };
    }

    const result = await updateDeviceById(id, scopedUpdates);
    if (!result.matchedCount) {
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }
    return NextResponse.json(result.device ?? { success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
