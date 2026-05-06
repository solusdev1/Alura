'use client';

import { useEffect, useMemo, useState } from 'react';
import { generateTermo, previewTermo, searchTermResponsaveis, sendTermoEmail } from '@/frontend/api/client';

type Device = Record<string, unknown>;
type Responsavel = { nome: string; documento: string; cargo: string };

const EMPTY_RESPONSAVEL: Responsavel = { nome: '', documento: '', cargo: 'Colaborador' };

export default function GerarTermoModal({ open, onClose, devices, onGenerated }: {
  open: boolean;
  onClose: () => void;
  devices: Device[];
  onGenerated: (data: Record<string, unknown>) => void;
}) {
  const [tipoTemplate, setTipoTemplate] = useState('CLT');
  const [responsavel, setResponsavel] = useState<Responsavel>(EMPTY_RESPONSAVEL);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Record<string, unknown>[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingSendEmail, setLoadingSendEmail] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [submitResult, setSubmitResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTipoTemplate('CLT');
    setResponsavel(EMPTY_RESPONSAVEL);
    setSearch('');
    setSuggestions([]);
    setPreview(null);
    setSubmitResult(null);
    setError('');
  }, [open]);

  useEffect(() => {
    if (!open || search.trim().length < 2) { setSuggestions([]); return; }
    let active = true;
    setLoadingSuggestions(true);
    searchTermResponsaveis(search)
      .then(items => { if (active) setSuggestions(Array.isArray(items) ? items : []); })
      .catch(() => { if (active) setSuggestions([]); })
      .finally(() => { if (active) setLoadingSuggestions(false); });
    return () => { active = false; };
  }, [open, search]);

  const conflitos = useMemo(() =>
    devices.filter(d => {
      const atual = String(d.responsavelAtualNome || '').trim();
      return atual && atual.toLowerCase() !== String(responsavel.nome || '').trim().toLowerCase();
    }),
    [devices, responsavel.nome]
  );

  if (!open) return null;

  const buildPayload = () => ({
    tipoTemplate,
    responsavel,
    deviceIds: devices.map(d => String(d.id)),
    metadata: { tipoTemplate }
  });

  const handlePreview = async () => {
    setError(''); setSubmitResult(null); setLoadingPreview(true);
    try {
      const result = await previewTermo(buildPayload());
      setPreview(result || null);
    } catch (err) {
      setError((err as Error).message || 'Erro ao montar pré-visualização');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitResult(null); setLoadingSubmit(true);
    try {
      const data = await generateTermo(buildPayload()) as Record<string, unknown>;
      if (data.downloadUrl) window.open(String(data.downloadUrl), '_blank', 'noopener,noreferrer');
      setSubmitResult(data);
      onGenerated?.(data);
    } catch (err) {
      setError((err as Error).message || 'Erro ao gerar termo');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleSendEmail = async () => {
    if (!submitResult?.termId) return;
    setError(''); setLoadingSendEmail(true);
    try {
      const emailData = await sendTermoEmail(String(submitResult.termId)) as Record<string, unknown>;
      setSubmitResult(prev => ({ ...(prev || {}), ...emailData, downloadUrl: prev?.downloadUrl, fileName: prev?.fileName, termId: prev?.termId || emailData.termId }));
    } catch (err) {
      setError((err as Error).message || 'Erro ao enviar email');
    } finally {
      setLoadingSendEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Gerar Termo de Responsabilidade</h3>
          <p className="text-sm text-gray-500">{devices.length} equipamento(s) selecionado(s)</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Template
            <select value={tipoTemplate} onChange={e => setTipoTemplate(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Buscar responsável já cadastrado
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Digite nome ou documento" className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </label>

          {loadingSuggestions && <p className="text-sm text-gray-500">Buscando...</p>}
          {!loadingSuggestions && suggestions.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
              {suggestions.map((item, i) => (
                <button key={String(item._id || i)} type="button" onClick={() => { setResponsavel({ nome: String(item.nome || ''), documento: String(item.documento || ''), cargo: String(item.cargo || 'Colaborador') }); setSearch(String(item.nome || '')); setSuggestions([]); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <strong className="block text-sm text-gray-900 dark:text-gray-100">{String(item.nome)}</strong>
                  <span className="text-xs text-gray-500">{String(item.documento)} ? {String(item.cargo)}</span>
                </button>
              ))}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome do responsável *
            <input value={responsavel.nome} onChange={e => setResponsavel(p => ({ ...p, nome: e.target.value }))} required className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            CPF ou CNPJ *
            <input value={responsavel.documento} onChange={e => setResponsavel(p => ({ ...p, documento: e.target.value }))} required className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cargo
            <input value={responsavel.cargo} onChange={e => setResponsavel(p => ({ ...p, cargo: e.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </label>
        </div>

        {conflitos.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Atenção:</strong> {conflitos.length} item(ns) já vinculado(s) a outro responsável.
          </div>
        )}

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700 max-h-40 overflow-y-auto">
          {devices.map(d => (
            <div key={String(d.id)} className="px-3 py-2">
              <strong className="text-sm text-gray-900 dark:text-gray-100">{String(d.tipo || 'Equipamento')}</strong>
              <span className="block text-xs text-gray-500">{String(d.nome || d.id)}</span>
              <small className="text-xs text-gray-400">{String(d.responsavelAtualNome || d.adDisplayName || d.usuario || 'Sem responsável')}</small>
            </div>
          ))}
        </div>

        {preview && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 text-sm space-y-1">
            <strong className="text-blue-800 dark:text-blue-200">Prévia</strong>
            <p className="text-blue-700 dark:text-blue-300">Arquivo: {String((preview as Record<string, unknown>).fileName || '-')}</p>
            <p className="text-blue-700 dark:text-blue-300">Itens: {String((preview as Record<string, Record<string, unknown>>).context.totalItens || devices.length)}</p>
          </div>
        )}

        {submitResult && (
          <div className={`rounded-lg px-3 py-2 text-sm space-y-1 ${Boolean(submitResult.emailRequested) && !Boolean(submitResult.emailSent) ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 text-yellow-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-800'}`}>
            <strong>Termo gerado com sucesso!</strong>
            {Boolean(submitResult.emailSent) && <p>Email enviado para {String(submitResult.emailRecipient || 'destinatário configurado')}.</p>}
            {Boolean(submitResult.emailRequested) && !Boolean(submitResult.emailSent) && <p>Falha ao enviar email. {String(submitResult.emailError || '')}</p>}
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            {submitResult ? 'Fechar' : 'Cancelar'}
          </button>
          <button type="button" onClick={handlePreview} disabled={loadingPreview || loadingSubmit} className="px-4 py-2 rounded-lg border border-blue-300 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50">
            {loadingPreview ? 'Montando...' : 'Prévia'}
          </button>
          {Boolean(submitResult?.downloadUrl) && (
            <button type="button" onClick={() => window.open(String(submitResult!.downloadUrl), '_blank')} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
              Baixar
            </button>
          )}
          {Boolean(submitResult?.termId) && (
            <button type="button" onClick={handleSendEmail} disabled={loadingSendEmail} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {loadingSendEmail ? 'Enviando...' : Boolean(submitResult!.emailSent) ? 'Reenviar email' : 'Enviar por email'}
            </button>
          )}
          <button type="submit" disabled={loadingSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 disabled:opacity-50 ml-auto">
            {loadingSubmit ? 'Gerando...' : 'Gerar Termo'}
          </button>
        </div>
      </form>
    </div>
  );
}
