import { useEffect, useMemo, useState } from 'react';
import GerarTermoModal from './GerarTermoModal.jsx';
import { SERVER_URL } from '../services/api.js';

const BASE_SETOR_OPTIONS = ['TI', 'Frota', 'Financeiro', 'Comercial', 'RH', 'Operacao', 'Sem setor'];
const BASE_TIPO_OPTIONS = ['Notebook', 'Workstation', 'Bipe', 'Celular', 'Coletor', 'Roteador', 'Switch'];
const BASE_LOC_OPTIONS = ['SJP', 'SP', 'RS', 'ES', 'GOIAS', 'MINAS'];

const EMPTY_EDIT = {
  adDisplayName: '',
  email: '',
  cloud: '',
  setor: '',
  city: '',
  status: '',
  dataAlteracao: '',
  descricao: ''
};

const EMPTY_CREATE = {
  nome: '',
  tipo: '',
  setor: '',
  city: '',
  adDisplayName: '',
  email: '',
  cloud: '',
  status: 'Em Uso',
  dataAlteracao: '',
  descricao: '',
  hostname: '',
  perifericos: '',
  duasTelas: '',
  serial: ''
};

const EMPTY_MOVEMENT = {
  destinoBaseId: '',
  motivo: ''
};

function InventoryView({
  devices,
  allDevices,
  loading,
  error,
  currentUser,
  serverStatus,
  bases,
  onSync,
  onReload,
  onCreateDevice,
  onUpdateDevice,
  onDeleteDevice,
  onCreateMovement
}) {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [editing, setEditing] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [detailModal, setDetailModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [movementModal, setMovementModal] = useState(null);
  const [movementForm, setMovementForm] = useState(EMPTY_MOVEMENT);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => devices.some(device => device.id === id)));
  }, [devices]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== 'Escape') return;
      setEditing(null);
      setCreating(false);
      setSelectedDevice(null);
      setDetailModal(null);
      setTermModalOpen(false);
      setMovementModal(null);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const tipoOptions = useMemo(
    () => Array.from(new Set([...BASE_TIPO_OPTIONS, ...allDevices.map(d => d.tipo).filter(Boolean)])),
    [allDevices]
  );
  const tiposUnicos = useMemo(() => ['Todos', ...tipoOptions], [tipoOptions]);
  const setorOptions = useMemo(
    () => Array.from(new Set([...BASE_SETOR_OPTIONS, ...allDevices.map(d => d.setor).filter(Boolean)])),
    [allDevices]
  );
  const cityOptions = useMemo(
    () => Array.from(new Set([...BASE_LOC_OPTIONS, ...allDevices.map(d => d.city).filter(Boolean)])),
    [allDevices]
  );

  const dispositivosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return devices.filter(device => {
      const matchTipo = filtroTipo === 'Todos' || device.tipo === filtroTipo;
      const matchStatus = filtroStatus === 'Todos' || String(device.status || '').toLowerCase() === filtroStatus.toLowerCase();
      const matchBusca = !termo ||
        device.nome?.toLowerCase().includes(termo) ||
        device.adDisplayName?.toLowerCase().includes(termo) ||
        device.usuario?.toLowerCase().includes(termo) ||
        device.email?.toLowerCase().includes(termo) ||
        device.cloud?.toLowerCase().includes(termo) ||
        device.setor?.toLowerCase().includes(termo) ||
        device.baseNome?.toLowerCase().includes(termo) ||
        device.responsavelAtualNome?.toLowerCase().includes(termo) ||
        device.ip?.toLowerCase().includes(termo) ||
        device.organizacao?.toLowerCase().includes(termo);
      return matchTipo && matchStatus && matchBusca;
    });
  }, [devices, filtroTipo, filtroStatus, busca]);

  const selectedDevices = useMemo(
    () => devices.filter(device => selectedIds.includes(device.id)),
    [devices, selectedIds]
  );

  const statsTop = useMemo(() => ({
    total: devices.length,
    online: devices.filter(d => String(d.status || '').toLowerCase() === 'online').length,
    offline: devices.filter(d => String(d.status || '').toLowerCase() === 'offline').length,
    notebooks: devices.filter(d => d.tipo === 'Notebook').length,
    workstations: devices.filter(d => d.tipo === 'Workstation').length
  }), [devices]);

  const cards = useMemo(() => {
    const clouds = new Set();
    const licenses = new Set();
    dispositivosFiltrados.forEach(d => {
      if (d.cloud && d.cloud !== 'N/A') clouds.add(String(d.cloud).toLowerCase());
      const email = obterEmail(d);
      if (email && email !== 'N/A' && email !== '-') licenses.add(email.toLowerCase());
    });
    return { total: dispositivosFiltrados.length, cloudsAtivos: clouds.size, licencas: licenses.size };
  }, [dispositivosFiltrados]);

  const grupos = useMemo(() => {
    const grouped = new Map();
    dispositivosFiltrados.forEach(device => {
      const setor = device.setor || 'Sem setor';
      if (!grouped.has(setor)) grouped.set(setor, []);
      grouped.get(setor).push(device);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dispositivosFiltrados]);

  const detalhesAparelhos = useMemo(() => {
    const byTipo = new Map();
    const bySetorTipo = new Map();
    dispositivosFiltrados.forEach(d => {
      const tipo = d.tipo || 'Nao informado';
      const setor = d.setor || 'Sem setor';
      byTipo.set(tipo, (byTipo.get(tipo) || 0) + 1);
      const key = `${setor}|||${tipo}`;
      bySetorTipo.set(key, (bySetorTipo.get(key) || 0) + 1);
    });
    return {
      byTipo: Array.from(byTipo.entries()).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total),
      bySetorTipo: Array.from(bySetorTipo.entries()).map(([key, quantidade]) => {
        const [setor, tipo] = key.split('|||');
        return { setor, tipo, quantidade };
      }).sort((a, b) => b.quantidade - a.quantidade)
    };
  }, [dispositivosFiltrados]);

  const detalhesCloud = useMemo(() => {
    const rows = dispositivosFiltrados
      .filter(d => d.cloud && d.cloud !== 'N/A' && d.cloud !== 'Nao informado')
      .map(d => ({
        setor: d.setor || 'Sem setor',
        responsavel: d.adDisplayName || d.usuario || '-',
        cloud: d.cloud
      }));

    const byCloud = new Map();
    rows.forEach(r => byCloud.set(String(r.cloud).toLowerCase(), (byCloud.get(String(r.cloud).toLowerCase()) || 0) + 1));
    const repetidosSet = new Set(Array.from(byCloud.entries()).filter(([, v]) => v > 1).map(([k]) => k));
    const repetidos = rows.filter(r => repetidosSet.has(String(r.cloud).toLowerCase()));

    return {
      totalRegistros: rows.length,
      tiposCloud: new Set(rows.map(r => String(r.cloud).toLowerCase())).size,
      cloudsRepetidos: repetidosSet.size,
      repetidos
    };
  }, [dispositivosFiltrados]);

  const detalhesLicencas = useMemo(() => {
    const rows = dispositivosFiltrados
      .map(d => ({
        setor: d.setor || 'Sem setor',
        responsavel: d.adDisplayName || d.usuario || '-',
        email: obterEmail(d)
      }))
      .filter(r => r.email && r.email !== '-' && r.email !== 'N/A' && !String(r.email).toLowerCase().includes('nao informado'));

    const uniq = new Set();
    const dedup = rows.filter(r => {
      const key = `${r.setor}|${r.responsavel}|${String(r.email).toLowerCase()}`;
      if (uniq.has(key)) return false;
      uniq.add(key);
      return true;
    });

    return {
      totalLicencas: new Set(dedup.map(r => String(r.email).toLowerCase())).size,
      setores: new Set(dedup.map(r => r.setor)).size,
      responsaveis: new Set(dedup.map(r => String(r.responsavel).toLowerCase())).size,
      rows: dedup
    };
  }, [dispositivosFiltrados]);

  const abrirEdicao = (device) => {
    setLocalError('');
    setEditing(device);
    setEditForm({
      adDisplayName: device.adDisplayName || device.usuario || '',
      email: device.email || '',
      cloud: device.cloud || '',
      setor: device.setor || '',
      city: device.city || '',
      status: device.status || '',
      dataAlteracao: device.dataAlteracao || '',
      descricao: device.descricao || formatarDescricao(device)
    });
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await onUpdateDevice(editing.id, {
        adDisplayName: editForm.adDisplayName,
        usuario: editForm.adDisplayName,
        email: editForm.email,
        cloud: editForm.cloud,
        setor: editForm.setor,
        city: editForm.city,
        status: editForm.status,
        dataAlteracao: editForm.dataAlteracao,
        descricao: editForm.descricao
      });
      setEditing(null);
      setEditForm(EMPTY_EDIT);
      setLocalError('');
    } catch (err) {
      setLocalError(err.message || 'Erro ao salvar alteração');
    }
  };

  const abrirCriacao = () => {
    setLocalError('');
    setCreateForm({ ...EMPTY_CREATE, dataAlteracao: new Date().toLocaleString('pt-BR') });
    setCreating(true);
  };

  const salvarCriacao = async (e) => {
    e.preventDefault();
    if (!createForm.setor || !createForm.tipo || !createForm.city) {
      setLocalError('Selecione setor, tipo de aparelho e localização física');
      return;
    }

    try {
      await onCreateDevice({
        ...createForm,
        usuario: createForm.adDisplayName,
        baseNome: createForm.city,
        baseCodigo: createForm.city,
        baseTipo: 'Operacional'
      });
      setCreating(false);
      setCreateForm(EMPTY_CREATE);
      setLocalError('');
    } catch (err) {
      setLocalError(err.message || 'Erro ao criar equipamento');
    }
  };

  const excluirDispositivo = async (device) => {
    const ok = window.confirm(`Excluir ${device.nome || device.id}?`);
    if (!ok) return;
    try {
      await onDeleteDevice(device.id);
      setLocalError('');
    } catch (err) {
      setLocalError(err.message || 'Erro ao excluir');
    }
  };

  const abrirMovimentacao = (device) => {
    setMovementModal(device);
    setMovementForm(EMPTY_MOVEMENT);
    setLocalError('');
  };

  const salvarMovimentacao = async (e) => {
    e.preventDefault();
    if (!movementModal) return;

    try {
      await onCreateMovement({
        deviceId: movementModal.id,
        destinoBaseId: movementForm.destinoBaseId,
        motivo: movementForm.motivo,
        requestedByUserId: currentUser?.id
      });
      setMovementModal(null);
      setMovementForm(EMPTY_MOVEMENT);
      setLocalError('');
      await onReload?.();
    } catch (err) {
      setLocalError(err.message || 'Erro ao solicitar movimentação');
    }
  };

  const exportarCSV = () => window.open(`${SERVER_URL}/api/export/csv`, '_blank');

  const toggleDeviceSelection = (deviceId) => {
    setSelectedIds(prev =>
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
  };

  const toggleSetorSelection = (items) => {
    const ids = items.map(device => device.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    setSelectedIds(prev => {
      if (allSelected) return prev.filter(id => !ids.includes(id));
      return Array.from(new Set([...prev, ...ids]));
    });
  };

  const handleTermGenerated = async () => {
    setSelectedIds([]);
    await onReload?.();
  };

  const exportarDetalheCSV = (nome, linhas, headers) => {
    const csv = [headers.join(','), ...linhas.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nome}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const combinedError = error || localError;

  return (
    <section className="page-shell">
      <div className="page-intro">
        <div>
          <span className="eyebrow">Estoque e inventário</span>
          <h2>Visualização do Estoque</h2>
          <p>{currentUser?.perfil === 'Gestor de Base' ? `Exibindo apenas os equipamentos da base ${currentUser.baseNome}.` : 'A tela anterior foi mantida aqui como visão operacional do estoque.'}</p>
        </div>
        <div className="session-chip">
          <span className={`dot ${isServerOnline(serverStatus) ? 'ok' : 'fail'}`} />
          Servidor {isServerOnline(serverStatus) ? 'Online' : 'Offline'}
        </div>
      </div>

      <section className="hero-header inventory-surface">
        <div className="hero-top">
          <div className="hero-title">
            <img src="/assets/logocarraro.png" alt="Carraro" />
            <div>
              <h1>Inventário TI</h1>
              <p>Controle visual de equipamentos por setor, responsável e base.</p>
            </div>
          </div>
          <div className="hero-actions">
            <button className="hero-action" onClick={onSync} disabled={loading}>{loading ? 'Sincronizando...' : 'Sincronizar'}</button>
          </div>
        </div>

        <div className="top-stats">
          <span>Total: <strong>{statsTop.total}</strong></span>
          <span>Online: <strong>{statsTop.online}</strong></span>
          <span>Offline: <strong>{statsTop.offline}</strong></span>
          <span>Notebooks: <strong>{statsTop.notebooks}</strong></span>
          <span>Workstations: <strong>{statsTop.workstations}</strong></span>
        </div>

        <div className="hero-filters">
          <input className="search-input dark" type="text" placeholder="Buscar por nome, usuário, base ou IP..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>{tiposUnicos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</select>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="Todos">Todos os Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Em Uso">Em Uso</option>
          </select>
          <button className="btn-term-top" onClick={() => setTermModalOpen(true)} disabled={selectedIds.length === 0}>
            {selectedIds.length > 0 ? `Gerar termo (${selectedIds.length})` : 'Gerar termo'}
          </button>
          <button className="btn-export-top" onClick={exportarCSV}>Exportar CSV</button>
          <button className="btn-add-top" onClick={abrirCriacao}>Adicionar equipamento</button>
        </div>

        <div className="results-line">Mostrando {dispositivosFiltrados.length} de {devices.length} dispositivos visíveis</div>
      </section>

      <section className="cards-grid">
        <article className="info-card card-clickable" onClick={() => setDetailModal('aparelhos')}>
          <p>Total de aparelhos</p><strong>{cards.total}</strong><span>Clique para ver o detalhamento</span>
        </article>
        <article className="info-card card-clickable" onClick={() => setDetailModal('clouds')}>
          <p>Clouds ativos</p><strong>{cards.cloudsAtivos}</strong><span>Clique para ver o detalhamento</span>
        </article>
        <article className="info-card card-clickable" onClick={() => setDetailModal('licencas')}>
          <p>Licenças Microsoft</p><strong>{cards.licencas}</strong><span>Clique para ver o detalhamento</span>
        </article>
      </section>

      {combinedError && <div className="error">{combinedError}</div>}
      {loading && <div className="loading">Carregando...</div>}

      {!loading && grupos.map(([setor, items]) => (
        <section key={setor} className="setor-block">
          <h2>{setor}</h2>
          <div className="table-scroll">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th className="check-col">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && items.every(device => selectedIds.includes(device.id))}
                      onChange={() => toggleSetorSelection(items)}
                      aria-label={`Selecionar setor ${setor}`}
                    />
                  </th>
                  <th>Tipo</th>
                  <th>Base</th>
                  <th>Responsável</th>
                  <th>Email</th>
                  <th>Cloud</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Localização</th>
                  <th>Última alteração</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(device => (
                  <tr key={device.id} className="row-clickable" onClick={() => setSelectedDevice(device)}>
                    <td className="check-col" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(device.id)}
                        onChange={() => toggleDeviceSelection(device.id)}
                        aria-label={`Selecionar ${device.nome || device.id}`}
                      />
                    </td>
                    <td>{device.tipo || '-'}</td>
                    <td>{device.baseNome || device.city || device.organizacao || '-'}</td>
                    <td>{getDisplayResponsible(device)}</td>
                    <td>{obterEmail(device)}</td>
                    <td>{device.cloud || '-'}</td>
                    <td>{device.descricao || formatarDescricao(device)}</td>
                    <td className="status-col"><span className={`badge-status ${normalizarStatus(device.status)}`}>{device.status || '-'}</span></td>
                    <td>{device.city || device.organizacao || '-'}</td>
                    <td>{device.dataAlteracao || '-'}</td>
                    <td className="acoes">
                      <button className="btn-edit" onClick={(e) => { e.stopPropagation(); abrirEdicao(device); }}>Editar</button>
                      <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); abrirMovimentacao(device); }}>Transferir</button>
                      <button className="btn-remove" onClick={(e) => { e.stopPropagation(); excluirDispositivo(device); }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {selectedDevice && (
        <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes do Equipamento</h3>
            <p><strong>Tipo:</strong> {selectedDevice.tipo || '-'}</p>
            <p><strong>Base:</strong> {selectedDevice.baseNome || selectedDevice.city || selectedDevice.organizacao || '-'}</p>
            <p><strong>Responsável:</strong> {getDisplayResponsible(selectedDevice)}</p>
            <p><strong>Email:</strong> {obterEmail(selectedDevice)}</p>
            <p><strong>Cloud:</strong> {selectedDevice.cloud || '-'}</p>
            <p><strong>Descrição:</strong> {selectedDevice.descricao || formatarDescricao(selectedDevice)}</p>
            <p><strong>Localização Física:</strong> {selectedDevice.city || selectedDevice.organizacao || '-'}</p>
            <p><strong>Obs adicional:</strong> {selectedDevice.hostname || selectedDevice.nome || '-'}</p>
            <p><strong>Número série:</strong> {selectedDevice.serial || '-'}</p>
            <div className="modal-actions"><button type="button" onClick={() => setSelectedDevice(null)}>Fechar</button></div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <form className="edit-modal" onClick={(e) => e.stopPropagation()} onSubmit={salvarEdicao}>
            <h3>Editar dispositivo</h3>
            <p>{editing.nome}</p>
            <label>Responsável<input value={editForm.adDisplayName} onChange={(e) => setEditForm(prev => ({ ...prev, adDisplayName: e.target.value }))} /></label>
            <label>Email<input value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} /></label>
            <label>Cloud<input value={editForm.cloud} onChange={(e) => setEditForm(prev => ({ ...prev, cloud: e.target.value }))} /></label>
            <label>Setor
              <select value={editForm.setor} onChange={(e) => setEditForm(prev => ({ ...prev, setor: e.target.value }))}>
                <option value="">Selecione</option>
                {setorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>Localização
              <select value={editForm.city} onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}>
                <option value="">Selecione</option>
                {cityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>Status<select value={editForm.status} onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}><option value="Online">Online</option><option value="Offline">Offline</option><option value="Em Uso">Em Uso</option></select></label>
            <label>Data alteração<input value={editForm.dataAlteracao} onChange={(e) => setEditForm(prev => ({ ...prev, dataAlteracao: e.target.value }))} /></label>
            <label>Descrição<textarea rows="2" value={editForm.descricao} onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))} /></label>
            <div className="modal-actions"><button type="button" onClick={() => setEditing(null)}>Cancelar</button><button type="submit">Salvar</button></div>
          </form>
        </div>
      )}

      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <form className="edit-modal" onClick={(e) => e.stopPropagation()} onSubmit={salvarCriacao}>
            <h3>Adicionar ao Estoque</h3>
            <label>Setor
              <select value={createForm.setor} onChange={(e) => setCreateForm(prev => ({ ...prev, setor: e.target.value }))} required>
                <option value="">Selecione</option>
                {setorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>Tipo de Aparelho
              <select value={createForm.tipo} onChange={(e) => setCreateForm(prev => ({ ...prev, tipo: e.target.value }))} required>
                <option value="">Selecione</option>
                {tipoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>Localização Física
              <select value={createForm.city} onChange={(e) => setCreateForm(prev => ({ ...prev, city: e.target.value }))} required>
                <option value="">Selecione</option>
                {cityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>HostName<input value={createForm.hostname} onChange={(e) => setCreateForm(prev => ({ ...prev, hostname: e.target.value }))} /></label>
            <label>Email Utilizado<input value={createForm.email} onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))} /></label>
            <label>Pessoa Responsável<input value={createForm.adDisplayName} onChange={(e) => setCreateForm(prev => ({ ...prev, adDisplayName: e.target.value }))} /></label>
            <label>Cloud Utilizado<input value={createForm.cloud} onChange={(e) => setCreateForm(prev => ({ ...prev, cloud: e.target.value }))} /></label>
            <label>Periféricos<input value={createForm.perifericos} onChange={(e) => setCreateForm(prev => ({ ...prev, perifericos: e.target.value }))} /></label>
            <label>Chamadas Duas Telas
              <select value={createForm.duasTelas} onChange={(e) => setCreateForm(prev => ({ ...prev, duasTelas: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="Sim">Sim</option>
                <option value="Nao">Nao</option>
              </select>
            </label>
            <label>Número de Série<input value={createForm.serial} onChange={(e) => setCreateForm(prev => ({ ...prev, serial: e.target.value }))} /></label>
            <label>Descrição<textarea rows="2" value={createForm.descricao} onChange={(e) => setCreateForm(prev => ({ ...prev, descricao: e.target.value }))} /></label>
            <div className="modal-actions"><button type="button" onClick={() => setCreating(false)}>Cancelar</button><button type="submit">Salvar</button></div>
          </form>
        </div>
      )}

      {movementModal && (
        <div className="modal-overlay" onClick={() => setMovementModal(null)}>
          <form className="edit-modal" onClick={(e) => e.stopPropagation()} onSubmit={salvarMovimentacao}>
            <h3>Solicitar transferência</h3>
            <p>{movementModal.nome} • Base atual: {movementModal.baseNome || movementModal.city || movementModal.organizacao || '-'}</p>
            <label>Base de destino
              <select value={movementForm.destinoBaseId} onChange={(e) => setMovementForm(prev => ({ ...prev, destinoBaseId: e.target.value }))} required>
                <option value="">Selecione</option>
                {bases
                  .filter(base => base.status === 'Ativa' && base.id !== movementModal.baseId)
                  .map(base => <option key={base.id} value={base.id}>{base.nome}</option>)}
              </select>
            </label>
            <label>Motivo da movimentação
              <textarea rows="4" value={movementForm.motivo} onChange={(e) => setMovementForm(prev => ({ ...prev, motivo: e.target.value }))} required />
            </label>
            <div className="modal-actions"><button type="button" onClick={() => setMovementModal(null)}>Cancelar</button><button type="submit">Enviar para aceite</button></div>
          </form>
        </div>
      )}

      <GerarTermoModal
        open={termModalOpen}
        onClose={() => setTermModalOpen(false)}
        devices={selectedDevices}
        onGenerated={handleTermGenerated}
      />

      {detailModal === 'aparelhos' && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="edit-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-head">
              <h3>Quantidade de Aparelhos por Setor</h3>
              <button onClick={() => exportarDetalheCSV('aparelhos_por_setor_tipo', detalhesAparelhos.bySetorTipo, ['setor', 'tipo', 'quantidade'])}>Exportar para Excel</button>
            </div>
            <div className="mini-cards">
              {detalhesAparelhos.byTipo.map(item => <div key={item.tipo} className="mini-card"><span>{item.tipo}</span><strong>{item.total}</strong></div>)}
            </div>
            <table className="inventory-table">
              <thead><tr><th>Setor</th><th>Tipo de Aparelho</th><th>Quantidade</th></tr></thead>
              <tbody>{detalhesAparelhos.bySetorTipo.map((r, i) => <tr key={`${r.setor}-${r.tipo}-${i}`}><td>{r.setor}</td><td>{r.tipo}</td><td>{r.quantidade}</td></tr>)}</tbody>
            </table>
            <div className="modal-actions"><button type="button" onClick={() => setDetailModal(null)}>Fechar</button></div>
          </div>
        </div>
      )}

      {detailModal === 'clouds' && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="edit-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-head">
              <h3>Detalhes dos Clouds Ativos</h3>
              <button onClick={() => exportarDetalheCSV('clouds_repetidos', detalhesCloud.repetidos, ['setor', 'responsavel', 'cloud'])}>Exportar para Excel</button>
            </div>
            <div className="mini-cards">
              <div className="mini-card"><span>Clouds ativos</span><strong>{detalhesCloud.totalRegistros}</strong></div>
              <div className="mini-card"><span>Tipos de cloud</span><strong>{detalhesCloud.tiposCloud}</strong></div>
              <div className="mini-card"><span>Clouds repetidos</span><strong>{detalhesCloud.cloudsRepetidos}</strong></div>
            </div>
            <table className="inventory-table">
              <thead><tr><th>Setor</th><th>Responsável</th><th>Cloud</th></tr></thead>
              <tbody>{detalhesCloud.repetidos.map((r, i) => <tr key={`${r.cloud}-${r.responsavel}-${i}`}><td>{r.setor}</td><td>{r.responsavel}</td><td>{r.cloud}</td></tr>)}</tbody>
            </table>
            <div className="modal-actions"><button type="button" onClick={() => setDetailModal(null)}>Fechar</button></div>
          </div>
        </div>
      )}

      {detailModal === 'licencas' && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="edit-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-head">
              <h3>Detalhes das Licenças Microsoft</h3>
              <button onClick={() => exportarDetalheCSV('licencas_microsoft', detalhesLicencas.rows, ['setor', 'responsavel', 'email'])}>Exportar para Excel</button>
            </div>
            <div className="mini-cards">
              <div className="mini-card"><span>Licenças</span><strong>{detalhesLicencas.totalLicencas}</strong></div>
              <div className="mini-card"><span>Setores</span><strong>{detalhesLicencas.setores}</strong></div>
              <div className="mini-card"><span>Responsáveis</span><strong>{detalhesLicencas.responsaveis}</strong></div>
            </div>
            <table className="inventory-table">
              <thead><tr><th>Setor</th><th>Responsável</th><th>Email</th></tr></thead>
              <tbody>{detalhesLicencas.rows.map((r, i) => <tr key={`${r.email}-${r.responsavel}-${i}`}><td>{r.setor}</td><td>{r.responsavel}</td><td>{r.email}</td></tr>)}</tbody>
            </table>
            <div className="modal-actions"><button type="button" onClick={() => setDetailModal(null)}>Fechar</button></div>
          </div>
        </div>
      )}
    </section>
  );
}

function isServerOnline(serverStatus) {
  return ['running', 'online'].includes(String(serverStatus?.server || '').toLowerCase());
}

function formatarDescricao(device) {
  const partes = [];
  if (device.memoria && device.memoria !== 'N/A') partes.push(device.memoria);
  if (device.disco && device.disco !== 'N/A') partes.push(device.disco);
  if (device.so && device.so !== 'N/A') partes.push(device.so);
  return partes.join(', ') || 'N/A';
}

function normalizarStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'online') return 'online';
  if (value === 'em uso') return 'emuso';
  if (value === 'offline') return 'offline';
  return 'other';
}

function getDisplayResponsible(device) {
  return device?.responsavelAtualNome || device?.adDisplayName || device?.usuario || '-';
}

function obterEmail(device) {
  if (device?.email && device.email !== 'N/A') return device.email;
  if (!device?.usuario) return '-';
  return `${device.usuario.toLowerCase().replace(/\\/g, '').replace(/\s/g, '.').replace(/carrarolog/g, '')}@carrarologistica.com.br`;
}

export default InventoryView;
