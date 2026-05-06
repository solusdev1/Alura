'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  createInventoryDevice,
  createMovimentacao,
  deleteInventoryByIds,
  getInventory,
  getMovimentacoes,
  getServerStatus,
  syncInventory,
  updateInventoryDevice
} from '@/frontend/api/client';
import GerarTermoModal from '@/frontend/components/termos/GerarTermoModal';

type Device = Record<string, unknown>;
type Movement = {
  _id: string;
  tipo: string;
  status: string;
  etapaAtual: string;
  baseOrigemNome: string;
  baseDestinoNome: string;
  setorOrigemNome: string;
  setorDestinoNome: string;
  baseReferenciaNome: string;
  dataAbertura: string;
  observacao: string;
  diagnostico: string;
  resultado: string;
  resolvidoPorNome: string;
};
type BaseRow = { _id: string; nome: string; isActive: boolean };

const BASE_SETOR_OPTIONS = ['TI', 'Frota', 'Frete', 'Financeiro', 'Comercial', 'RH', 'Operação', 'Sem setor'];
const GESTOR_SETOR_OPTIONS = ['Frota', 'Frete'];
const BASE_TIPO_OPTIONS = ['Notebook', 'Workstation', 'Bip', 'Celular', 'Coletor', 'Roteador', 'Switch'];
const BASE_LOC_OPTIONS = ['SJP', 'SP', 'RS', 'ES', 'GOIAS', 'MINAS'];
const STATUS_OPTIONS = ['Online', 'Offline', 'Em Uso', 'MANUTENCAO', 'BAIXADO'];

const EMPTY_EDIT = { adDisplayName: '', email: '', cloud: '', baseNome: '', setor: '', city: '', status: '', dataAlteracao: '', descricao: '' };
const EMPTY_CREATE = {
  nome: '', tipo: '', baseNome: '', setor: '', city: '', adDisplayName: '', email: '', cloud: '', status: 'Em Uso',
  dataAlteracao: '', descricao: '', hostname: '', perifericos: '', duasTelas: '', serial: '',
  patrimonioCodigo: '', marca: '', modelo: '', imei: '', responsavelFinal: '', linhaChip: '', operadora: '', observacoesIniciais: ''
};
const EMPTY_MOVE = { tipo: 'TRANSFERENCIA', baseDestinoNome: '', setorDestinoNome: '', observacao: '', diagnostico: '', resultado: '' };

function formatarDescricao(device: Device): string {
  const partes: string[] = [];
  if (device.memoria && device.memoria !== 'N/A') partes.push(String(device.memoria));
  if (device.disco && device.disco !== 'N/A') partes.push(String(device.disco));
  if (device.so && device.so !== 'N/A') partes.push(String(device.so));
  return partes.join(', ') || 'N/A';
}

