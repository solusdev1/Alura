import { NextResponse } from 'next/server';
import { getDb } from '@/backend/db/mongodb';

export const runtime = 'nodejs';

// Endpoint público chamado pelo script PowerShell collect-cached-data.ps1
// Não requer autenticação NextAuth - usa conexão direta ao MongoDB
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-display-secret'
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.SAVE_DISPLAY_NAME_SECRET || '';
    const providedSecret = request.headers.get('x-display-secret') || '';
    if (!expectedSecret) {
      return NextResponse.json({ success: false, error: 'SAVE_DISPLAY_NAME_SECRET nao configurado.' }, { status: 503, headers: CORS_HEADERS });
    }
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { deviceName, displayName, username, hostname, city, publicIP } = body;

    if (!deviceName && !hostname) {
      return NextResponse.json({ success: false, error: 'Campo obrigatório: deviceName ou hostname' }, { status: 400, headers: CORS_HEADERS });
    }
    if (!displayName) {
      return NextResponse.json({ success: false, error: 'Campo obrigatório: displayName' }, { status: 400, headers: CORS_HEADERS });
    }

    const db = await getDb();
    const collection = db.collection('devices');
    const searchName = hostname || String(deviceName).split('.')[0];

    const device = await collection.findOne({
      $or: [
        { nome: { $regex: searchName, $options: 'i' } },
        { dispositivo: { $regex: searchName, $options: 'i' } },
        { hostname: searchName }
      ]
    });

    if (!device) {
      return NextResponse.json({ success: false, error: `Dispositivo '${searchName}' não encontrado`, searchName }, { status: 404, headers: CORS_HEADERS });
    }

    const updateFields: Record<string, unknown> = { adDisplayName: displayName, updatedAt: new Date() };
    if (city) updateFields.city = city;
    if (publicIP) updateFields.lastPublicIP = publicIP;

    const result = await collection.updateOne({ _id: device._id }, { $set: updateFields });

    return NextResponse.json({
      success: true,
      deviceName: device.nome,
      displayName,
      city: city || device.city || 'N/A',
      modified: result.modifiedCount > 0
    }, { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500, headers: CORS_HEADERS });
  }
}
