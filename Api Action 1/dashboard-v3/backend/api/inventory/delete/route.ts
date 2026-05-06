import { NextResponse } from 'next/server';
import { deleteDevicesByIds } from '@/backend/db/devices';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids obrigatório' }, { status: 400 });
    }
    if (ids.length > 200) {
      return NextResponse.json({ error: 'Máximo de 200 ids por requisição' }, { status: 400 });
    }
    const result = await deleteDevicesByIds(ids);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
