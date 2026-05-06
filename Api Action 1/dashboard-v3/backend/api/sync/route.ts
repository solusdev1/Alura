import { NextResponse } from 'next/server';
import { auth } from '@/backend/auth';
import { runInventorySync } from '@/backend/action1/sync';
import { acquireSyncLock, releaseSyncLock } from '@/backend/db/devices';

export const runtime = 'nodejs';

async function isAuthorizedManualSync(request: Request) {
  const syncSecret = request.headers.get('x-sync-secret') || '';
  const manualSecret = process.env.SYNC_SECRET || '';
  if (manualSecret && syncSecret === manualSecret) return true;

  const session = await auth();
  const role = String((session?.user as { role?: string } | undefined)?.role || '');
  return role === 'ADMIN' || role === 'GERENTE';
}

async function handleSync(request: Request, source: 'cron' | 'manual') {
  // Vercel Cron: header Authorization: Bearer <CRON_SECRET>
  const authorization = request.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET || '';

  const isCron = cronSecret && authorization === `Bearer ${cronSecret}`;
  const isManual = source === 'manual' && await isAuthorizedManualSync(request);

  if (source === 'cron' && !isCron) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  if (source === 'manual' && !isManual) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  const owner = isCron ? 'vercel-cron' : 'manual';
  const token = await acquireSyncLock({ owner, ttlMs: 5 * 60 * 1000 });
  if (!token) {
    return NextResponse.json({ error: 'Sincronização já em andamento' }, { status: 409 });
  }

  try {
    const result = await runInventorySync();
    return NextResponse.json({ success: true, stats: result.stats });
  } catch (error) {
    const message = (error as Error).message || 'Erro desconhecido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  } finally {
    await releaseSyncLock(token);
  }
}

export async function POST(request: Request) {
  return handleSync(request, 'manual');
}

export async function GET(request: Request) {
  return handleSync(request, 'cron');
}
