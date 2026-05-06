import { NextResponse } from 'next/server';
import { sendTermoEmail } from '@/backend/termos/service';

export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await sendTermoEmail(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = (error as Error).message || 'Erro ao enviar email';
    const status = message === 'TERM_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
