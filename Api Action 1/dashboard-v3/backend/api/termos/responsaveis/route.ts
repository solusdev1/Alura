import { NextResponse } from 'next/server';
import { listResponsaveis } from '@/backend/db/termos';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get('q') || '').slice(0, 80);
    const responsaveis = await listResponsaveis(q);
    return NextResponse.json(responsaveis);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
