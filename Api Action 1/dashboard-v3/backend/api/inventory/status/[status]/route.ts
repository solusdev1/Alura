import { NextResponse } from 'next/server';
import { getDevicesByStatus } from '@/backend/db/devices';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ status: string }> }) {
  try {
    const { status } = await params;
    const devices = await getDevicesByStatus(status);
    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
