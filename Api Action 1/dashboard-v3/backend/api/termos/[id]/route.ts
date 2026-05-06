import { NextResponse } from 'next/server';
import { getTermById } from '@/backend/db/termos';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const term = await getTermById(id);
    if (!term) return NextResponse.json({ error: 'Termo não encontrado' }, { status: 404 });
    // Não retornar o base64 completo na listagem - apenas metadata
    const { documentBase64: _, ...meta } = term as Record<string, unknown> & { documentBase64: unknown };
    return NextResponse.json(meta);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
