import { NextResponse } from 'next/server';
import { getSyncMetadata, getStats } from '@/backend/db/devices';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [metadata, stats] = await Promise.all([getSyncMetadata(), getStats()]);
    return NextResponse.json({ status: 'ok', metadata, stats });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: (error as Error).message }, { status: 500 });
  }
}
