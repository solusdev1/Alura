'use client';

import { useEffect, useState } from 'react';
import { createMovimentacao, getMovimentacoes, resolverMovimentacao } from '@/frontend/api/client';

type Mov = Record<string, unknown>;

export default function MovimentacoesView({ isAdmin, userRole, userBaseName }: { isAdmin: boolean; userRole: string; userBaseName: string }) {
  const [pendentes, setPendentes] = useState<Mov[]>([]);
  const [historico, setHistorico] = useState<Mov[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ deviceNome: '', deviceTipo: '', baseOrigemNome: '', baseDestinoNome: '', tipo: 'TRANSFERENCIA', observacao: '' });
  const [submitting, setSubmitting] = useState(false);
  const isGestorBase = userRole === 'GESTOR_BASE';

  useEffect(() => {
    if (!isGestorBase || !userBaseName) return;
    setForm(prev => ({ ...prev, baseOrigemNome: userBaseName }));
  }, [isGestorBase, userBaseName]);

  async function load() {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        getMovimentacoes({ tipo: 'pendentes' }),
        getMovimentacoes(),
      ]);
      setPendentes(Array.isArray(pRes) ? pRes : []);
      setHistorico(Array.isArray(hRes) ? hRes : []);
      setError('');
    } catch { setError('Erro ao carregar movimentações.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function resolver(id: string, action: 'APROVADA' | 'REJEITADA') {
    setActionLoading(id + action);
    try {
      await resolverMovimentacao(id, action);
      await load();
    } catch { setError('Erro ao resolver movimentação.'); }
    finally { setActionLoading(null); }
  }

  async function criarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createMovimentacao(form);
      setShowForm(false);
      setForm({ deviceNome: '', deviceTipo: '', baseOrigemNome: '', baseDestinoNome: '', tipo: 'TRANSFERENCIA', observacao: '' });
      await load();
    } catch { setError('Erro ao criar movimentação.'); }
    finally { setSubmitting(false); }
  }

  const fmtDate = (s: unknown) => s ? new Date(String(s)).toLocaleDateString('pt-BR') : '-';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Movimentações</h2>
          <p className="text-sm text-gray-500">Aprovações pendentes e histórico de transferências.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          + Nova movimentação
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={criarMovimentacao} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <h3 className="sm:col-span-2 font-semibold text-gray-900 dark:text-gray-100">Nova Movimentação</h3>
          {[
            { label: 'Equipamento', key: 'deviceNome' },
            { label: 'Tipo de Equipamento', key: 'deviceTipo' },
            { label: 'Base de Origem', key: 'baseOrigemNome' },
            { label: 'Base de Destino', key: 'baseDestinoNome' },
          ].map(({ label, key }) => (
            <label key={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
              <input value={String(form[key as keyof typeof form])} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required
                readOnly={key === 'baseOrigemNome' && isGestorBase}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm" />
            </label>
          ))}
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm">
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Observação
            <input value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm" />
          </label>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm rounded-lg">Cancelar</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50">
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* Pendentes */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-yellow-500">!</span>
          <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
            Aguardando sua Aprovação ({pendentes.length})
          </h3>
        </div>
        {loading ? <p className="text-sm text-gray-400">Carregando...</p> : pendentes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma transferência pendente para sua base.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Data', 'Equipamento', 'Tipo', 'Origem → Destino', 'Solicitado por', 'Ação'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendentes.map(m => (
                  <tr key={String(m._id)} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2.5 px-3 text-gray-500">{fmtDate(m.dataAbertura)}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-gray-100">{String(m.deviceNome || '-')}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{String(m.tipo || '-')}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{String(m.baseOrigemNome || '-')} → {String(m.baseDestinoNome || '-')}</td>
                    <td className="py-2.5 px-3 text-gray-500">{String(m.solicitadoPorNome || '-')}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => resolver(String(m._id), 'APROVADA')} disabled={actionLoading === String(m._id) + 'APROVADA'}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
                          Aprovar
                        </button>
                        <button onClick={() => resolver(String(m._id), 'REJEITADA')} disabled={actionLoading === String(m._id) + 'REJEITADA'}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50">
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Histórico de Movimentações</h3>
        <p className="text-xs text-gray-500 mb-4">Últimos 50 registros envolvendo suas bases.</p>
        {loading ? <p className="text-sm text-gray-400">Carregando...</p> : historico.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum histórico encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Data', 'Equipamento', 'Tipo / Status', 'Origem → Destino', 'Resolvido por'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map(m => (
                  <tr key={String(m._id)} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2.5 px-3 text-gray-500">{fmtDate(m.dataAbertura)}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-gray-100">{String(m.deviceNome || '-')}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-gray-600 dark:text-gray-400">{String(m.tipo || '-')} / </span>
                      <StatusBadge status={String(m.status)} />
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{String(m.baseOrigemNome || '-')} → {String(m.baseDestinoNome || '-')}</td>
                    <td className="py-2.5 px-3 text-gray-500">{String(m.resolvidoPorNome || '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    APROVADA: 'bg-green-100 text-green-800',
    REJEITADA: 'bg-red-100 text-red-800',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}
