import { NextResponse } from 'next/server';
import { listTerms } from '@/backend/db/termos';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get('q') || '').slice(0, 80);
    const terms = await listTerms({ search });
    return NextResponse.json(terms);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
