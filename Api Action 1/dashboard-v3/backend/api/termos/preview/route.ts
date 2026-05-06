import { NextResponse } from 'next/server';
import { previewTermo } from '@/backend/termos/service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const preview = await previewTermo(payload);
    return NextResponse.json(preview);
  } catch (error) {
    const message = (error as Error).message || 'Erro na prévia';
    const status = ['INVALID_EQUIPMENT_SET', 'TERM_DEVICES_NOT_FOUND', 'INVALID_RESPONSIBLE'].includes(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
