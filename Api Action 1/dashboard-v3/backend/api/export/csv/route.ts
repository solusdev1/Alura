import { NextResponse } from 'next/server';
import { getAllDevices, Device } from '@/backend/db/devices';

export const runtime = 'nodejs';

const CSV_FIELDS: Array<{ key: keyof Device | string; label: string }> = [
  { key: 'nome', label: 'Nome' },
  { key: 'adDisplayName', label: 'Display Name' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'usuario', label: 'Usuário' },
  { key: 'email', label: 'Email' },
  { key: 'setor', label: 'Setor' },
  { key: 'city', label: 'Cidade' },
  { key: 'status', label: 'Status' },
  { key: 'organizacao', label: 'Organização' },
  { key: 'ip', label: 'IP' },
  { key: 'mac', label: 'MAC' },
  { key: 'so', label: 'Sistema Operacional' },
  { key: 'fabricante', label: 'Fabricante' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'serial', label: 'Serial' },
  { key: 'memoria', label: 'Memória' },
  { key: 'disco', label: 'Disco' },
  { key: 'cpu', label: 'CPU' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'gerenciado', label: 'Gerenciado' },
  { key: 'last_seen', label: 'Último Acesso' },
  { key: 'responsavelAtualNome', label: 'Responsável' },
  { key: 'responsavelAtualDocumento', label: 'CPF/CNPJ Responsável' },
];

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    const devices = await getAllDevices();
    const header = CSV_FIELDS.map(f => escapeCsv(f.label)).join(',');
    const rows = devices.map(device =>
      CSV_FIELDS.map(f => escapeCsv((device as Record<string, unknown>)[f.key])).join(',')
    );
    // BOM UTF-8 para compatibilidade com Excel
    const csv = 'ï»¿' + [header, ...rows].join('\r\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventario_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
