'use client';

import { useEffect, useState } from 'react';

type BaseRow = {
  _id: string;
  codigo: string;
  nome: string;
  tipo: string;
  isActive: boolean;
  totalEquipamentos: number;
  totalGestores: number;
};

const EMPTY_FORM = { nome: '', codigo: '', tipo: 'OPERACIONAL' };

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Resposta inválida do servidor.' };
  }
}

export default function AdminBasesManager() {
  const [bases, setBases] = useState<BaseRow[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/bases');
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error((data as { error: string }).error || 'Erro ao carregar bases.');
      setBases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar bases.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startEdit(base: BaseRow) {
    setEditingId(base._id);
    setForm({ nome: base.nome, codigo: base.codigo, tipo: base.tipo });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        nome: form.nome.trim(),
        codigo: form.codigo.trim().toUpperCase(),
        tipo: form.tipo
      };
      const response = await fetch(editingId ? `/api/bases/${editingId}` : '/api/bases', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error((data as { error: string }).error || 'Erro ao salvar base.');
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar base.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleBase(base: BaseRow) {
    setError('');
    try {
      const response = await fetch(`/api/bases/${base._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !base.isActive })
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error((data as { error: string }).error || 'Erro ao atualizar base.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar base.');
    }
  }

  async function deleteBase(base: BaseRow) {
    if (!window.confirm(`Excluir a base "${base.nome}" Esta ação não poderá ser desfeita.`)) return;
    setError('');
    try {
      const response = await fetch(`/api/bases/${base._id}`, { method: 'DELETE' });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error((data as { error: string }).error || 'Erro ao excluir base.');
      if (editingId === base._id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir base.');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administração</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestão de Bases</h2>
        <p className="text-sm text-gray-500">Crie, edite, inative ou exclua bases operacionais e a matriz do sistema.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{editingId ? 'Editar Base' : 'Adicionar Nova Base'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 lg:col-span-1">
              Nome da Base
              <input value={form.nome} onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Base Belém" className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm" required />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 lg:col-span-1">
              Código Único
              <input value={form.codigo} onChange={(e) => setForm(prev => ({ ...prev, codigo: e.target.value }))} placeholder="Ex: BEL-01" className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm" required />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 lg:col-span-1">
              Tipo de Base
              <select value={form.tipo} onChange={(e) => setForm(prev => ({ ...prev, tipo: e.target.value }))} className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm">
                <option value="OPERACIONAL">Operacional</option>
                <option value="MATRIZ">Matriz</option>
              </select>
            </label>
            <div className="flex gap-2">
              {editingId ? (
                <button type="button" onClick={resetForm} className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold">
                  Cancelar
                </button>
              ) : null}
              <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-60">
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Base'}
              </button>
            </div>
          </div>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bases Cadastradas ({bases.length})</h3>
        </div>
        {loading ? <p className="text-sm text-gray-500">Carregando bases...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Código', 'Nome da Base', 'Tipo', 'Equip. (total)', 'Gestores Cad.', 'Status', 'Ação'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bases.map(base => (
                  <tr key={base._id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-3 px-3 font-semibold text-gray-900 dark:text-gray-100">{base.codigo}</td>
                    <td className="py-3 px-3 text-gray-800 dark:text-gray-200">{base.nome}</td>
                    <td className="py-3 px-3"><span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${base.tipo === 'MATRIZ' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-700'}`}>{base.tipo}</span></td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{base.totalEquipamentos || 0}</td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{base.totalGestores || 0}</td>
                    <td className={`py-3 px-3 font-semibold ${base.isActive ? 'text-green-600' : 'text-red-500'}`}>{base.isActive ? 'Ativa' : 'Inativa'}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-4">
                        <button onClick={() => startEdit(base)} className="font-semibold text-violet-600">EDITAR</button>
                        <button onClick={() => void toggleBase(base)} className={`font-semibold ${base.isActive ? 'text-red-500' : 'text-green-600'}`}>
                          {base.isActive ? 'INATIVAR' : 'REATIVAR'}
                        </button>
                        <button onClick={() => void deleteBase(base)} className="font-semibold text-rose-700">EXCLUIR</button>
                      </div>
                    </td>
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
