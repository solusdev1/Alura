'use client';

import { useEffect, useMemo, useState } from 'react';

type BaseRow = { _id: string; nome: string; codigo: string; isActive: boolean };
type UserRow = { _id: string; name: string; email: string; role: string; baseId: string | null; baseName: string | null; isActive: boolean };

const EMPTY_FORM = { name: '', email: '', password: '', role: 'GESTOR_BASE', baseId: '' };

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Resposta inválida do servidor.' };
  }
}

export default function AdminUsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [bases, setBases] = useState<BaseRow[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedBaseName = useMemo(() => bases.find(base => base._id === form.baseId)?.nome || null, [bases, form.baseId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [usersRes, basesRes] = await Promise.all([fetch('/api/usuarios'), fetch('/api/bases')]);
      const [usersData, basesData] = await Promise.all([readJsonSafe(usersRes), readJsonSafe(basesRes)]);
      if (!usersRes.ok) throw new Error((usersData as { error: string }).error || 'Erro ao carregar usuários.');
      if (!basesRes.ok) throw new Error((basesData as { error: string }).error || 'Erro ao carregar bases.');
      setUsers(Array.isArray(usersData) ? usersData : []);
      setBases(Array.isArray(basesData) ? basesData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function startEdit(user: UserRow) {
    setEditingId(user._id);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, baseId: user.baseId || '' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const trimmedPassword = form.password.trim();
      if (!editingId && trimmedPassword.length < 6) {
        throw new Error('A senha provisória deve ter no mínimo 6 caracteres.');
      }
      if (editingId && trimmedPassword && trimmedPassword.length < 6) {
        throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
      }
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: trimmedPassword,
        role: form.role,
        baseId: form.role === 'GESTOR_BASE' ? form.baseId || null : null,
        baseName: form.role === 'GESTOR_BASE' ? selectedBaseName : null
      };
      const response = await fetch(editingId ? `/api/usuarios/${editingId}` : '/api/usuarios', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId
          ? {
              name: payload.name,
              role: payload.role,
              baseId: payload.baseId,
              baseName: payload.baseName,
              ...(payload.password ? { password: payload.password } : {})
            }
          : payload)
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error((data as { error: string }).error || 'Erro ao salvar usuário.');
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user: UserRow) {
    setError('');
    try {
      const response = await fetch(`/api/usuarios/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error((data as { error: string }).error || 'Erro ao atualizar usuário.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário.');
    }
  }

  async function resetPassword(user: UserRow) {
    const newPassword = window.prompt(`Informe a nova senha provisória para ${user.email}:`);
    if (newPassword === null) return;
    const password = newPassword.trim();
    if (password.length < 6) {
      setError('A senha provisória deve ter no mínimo 6 caracteres.');
      return;
    }
    setError('');
    try {
      const response = await fetch(`/api/usuarios/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error((data as { error: string }).error || 'Erro ao resetar senha.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resetar senha.');
    }
  }

  const roleLabel = (role: string) => role === 'ADMIN' ? 'ADMIN' : role === 'GERENTE' ? 'GERENTE' : role === 'MANUTENCAO' ? 'MANUTENCAO' : 'GESTOR BASE';

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administração</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestão de Usuários</h2>
        <p className="text-sm text-gray-500">Gerencie administradores, gerentes e gestores de base.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{editingId ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome<input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome Completo" className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm" required /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail<input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="usuario@empresa.com" className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm" required disabled={Boolean(editingId)} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {editingId ? 'Nova Senha' : 'Senha Provisória'}
              <input type="password" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} placeholder={editingId ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'} className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm" required={!editingId} minLength={6} autoComplete="new-password" />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Perfil<select value={form.role} onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value, baseId: e.target.value === 'GESTOR_BASE' ? prev.baseId : '' }))} className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"><option value="GESTOR_BASE">Gestor de Base</option><option value="GERENTE">Gerente</option><option value="MANUTENCAO">Manutenção</option><option value="ADMIN">Admin</option></select></label>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">Base de Vínculo<select value={form.baseId} onChange={(e) => setForm(prev => ({ ...prev, baseId: e.target.value }))} className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm" required={form.role === 'GESTOR_BASE'} disabled={form.role !== 'GESTOR_BASE'}><option value="">{form.role === 'GESTOR_BASE' ? 'Selecione a base autorizada para este gestor...' : 'Global (Acesso Total)'}</option>{bases.map(base => (<option key={base._id} value={base._id}>{base.nome}</option>))}</select></label>
            <div className="flex gap-2">{editingId && <button type="button" onClick={resetForm} className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold">Cancelar</button>}<button type="submit" disabled={saving} className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-60">{saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Usuário'}</button></div>
          </div>
          {editingId ? <p className="text-xs text-gray-500">Admins podem redefinir a própria senha ou a de qualquer outro usuário por aqui.</p> : null}
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Usuários Cadastrados ({users.length})</h3></div>
        {loading ? <p className="text-sm text-gray-500">Carregando usuários...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800">{['Nome / E-mail', 'Perfil', 'Base Vinculada', 'Status', 'Ação'].map(h => (<th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody>{users.map(user => (<tr key={user._id} className="border-b border-gray-50 dark:border-gray-800"><td className="py-3 px-3"><p className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</p><p className="text-sm text-gray-500">{user.email}</p></td><td className="py-3 px-3"><span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : user.role === 'GERENTE' ? 'bg-amber-100 text-amber-700' : user.role === 'MANUTENCAO' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{roleLabel(user.role)}</span></td><td className="py-3 px-3 text-gray-700 dark:text-gray-300">{user.baseName || (user.role === 'MANUTENCAO' ? 'Fila central de manutenção' : 'Global (Acesso Total)')}</td><td className={`py-3 px-3 font-semibold ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>{user.isActive ? 'Ativo' : 'Inativo'}</td><td className="py-3 px-3"><div className="flex flex-wrap gap-4"><button onClick={() => startEdit(user)} className="font-semibold text-violet-600">EDITAR</button><button onClick={() => void resetPassword(user)} className="font-semibold text-blue-600">RESETAR SENHA</button><button onClick={() => void toggleUser(user)} className={`font-semibold ${user.isActive ? 'text-red-500' : 'text-green-600'}`}>{user.isActive ? 'INATIVAR' : 'REATIVAR'}</button></div></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