function normalizarStatus(status: unknown): string {
  const v = String(status || '').toLowerCase();
  if (v === 'online') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  if (v === 'em uso') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  if (v === 'offline') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  if (v === 'baixado') return 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  if (v === 'manutencao' || v === 'manutenção') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

function getDisplayResponsible(device: Device): string {
  return String(device.responsavelAtualNome || device.adDisplayName || device.usuario || '-');
}

function obterEmail(device: Device): string {
  if (device.email && device.email !== 'N/A') return String(device.email);
  if (!device.usuario) return '-';
  return `${String(device.usuario).toLowerCase().replace(/\\/g, '').replace(/\s/g, '.').replace(/carrarolog/g, '')}@carrarologistica.com.br`;
}

function getBaseName(device: Device): string {
  return String(device.baseNome || device.setor || '');
}

function getSectorName(device: Device): string {
  if (device.baseNome) return String(device.setor || '');
  return '';
}

function isMaintenanceDevice(device: Device | null): boolean {
  if (!device) return false;
  return String(device.baseNome || '').toUpperCase() === 'MANUTENCAO' || String(device.status || '').toUpperCase() === 'MANUTENCAO';
}

function getMaintenanceOriginBase(device: Device | null): string {
  if (!device) return '';
  return String(device.manutencaoOrigemBase || device.baseReferenciaNome || '');
}

function getMaintenanceOriginSetor(device: Device | null): string {
  if (!device) return '';
  return String(device.manutencaoOrigemSetor || device.setorReferenciaNome || '');
}

type SelectProps = { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; className?: string };
function Select({ value, onChange, options, placeholder, className = '' }: SelectProps) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ${className}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Input({ value, onChange, placeholder = '', type = 'text', className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ${className}`} />;
}

export default function Dashboard({ initialDevices, metadata, userName, userRole, userBaseName }: {
  initialDevices: Device[];
  metadata: Record<string, unknown>;
  userName: string;
  userRole: string;
  userBaseName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceQuery = searchParams.get('device');

  const [dispositivos, setDispositivos] = useState<Device[]>(initialDevices);
  const [bases, setBases] = useState<BaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [editing, setEditing] = useState<Device | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [movementModal, setMovementModal] = useState<Device | null>(null);
  const [moveForm, setMoveForm] = useState(EMPTY_MOVE);
  const [movementSaving, setMovementSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<Movement[]>([]);
  const isGestorBase = userRole === 'GESTOR_BASE';
  const isMaintenanceUser = userRole === 'MANUTENCAO';
  const isAdmin = userRole === 'ADMIN';
  const canSync = userRole === 'ADMIN' || userRole === 'GERENTE';
  const canCreateManual = !isMaintenanceUser;

  useEffect(() => {
    const hasModal = Boolean(editing || creating || selectedDevice || termModalOpen || movementModal);
    document.body.style.overflow = hasModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [editing, creating, selectedDevice, termModalOpen, movementModal]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditing(null);
        setCreating(false);
        fecharEquipamento();
        setTermModalOpen(false);
        setMovementModal(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  });

  useEffect(() => {
    void loadBases();
  }, []);

  useEffect(() => {
    if (!isGestorBase || !userBaseName) return;
    setCreateForm(prev => ({ ...prev, baseNome: userBaseName, setor: GESTOR_SETOR_OPTIONS.includes(prev.setor) ? prev.setor : 'Frota' }));
  }, [isGestorBase, userBaseName]);

  const loadBases = async () => {
    try {
      const response = await fetch('/api/bases');
      const data = await response.json();
      if (response.ok) {
        setBases(Array.isArray(data) ? data : []);
      }
    } catch {
      setBases([]);
    }
  };

  const carregarHistorico = async (deviceId: string) => {
    setHistoryLoading(true);
    try {
      const items = await getMovimentacoes({ deviceId });
      setHistoryItems(Array.isArray(items) ? items : []);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!deviceQuery) return;
    const match = dispositivos.find(device => String(device.id) === deviceQuery);
    if (match) {
      setSelectedDevice(match);
      void carregarHistorico(String(match.id));
    }
  }, [deviceQuery, dispositivos]);

  useEffect(() => {
    if (!selectedDevice) return;
    const updated = dispositivos.find(device => String(device.id) === String(selectedDevice.id));
    if (updated) setSelectedDevice(updated);
  }, [dispositivos, selectedDevice]);

  const carregarDados = async () => {
    setLoading(true);
    setError('');
    try {
      const dados = await getInventory();
      setDispositivos(Array.isArray(dados) ? dados : []);
      setSelectedIds(prev => prev.filter(id => (Array.isArray(dados) ? dados : []).some((d: Device) => d.id === id)));
      await loadBases();
      try {
        const s = await getServerStatus();
        setServerOnline(['running', 'online', 'ok'].includes(String(s.status || '').toLowerCase()));
      } catch {
        setServerOnline(false);
      }
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar inventário');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setError('');
    try {
      await syncInventory();
      await carregarDados();
    } catch (err) {
      setError((err as Error).message || 'Erro na sincronização');
      setLoading(false);
    }
  };

  const tipoOptions = useMemo(() => {
    const deviceTypes = dispositivos
      .map(d => String(d.tipo || ''))
      .filter(Boolean)
      .map(tipo => (tipo === 'Bipe' ? 'Bip' : tipo));
    const baseTypes = isGestorBase ? ['Bip', 'Celular'] : BASE_TIPO_OPTIONS;
    return Array.from(new Set([...baseTypes, ...deviceTypes])).sort((a, b) => a.localeCompare(b));
  }, [dispositivos, isGestorBase]);
  const tiposUnicos = useMemo(() => ['Todos', ...tipoOptions], [tipoOptions]);
  const setorOptions = useMemo(() => {
    if (isGestorBase) return GESTOR_SETOR_OPTIONS;
    return Array.from(new Set([...BASE_SETOR_OPTIONS, ...dispositivos.map(d => String(d.setor || '')).filter(Boolean)])).sort((a, b) => a.localeCompare(b));
  }, [dispositivos, isGestorBase]);
  const baseOptions = useMemo(() => {
    if (isGestorBase && userBaseName) return [userBaseName];
    const activeBases = bases.filter(base => base.isActive).map(base => base.nome);
    const deviceBases = dispositivos.map(d => getBaseName(d)).filter(Boolean);
    return Array.from(new Set([...activeBases, ...deviceBases])).sort((a, b) => a.localeCompare(b));
  }, [bases, dispositivos, isGestorBase, userBaseName]);
  const cityOptions = useMemo(() => Array.from(new Set([...BASE_LOC_OPTIONS, ...dispositivos.map(d => String(d.city || '')).filter(Boolean)])).sort((a, b) => a.localeCompare(b)), [dispositivos]);
  const isPortableType = ['Celular', 'Bip', 'Coletor', 'Switch'].includes(createForm.tipo);
  const isCelularType = createForm.tipo === 'Celular';

  const dispositivosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return dispositivos.filter(d => {
      const matchTipo = filtroTipo === 'Todos' || d.tipo === filtroTipo;
      const matchStatus = filtroStatus === 'Todos' || String(d.status || '').toLowerCase() === filtroStatus.toLowerCase();
      const matchBusca = !termo || [d.nome, d.adDisplayName, d.usuario, d.email, d.cloud, d.baseNome, d.setor, d.responsavelAtualNome, d.responsavelAtualDocumento, d.ip, d.organizacao].some(v => String(v || '').toLowerCase().includes(termo));
      return matchTipo && matchStatus && matchBusca;
    });
  }, [dispositivos, filtroTipo, filtroStatus, busca]);

  const selectedDevices = useMemo(() => dispositivos.filter(d => selectedIds.includes(String(d.id))), [dispositivos, selectedIds]);

  const statsTop = useMemo(() => ({
    total: dispositivos.length,
    online: dispositivos.filter(d => String(d.status || '').toLowerCase() === 'online').length,
    offline: dispositivos.filter(d => String(d.status || '').toLowerCase() === 'offline').length,
    notebooks: dispositivos.filter(d => d.tipo === 'Notebook').length,
    workstations: dispositivos.filter(d => d.tipo === 'Workstation').length
  }), [dispositivos]);

  const grupos = useMemo(() => {
    const grouped = new Map<string, Device[]>();
    dispositivosFiltrados.forEach(d => {
      const baseName = getBaseName(d) || 'Sem base';
      if (!grouped.has(baseName)) grouped.set(baseName, []);
      grouped.get(baseName)!.push(d);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [dispositivosFiltrados]);

  const abrirEquipamento = async (device: Device) => {
    setSelectedDevice(device);
    await carregarHistorico(String(device.id));
    router.replace(`/dashboard/equipamentos?device=${encodeURIComponent(String(device.id))}`);
  };

  const fecharEquipamento = () => {
    setSelectedDevice(null);
    setHistoryItems([]);
    if (typeof window !== 'undefined' && window.location.pathname === '/dashboard/equipamentos') {
      router.replace('/dashboard/equipamentos');
    }
  };

  const abrirEdicao = (device: Device) => {
    setEditing(device);
    setEditForm({
      adDisplayName: String(device.adDisplayName || device.usuario || ''),
      email: String(device.email || ''),
      cloud: String(device.cloud || ''),
      baseNome: getBaseName(device),
      setor: getSectorName(device),
      city: String(device.city || ''),
      status: String(device.status || ''),
      dataAlteracao: String(device.dataAlteracao || ''),
      descricao: String(device.descricao || formatarDescricao(device))
    });
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      adDisplayName: editForm.adDisplayName,
      usuario: editForm.adDisplayName,
      email: editForm.email,
      cloud: editForm.cloud,
      baseNome: editForm.baseNome,
      setor: editForm.setor,
      city: editForm.city,
      status: editForm.status,
      dataAlteracao: editForm.dataAlteracao,
      descricao: editForm.descricao
    };
    try {
      await updateInventoryDevice(String(editing.id), payload);
      setDispositivos(prev => prev.map(d => d.id === editing.id ? { ...d, ...payload } : d));
      setEditing(null);
    } catch (err) {
      setError((err as Error).message || 'Erro ao salvar');
    }
  };

  const excluirDispositivo = async (device: Device) => {
    if (!window.confirm(`Excluir ${device.nome || device.id}`)) return;
    try {
      await deleteInventoryByIds([String(device.id)]);
      setDispositivos(prev => prev.filter(d => d.id !== device.id));
      if (selectedDevice && String(selectedDevice.id) === String(device.id)) fecharEquipamento();
    } catch (err) {
      setError((err as Error).message || 'Erro ao excluir');
    }
  };

  const salvarCriacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.baseNome || !createForm.tipo || !createForm.setor) {
      setError('Selecione Base, Setor e Tipo de Aparelho');
      return;
    }
    if (!isPortableType && !createForm.city) {
      setError('Selecione a Localização do equipamento.');
      return;
    }
    if (!createForm.marca || !createForm.modelo || !createForm.serial) {
      setError('Preencha Marca, Modelo e Número de Série.');
      return;
    }
    if (isCelularType && !createForm.imei) {
      setError('Preencha o IMEI do celular.');
      return;
    }
    try {
      const generatedName =
        createForm.patrimonioCodigo ||
        createForm.hostname ||
        [createForm.tipo, createForm.marca, createForm.modelo].filter(Boolean).join(' - ') ||
        createForm.responsavelFinal ||
        createForm.adDisplayName ||
        `${createForm.tipo}-${Date.now()}`;
      const payload = {
        ...createForm,
        nome: generatedName,
        usuario: createForm.responsavelFinal || createForm.adDisplayName,
        adDisplayName: createForm.responsavelFinal || createForm.adDisplayName,
        descricao: createForm.observacoesIniciais || createForm.descricao,
        fabricante: createForm.marca || '',
        modelo: createForm.modelo || ''
      };
      const result = await createInventoryDevice(payload as Record<string, unknown>);
      setDispositivos(prev => [result as Device, ...prev]);
      setCreating(false);
      setCreateForm(EMPTY_CREATE);
    } catch (err) {
      setError((err as Error).message || 'Erro ao criar');
    }
  };

  const openMovementModal = (device: Device, tipo: 'TRANSFERENCIA' | 'MANUTENCAO' | 'RETORNO_MANUTENCAO') => {
    setMovementModal(device);
    setMoveForm({
      tipo,
      baseDestinoNome: tipo === 'MANUTENCAO' ? 'MANUTENCAO' : tipo === 'RETORNO_MANUTENCAO' ? getMaintenanceOriginBase(device) : '',
      setorDestinoNome: tipo === 'MANUTENCAO' ? 'MANUTENCAO' : tipo === 'RETORNO_MANUTENCAO' ? getMaintenanceOriginSetor(device) : getSectorName(device),
      observacao: '',
      diagnostico: String(device.diagnosticoManutencao || ''),
      resultado: String(device.resultadoManutencao || '')
    });
  };

  const salvarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModal) return;
    if (!moveForm.baseDestinoNome) {
      setError('Selecione a base de destino.');
      return;
    }
    setMovementSaving(true);
    try {
      await createMovimentacao({
        deviceId: String(movementModal.id || ''),
        deviceNome: String(movementModal.nome || movementModal.hostname || ''),
        deviceTipo: String(movementModal.tipo || ''),
        baseOrigemNome: getBaseName(movementModal),
        baseDestinoNome: moveForm.baseDestinoNome,
        setorOrigemNome: getSectorName(movementModal),
        setorDestinoNome: moveForm.setorDestinoNome,
        tipo: moveForm.tipo,
        observacao: moveForm.observacao,
        diagnostico: moveForm.diagnostico,
        resultado: moveForm.resultado
      });
      setMovementModal(null);
      setMoveForm(EMPTY_MOVE);
      await carregarDados();
      await carregarHistorico(String(movementModal.id || ''));
    } catch (err) {
      setError((err as Error).message || 'Erro ao registrar movimentação');
    } finally {
      setMovementSaving(false);
    }
  };

  const darBaixa = async (device: Device) => {
    if (!window.confirm(`Dar baixa em ${device.nome || device.id}`)) return;
    const resultado = window.prompt('Informe o resultado da manutenção ou o motivo da baixa:', String(device.resultadoManutencao || ''));
    if (resultado === null) return;
    try {
      await createMovimentacao({
        deviceId: String(device.id || ''),
        deviceNome: String(device.nome || device.hostname || ''),
        deviceTipo: String(device.tipo || ''),
        baseOrigemNome: getBaseName(device),
        baseDestinoNome: getMaintenanceOriginBase(device) || getBaseName(device),
        setorOrigemNome: getSectorName(device),
        setorDestinoNome: getMaintenanceOriginSetor(device) || getSectorName(device),
        tipo: 'BAIXA',
        observacao: 'Baixa registrada pelo painel do equipamento',
        resultado
      });
      await carregarDados();
      await carregarHistorico(String(device.id || ''));
    } catch (err) {
      setError((err as Error).message || 'Erro ao dar baixa');
    }
  };

  const exportarCSV = () => window.open('/api/export/csv', '_blank');

  const toggleDeviceSelection = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleBaseSelection = (items: Device[]) => {
    const ids = items.map(d => String(d.id));
    const allSelected = ids.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allSelected ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
  };

  const cls = 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100';
  const movementTitle = moveForm.tipo === 'MANUTENCAO'
     ? 'Enviar para manutenção'
    : moveForm.tipo === 'RETORNO_MANUTENCAO'
       ? 'Registrar retorno da manutenção'
      : 'Mover equipamento';

  return (
    <div className="min-h-screen">
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Inventário TI</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block w-2 h-2 rounded-full ${serverOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">Servidor {serverOnline ? 'Online' : 'Offline'}</span>
                {(metadata.last_sync as string) && <span className="text-xs text-gray-400">• Sync: {new Date(metadata.last_sync as string).toLocaleString('pt-BR')}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-500">{userName}</span>
              {canSync ? <button onClick={handleSync} disabled={loading} className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Sincronizando...' : 'Sincronizar'}</button> : null}
              <button onClick={() => signOut()} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Sair</button>
            </div>
          </div>

          <div className="flex gap-4 mt-4 flex-wrap text-sm">
            {[['Total', statsTop.total], ['Online', statsTop.online], ['Offline', statsTop.offline], ['Notebooks', statsTop.notebooks], ['Workstations', statsTop.workstations]].map(([label, val]) => (
              <div key={String(label)} className="flex items-center gap-1.5">
                <span className="text-gray-500 dark:text-gray-400">{label}:</span>
                <strong className="text-gray-900 dark:text-gray-100">{val}</strong>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4 flex-wrap items-center">
            <Input value={busca} onChange={setBusca} placeholder="Buscar por nome, usuário, base, setor, IP..." className="flex-1 min-w-48" />
            <Select value={filtroTipo} onChange={setFiltroTipo} options={tiposUnicos} />
            <Select value={filtroStatus} onChange={setFiltroStatus} options={['Todos', ...STATUS_OPTIONS]} />
            <button onClick={() => selectedIds.length > 0 && setTermModalOpen(true)} disabled={selectedIds.length === 0} className="text-sm px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40">
              {selectedIds.length > 0 ? `Gerar Termo (${selectedIds.length})` : 'Gerar Termo'}
            </button>
            <button onClick={exportarCSV} className="text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Exportar CSV</button>
            {canCreateManual ? <button onClick={() => { setCreateForm({ ...EMPTY_CREATE, dataAlteracao: new Date().toLocaleString('pt-BR') }); setCreating(true); }} className="text-sm px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">+ Adicionar</button> : null}
          </div>
          <p className="mt-2 text-xs text-gray-400">Mostrando {dispositivosFiltrados.length} de {dispositivos.length} dispositivos</p>
        </header>

        <main className="p-6 space-y-6">
          {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">{error}</div>}
          {loading && <div className="text-center py-8 text-gray-500">Carregando...</div>}

          {!loading && grupos.map(([baseNome, items]) => (
            <section key={baseNome} className={`rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ${cls}`}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <input type="checkbox" checked={items.length > 0 && items.every(d => selectedIds.includes(String(d.id)))} onChange={() => toggleBaseSelection(items)} className="rounded" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{baseNome}</h2>
                <span className="ml-auto text-xs text-gray-400">{items.length} item(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2 w-8" />
                      <th className="px-4 py-2 text-left">Tipo</th>
                      <th className="px-4 py-2 text-left">Responsável</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Cloud</th>
                      <th className="px-4 py-2 text-left">Setor</th>
                      <th className="px-4 py-2 text-left">Descrição</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Localização</th>
                      <th className="px-4 py-2 text-left">Alteração</th>
                      <th className="px-4 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {items.map(d => (
                      <tr key={String(d.id)} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer" onClick={() => void abrirEquipamento(d)}>
                        <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.includes(String(d.id))} onChange={() => toggleDeviceSelection(String(d.id))} className="rounded" />
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{String(d.tipo || '-')}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{getDisplayResponsible(d)}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400 max-w-40 truncate">{obterEmail(d)}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{String(d.cloud || '-')}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{getSectorName(d) || '-'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400 max-w-48 truncate">{String(d.descricao || formatarDescricao(d))}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${normalizarStatus(d.status)}`}>{String(d.status || '-')}</span>
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{String(d.city || d.organizacao || '-')}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-500 text-xs">{String(d.dataAlteracao || '-')}</td>
                        <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={() => void abrirEquipamento(d)} className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200">Editar</button>
                            <button onClick={() => excluirDispositivo(d)} className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200">Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </main>
      </div>

      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={fecharEquipamento}>
          <div className={`rounded-2xl shadow-xl w-full max-w-3xl p-6 space-y-5 max-h-[92vh] overflow-y-auto ${cls}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl">Equipamento - {String(selectedDevice.nome || selectedDevice.hostname || selectedDevice.id)}</h3>
                <p className="text-sm text-gray-500">Termo, movimentação, manutenção, baixa e histórico centralizados nesta página.</p>
              </div>
              <button onClick={fecharEquipamento} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">Fechar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                ['Tipo', selectedDevice.tipo],
                ['Responsável', getDisplayResponsible(selectedDevice)],
                ['Email', obterEmail(selectedDevice)],
                ['Cloud', selectedDevice.cloud],
                ['Base', getBaseName(selectedDevice)],
                ['Setor', getSectorName(selectedDevice)],
                ['Localização', selectedDevice.city || selectedDevice.organizacao],
                ['Status', selectedDevice.status],
                ['Descrição', selectedDevice.descricao || formatarDescricao(selectedDevice)],
                ['Hostname', selectedDevice.hostname || selectedDevice.nome],
                ['Serial', selectedDevice.serial],
                ['Termo atual', selectedDevice.termoAtualId ? `ID ${String(selectedDevice.termoAtualId)} • versão ${String(selectedDevice.termoAtualVersion || '-')}` : 'Nenhum termo vinculado']
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-500">{String(label)}</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{String(value || '-')}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setSelectedIds([String(selectedDevice.id)]); setTermModalOpen(true); }} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700">Gerar termo</button>
              {!isMaintenanceDevice(selectedDevice) ? (
                <>
                  <button onClick={() => openMovementModal(selectedDevice, 'TRANSFERENCIA')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Mover</button>
                  {!isMaintenanceUser ? <button onClick={() => openMovementModal(selectedDevice, 'MANUTENCAO')} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700">Manutenção</button> : null}
                  <button onClick={() => void darBaixa(selectedDevice)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Dar baixa</button>
                </>
              ) : (
                <>
                  {(isMaintenanceUser || isAdmin) ? <button onClick={() => openMovementModal(selectedDevice, 'RETORNO_MANUTENCAO')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Registrar retorno</button> : null}
                  {(isMaintenanceUser || isAdmin) ? <button onClick={() => void darBaixa(selectedDevice)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Dar baixa</button> : null}
                </>
              )}
              <button onClick={() => abrirEdicao(selectedDevice)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">Editar dados</button>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Histórico da movimentação</h4>
                  <p className="text-xs text-gray-500">Transferências, manutenções, baixas e demais ações já registradas para este equipamento.</p>
                </div>
                {historyLoading && <span className="text-xs text-gray-400">Carregando...</span>}
              </div>

              {historyItems.length === 0 && !historyLoading ? (
                <p className="text-sm text-gray-400">Nenhum histórico encontrado para este equipamento.</p>
              ) : (
                <div className="space-y-2">
                  {historyItems.map(item => (
                    <div key={String(item._id)} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{String(item.tipo || '-')}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${String(item.status) === 'APROVADA' ? 'bg-green-100 text-green-800' : String(item.status) === 'REJEITADA' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{String(item.status || '-')}</span>
                        <span className="text-gray-500">{String(item.baseOrigemNome || '-')} → {String(item.baseDestinoNome || '-')}</span>
                        {(item.setorOrigemNome || item.setorDestinoNome) ? <span className="text-gray-400">• setor: {String(item.setorOrigemNome || '-')} → {String(item.setorDestinoNome || '-')}</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Aberta em {item.dataAbertura ? new Date(String(item.dataAbertura)).toLocaleString('pt-BR') : '-'}</p>
                      {item.observacao ? <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{item.observacao}</p> : null}
                      {item.resolvidoPorNome ? <p className="mt-1 text-xs text-gray-500">Resolvido por {item.resolvidoPorNome}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {movementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setMovementModal(null)}>
          <form className={`rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4 ${cls}`} onClick={e => e.stopPropagation()} onSubmit={salvarMovimentacao}>
            <h3 className="font-bold text-lg">{movementTitle}</h3>
            <p className="text-sm text-gray-500">
              {String(movementModal.nome || movementModal.id)} • base atual: {getBaseName(movementModal) || '-'} • setor atual: {getSectorName(movementModal) || '-'}
            </p>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-gray-500">Tipo</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{moveForm.tipo}</p>
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Base de destino
              <Select value={moveForm.baseDestinoNome} onChange={value => setMoveForm(prev => ({ ...prev, baseDestinoNome: value }))} options={moveForm.tipo === 'MANUTENCAO' ? ['MANUTENCAO'] : baseOptions.filter(option => option !== '')} placeholder="Selecione a base" className="mt-1 w-full" />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Setor de destino
              <Select value={moveForm.setorDestinoNome} onChange={value => setMoveForm(prev => ({ ...prev, setorDestinoNome: value }))} options={moveForm.tipo === 'MANUTENCAO' ? ['MANUTENCAO'] : setorOptions} placeholder="Selecione o setor" className="mt-1 w-full" />
            </label>
            {(moveForm.tipo === 'MANUTENCAO' || moveForm.tipo === 'RETORNO_MANUTENCAO') ? (
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Diagnóstico / observação técnica
                <textarea rows={3} value={moveForm.diagnostico} onChange={e => setMoveForm(prev => ({ ...prev, diagnostico: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
              </label>
            ) : null}
            {moveForm.tipo === 'RETORNO_MANUTENCAO' ? (
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Resultado da manutenção
                <textarea rows={3} value={moveForm.resultado} onChange={e => setMoveForm(prev => ({ ...prev, resultado: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
              </label>
            ) : null}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Observação
              <textarea rows={3} value={moveForm.observacao} onChange={e => setMoveForm(prev => ({ ...prev, observacao: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setMovementModal(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">Cancelar</button>
              <button type="submit" disabled={movementSaving || !moveForm.baseDestinoNome} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">{movementSaving ? 'Salvando...' : 'Enviar movimentação'}</button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form className={`rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto ${cls}`} onClick={e => e.stopPropagation()} onSubmit={salvarEdicao}>
            <h3 className="font-bold text-lg">Editar dados - {String(editing.nome || editing.id)}</h3>
            {([['Responsável', 'adDisplayName'], ['Email', 'email'], ['Cloud', 'cloud'], ['Data Alteração', 'dataAlteracao']] as [string, string][]).map(([label, key]) => (
              <label key={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                <Input value={(editForm as Record<string, string>)[key]} onChange={v => setEditForm(p => ({ ...p, [key]: v }))} className="mt-1 w-full" />
              </label>
            ))}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base<Select value={editForm.baseNome} onChange={v => setEditForm(p => ({ ...p, baseNome: v }))} options={baseOptions} placeholder="Selecione" className="mt-1 w-full" /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Setor<Select value={editForm.setor} onChange={v => setEditForm(p => ({ ...p, setor: v }))} options={setorOptions} placeholder="Selecione" className="mt-1 w-full" /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Localização<Select value={editForm.city} onChange={v => setEditForm(p => ({ ...p, city: v }))} options={cityOptions} placeholder="Selecione" className="mt-1 w-full" /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status<Select value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={STATUS_OPTIONS} className="mt-1 w-full" /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição<textarea rows={2} value={editForm.descricao} onChange={e => setEditForm(p => ({ ...p, descricao: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" /></label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCreating(false)}>
          <form className={`rounded-2xl shadow-xl w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto ${cls}`} onClick={e => e.stopPropagation()} onSubmit={salvarCriacao}>
            <h3 className="font-bold text-lg">Adicionar Equipamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº Patrimônio / Código Interno
                <Input value={createForm.patrimonioCodigo} onChange={v => setCreateForm(p => ({ ...p, patrimonioCodigo: v }))} placeholder="Deixe em branco se não houver" className="mt-1 w-full" />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo *
                <Select value={createForm.tipo} onChange={v => setCreateForm(p => ({ ...p, tipo: v }))} options={tipoOptions} placeholder="Selecione" className="mt-1 w-full" />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marca *
                <Input value={createForm.marca} onChange={v => setCreateForm(p => ({ ...p, marca: v }))} placeholder="Ex: Samsung, Motorola, Zebra, Intelbras" className="mt-1 w-full" />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo *
                <Input value={createForm.modelo} onChange={v => setCreateForm(p => ({ ...p, modelo: v }))} placeholder="Ex: Galaxy A14" className="mt-1 w-full" />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº de Série *
                <Input value={createForm.serial} onChange={v => setCreateForm(p => ({ ...p, serial: v }))} placeholder="Obrigatório" className="mt-1 w-full" />
              </label>
              {isCelularType ? (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IMEI *
                  <Input value={createForm.imei} onChange={v => setCreateForm(p => ({ ...p, imei: v }))} placeholder="Obrigatório (15 dígitos)" className="mt-1 w-full" />
                </label>
              ) : (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Localização {!isPortableType ? '*' : ''}
                  <Select value={createForm.city} onChange={v => setCreateForm(p => ({ ...p, city: v }))} options={cityOptions} placeholder="Selecione a localização..." className="mt-1 w-full" />
                </label>
              )}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Responsável (usuário final)
                <Input value={createForm.responsavelFinal} onChange={v => setCreateForm(p => ({ ...p, responsavelFinal: v, adDisplayName: v }))} placeholder="Ex: João Silva ou Estoque" className="mt-1 w-full" />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Setor *
                <Select value={createForm.setor} onChange={v => setCreateForm(p => ({ ...p, setor: v }))} options={setorOptions} placeholder="Selecione um setor..." className="mt-1 w-full" />
              </label>
              {isCelularType ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Linha / chip
                    <Input value={createForm.linhaChip} onChange={v => setCreateForm(p => ({ ...p, linhaChip: v }))} placeholder="(00) 00000-0000" className="mt-1 w-full" />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operadora
                    <Input value={createForm.operadora} onChange={v => setCreateForm(p => ({ ...p, operadora: v }))} placeholder="Ex: Vivo, Claro, TIM" className="mt-1 w-full" />
                  </label>
                </>
              ) : null}
              {!isPortableType ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hostname
                    <Input value={createForm.hostname} onChange={v => setCreateForm(p => ({ ...p, hostname: v }))} placeholder="Nome da maquina ou identificacao" className="mt-1 w-full" />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email
                    <Input value={createForm.email} onChange={v => setCreateForm(p => ({ ...p, email: v }))} placeholder="usuario@empresa.com" className="mt-1 w-full" />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cloud
                    <Input value={createForm.cloud} onChange={v => setCreateForm(p => ({ ...p, cloud: v }))} placeholder="Conta cloud, se houver" className="mt-1 w-full" />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Periféricos
                    <Input value={createForm.perifericos} onChange={v => setCreateForm(p => ({ ...p, perifericos: v }))} placeholder="Mouse, teclado, carregador..." className="mt-1 w-full" />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duas Telas
                    <Select value={createForm.duasTelas} onChange={v => setCreateForm(p => ({ ...p, duasTelas: v }))} options={['Sim', 'Não']} placeholder="Selecione" className="mt-1 w-full" />
                  </label>
                </>
              ) : null}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base de origem *
                <Select value={createForm.baseNome} onChange={v => setCreateForm(p => ({ ...p, baseNome: v }))} options={baseOptions} placeholder="Selecione uma base..." className="mt-1 w-full" />
              </label>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observacoes iniciais
                  <textarea rows={4} value={createForm.observacoesIniciais} onChange={e => setCreateForm(p => ({ ...p, observacoesIniciais: e.target.value, descricao: e.target.value }))} placeholder="Condicao visual, acessorios inclusos, etc." className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700">Salvar</button>
            </div>
          </form>
        </div>
      )}

      <GerarTermoModal open={termModalOpen} onClose={() => setTermModalOpen(false)} devices={selectedDevices} onGenerated={async () => { setSelectedIds([]); await carregarDados(); if (selectedDevice) await carregarHistorico(String(selectedDevice.id || '')); }} />
    </div>
  );
}
