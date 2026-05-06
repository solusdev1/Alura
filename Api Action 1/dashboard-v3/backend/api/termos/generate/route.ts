import { NextResponse } from 'next/server';
import { generateTermo } from '@/backend/termos/service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await generateTermo(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = (error as Error).message || 'Erro ao gerar termo';
    const status = ['INVALID_EQUIPMENT_SET', 'TERM_DEVICES_NOT_FOUND', 'INVALID_RESPONSIBLE', 'INVALID_RESPONSIBLE_DOCUMENT'].includes(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
