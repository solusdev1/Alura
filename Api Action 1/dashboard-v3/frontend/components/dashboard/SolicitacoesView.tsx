'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSolicitacao, getInventory, getSolicitacoes, updateSolicitacao } from '@/frontend/api/client';

type Solicitacao = Record<string, unknown>;
type Device = Record<string, unknown>;

const EMPTY_FORM = { tipoSolicitado: 'Celular', quantidade: 1, justificativa: '' };

function statusBadge(status: string) {
  if (status.includes('REJEITADA')) return 'bg-red-100 text-red-700';
  if (status.includes('ATENDIDA') || status.includes('CONCLUIDA')) return 'bg-green-100 text-green-700';
  if (status.includes('COMPRA')) return 'bg-amber-100 text-amber-700';
  if (status.includes('APROVADA')) return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-700';
}

export default function SolicitacoesView({ userRole, userBaseName }: { userRole: string; userBaseName: string }) {
  const [items, setItems] = useState<Solicitacao[]>([]);
  const [inventory, setInventory] = useState<Device[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [fulfillId, setFulfillId] = useState<string | null>(null);
  const [fulfillDeviceId, setFulfillDeviceId] = useState('');
  const [fulfillSetorDestino, setFulfillSetorDestino] = useState('Frota');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectJustificativa, setRejectJustificativa] = useState('');
  const isGestor = userRole === 'GESTOR_BASE';
  const isGerente = userRole === 'GERENTE';
  const isAdmin = userRole === 'ADMIN';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [solicitacoesData, inventoryData] = await Promise.all([
        getSolicitacoes(),
        isAdmin ? getInventory() : Promise.resolve([])
      ]);
      setItems(Array.isArray(solicitacoesData) ? solicitacoesData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (err) {
      setError((err as Error).message || 'Erro ao carregar solicitações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const eligibleDevices = useMemo(() => {
    const target = items.find(item => String(item._id) === fulfillId);
    const requestedType = String(target?.tipoSolicitado || '');
    return inventory.filter(device => {
      const deviceType = String(device.tipo || '');
      const status = String(device.status || '').toUpperCase();
      const base = String(device.baseNome || '').trim().toUpperCase();
      const setor = String(device.setor || '').trim().toUpperCase();
      const isTiStock = base === 'TI' || setor === 'TI';
      return deviceType === requestedType && isTiStock && !['BAIXADO', 'MANUTENCAO'].includes(status);
    });
  }, [inventory, items, fulfillId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createSolicitacao(form);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError((err as Error).message || 'Erro ao abrir solicitação.');
    } finally {
      setSaving(false);
    }
  }

  async function act(id: string, payload: Record<string, unknown>) {
    setActionLoading(id + String(payload.action || ''));
    setError('');
    try {
      await updateSolicitacao(id, payload);
      if (String(payload.action || '') === 'ATENDER_ESTOQUE' || String(payload.action || '') === 'VINCULAR_COMPRA') {
        setFulfillId(null);
        setFulfillDeviceId('');
      }
      if (String(payload.action || '') === 'REJEITAR_ADMIN') {
        setRejectId(null);
        setRejectJustificativa('');
      }
      await load();
    } catch (err) {
      setError((err as Error).message || 'Erro ao atualizar solicitação.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Abastecimento</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Solicitações de Equipamentos</h2>
        <p className="text-sm text-gray-500">
          {isGestor
            ? `Abra pedidos de Celular e Bip para a base ${userBaseName}.`
            : isGerente
              ? 'Aprove ou rejeite as solicitações abertas pelos gestores.'
              : isAdmin
                ? 'Atenda solicitações aprovadas via estoque existente ou fila de compra.'
                : 'Acompanhamento das solicitações do fluxo operacional.'}
        </p>
      </div>

      {isGestor ? (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nova solicitação</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo solicitado
              <select value={form.tipoSolicitado} onChange={e => setForm(prev => ({ ...prev, tipoSolicitado: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm">
                <option value="Celular">Celular</option>
                <option value="Bip">Bip</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantidade
              <input type="number" min="1" max="1" value={form.quantidade} onChange={e => setForm(prev => ({ ...prev, quantidade: Number(e.target.value || 1) }))} className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm" />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Base solicitante
              <input value={userBaseName} readOnly className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm" />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Justificativa
            <textarea rows={4} value={form.justificativa} onChange={e => setForm(prev => ({ ...prev, justificativa: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm" placeholder="Explique a necessidade operacional deste equipamento." required />
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-60">
              {saving ? 'Enviando...' : 'Solicitar Equipamento'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Fila de solicitações ({items.length})</h3>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando solicitações...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma solicitação encontrada para este perfil.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Tipo', 'Base', 'Solicitante', 'Justificativa', 'Status', 'Atendimento'].map(header => (
                    <th key={header} className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const id = String(item._id || '');
                  const status = String(item.status || 'ABERTA');
                  const canGerenteApprove = (isGerente || isAdmin) && status === 'ABERTA';
                  const canAdminPurchase = isAdmin && ['APROVADA_GERENTE', 'AGUARDANDO_COMPRA'].includes(status);
                  return (
                    <tr key={id} className="border-b border-gray-50 dark:border-gray-800 align-top">
                      <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">{String(item.tipoSolicitado || '-')}</td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{String(item.baseSolicitanteNome || '-')}</td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{String(item.solicitadoPorNome || '-')}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400 max-w-sm whitespace-pre-wrap">{String(item.justificativa || '-')}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${statusBadge(status)}`}>{status}</span>
                        <p className="mt-2 text-xs text-gray-500">Gerente: {String(item.gerenteStatus || 'PENDENTE')} / Admin: {String(item.adminStatus || 'PENDENTE')}</p>
                        {item.adminRejeicaoJustificativa ? (
                          <p className="mt-2 text-xs text-red-500">Justificativa: {String(item.adminRejeicaoJustificativa)}</p>
                        ) : null}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-2">
                          {canGerenteApprove ? (
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => void act(id, { action: 'APROVAR_GERENTE' })} disabled={actionLoading === `${id}APROVAR_GERENTE`} className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60">Aprovar gerente</button>
                              <button onClick={() => void act(id, { action: 'REJEITAR_GERENTE' })} disabled={actionLoading === `${id}REJEITAR_GERENTE`} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60">Rejeitar</button>
                            </div>
                          ) : null}

                          {canAdminPurchase ? (
                            <>
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => setFulfillId(prev => prev === id ? null : id)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">Atender via estoque</button>
                                <button onClick={() => void act(id, { action: 'MARCAR_COMPRA' })} disabled={actionLoading === `${id}MARCAR_COMPRA`} className="px-3 py-2 rounded-lg border border-amber-300 text-amber-700 text-xs font-semibold hover:bg-amber-50 disabled:opacity-60">Marcar compra</button>
                                <button onClick={() => setRejectId(prev => prev === id ? null : id)} className="px-3 py-2 rounded-lg border border-red-400 text-red-500 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30">Rejeitar</button>
                              </div>
                              {rejectId === id ? (
                                <div className="rounded-xl border border-red-200 dark:border-red-900 p-3 space-y-3">
                                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Justificativa da rejeicao
                                    <textarea rows={3} value={rejectJustificativa} onChange={e => setRejectJustificativa(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal font-normal" placeholder="Explique por que a solicitacao nao sera atendida." />
                                  </label>
                                  <button onClick={() => void act(id, { action: 'REJEITAR_ADMIN', justificativa: rejectJustificativa })} disabled={!rejectJustificativa.trim() || actionLoading === `${id}REJEITAR_ADMIN`} className="w-full px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60">
                                    Confirmar rejeicao
                                  </button>
                                </div>
                              ) : null}
                              {fulfillId === id ? (
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Equipamento disponível
                                    <select value={fulfillDeviceId} onChange={e => setFulfillDeviceId(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                                      <option value="">Selecione um item do estoque</option>
                                      {eligibleDevices.map(device => (
                                        <option key={String(device.id)} value={String(device.id)}>
                                          {String(device.nome || device.hostname || device.id)} - {String(device.baseNome || device.setor || 'Sem base')}
                                        </option>
                                      ))}
                                    </select>
                                    {eligibleDevices.length === 0 ? (
                                      <span className="mt-2 block text-xs normal-case tracking-normal font-normal text-amber-500">Nenhum item deste tipo disponivel no TI.</span>
                                    ) : null}
                                  </label>
                                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Setor de destino
                                    <select value={fulfillSetorDestino} onChange={e => setFulfillSetorDestino(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                                      <option value="Frota">Frota</option>
                                      <option value="Frete">Frete</option>
                                    </select>
                                  </label>
                                  <button onClick={() => void act(id, { action: status === 'AGUARDANDO_COMPRA' ? 'VINCULAR_COMPRA' : 'ATENDER_ESTOQUE', deviceId: fulfillDeviceId, setorDestinoNome: fulfillSetorDestino })} disabled={!fulfillDeviceId || actionLoading === `${id}${status === 'AGUARDANDO_COMPRA' ? 'VINCULAR_COMPRA' : 'ATENDER_ESTOQUE'}`} className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60">
                                    {status === 'AGUARDANDO_COMPRA' ? 'Vincular item comprado' : 'Confirmar atendimento'}
                                  </button>
                                </div>
                              ) : null}
                            </>
                          ) : null}

                          {status === 'ATENDIDA' ? (
                            <p className="text-xs text-emerald-600 font-semibold">
                              Equipamento: {String(item.equipamentoVinculadoNome || item.equipamentoVinculadoId || '-')}
                            </p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
