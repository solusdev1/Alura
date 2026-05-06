'use client';

import { useEffect, useState } from 'react';

type ReportData = {
  total: number;
  action1: number;
  manual: number;
  byTipo: Record<string, number>;
  byStatus: Record<string, number>;
  byBase: { nome: string; action1: number; manual: number; total: number }[];
};

export default function RelatoriosView() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/relatorios').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Carregando relatórios...</div>;
  if (!data) return <div className="p-6 text-red-500">Erro ao carregar dados.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatórios de estoque</h2>
        <p className="text-sm text-gray-500">Visão consolidada por tipo, origem e status operacional.</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total geral" value={data.total} accent="border-l-4 border-gray-900" />
        <StatCard label="Sincronizados Action1" value={data.action1} accent="border-l-4 border-blue-500" />
        <StatCard label="Ativos manuais" value={data.manual} accent="border-l-4 border-purple-500" />
      </div>

      {/* By type + By status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Distribuição por tipo</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.byTipo).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => (
              <div key={tipo} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{tipo}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Status operacional</h3>
          <div className="space-y-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{formatStatus(status)}</span>
                <span className={`text-sm font-bold ${statusColor(status)}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By base */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Distribuição por base</h3>
        <p className="text-xs text-gray-500 mb-4">Totais por origem e quantidade consolidada.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['BASE', 'ACTION1', 'MANUAL', 'TOTAL'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.byBase.map(row => (
                <tr key={row.nome} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-gray-100">{row.nome}</td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{row.action1}</td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{row.manual}</td>
                  <td className="py-2.5 px-3 font-bold text-blue-600">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 ${accent}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function formatStatus(s: string) {
  const map: Record<string, string> = {
    ATIVO: 'Ativos na base', ONLINE: 'Online', OFFLINE: 'Offline',
    MANUTENCAO: 'Em manutenção', TRANSITO: 'Em trânsito', BAIXADO: 'Baixados',
  };
  return map[s.toUpperCase()] || s;
}

function statusColor(s: string) {
  const up = s.toUpperCase();
  if (['ATIVO', 'ONLINE'].includes(up)) return 'text-green-600';
  if (['MANUTENCAO'].includes(up)) return 'text-orange-500';
  if (['BAIXADO'].includes(up)) return 'text-red-500';
  if (['TRANSITO'].includes(up)) return 'text-purple-500';
  return 'text-gray-600';
}
