import { NextResponse } from 'next/server';
import { getTermById } from '@/backend/db/termos';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const term = await getTermById(id) as Record<string, unknown> | null;
    if (!term) return NextResponse.json({ error: 'Termo não encontrado' }, { status: 404 });

    const documentBase64 = String(term.documentBase64 || '').trim();
    if (!documentBase64) return NextResponse.json({ error: 'Documento não disponível' }, { status: 404 });

    const buffer = Buffer.from(documentBase64, 'base64');
    const fileName = String(term.fileName || 'Termo.docx');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(buffer.length)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
