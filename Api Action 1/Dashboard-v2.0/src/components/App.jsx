import { useEffect, useMemo, useState } from 'react'
import '../styles/App.css'
import GerarTermoModal from './GerarTermoModal.jsx'
import {
  SERVER_URL,
  createInventoryDevice,
  deleteInventoryByIds,
  getInventory,
  getServerStatus,
  syncInventory,
  updateInventoryDevice
} from '../services/api.js'

const BASE_SETOR_OPTIONS = ['TI', 'Frota', 'Financeiro', 'Comercial', 'RH', 'Operacao', 'Sem setor']
const BASE_TIPO_OPTIONS = ['Notebook', 'Workstation', 'Bipe', 'Celular', 'Coletor', 'Roteador', 'Switch']
const BASE_LOC_OPTIONS = ['SJP', 'SP', 'RS', 'ES', 'GOIAS', 'MINAS']

const EMPTY_EDIT = {
  adDisplayName: '',
  email: '',
  cloud: '',
  setor: '',
  city: '',
  status: '',
  dataAlteracao: '',
  descricao: ''
}

// Estado inicial do modal de criacao manual de dispositivo.
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
}

function App() {
  const [dispositivos, setDispositivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [serverStatus, setServerStatus] = useState({ server: 'offline' })
  const [editing, setEditing] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [detailModal, setDetailModal] = useState(null)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('themeMode') === 'dark')
  const [selectedIds, setSelectedIds] = useState([])
  const [termModalOpen, setTermModalOpen] = useState(false)

  // Carrega inventario e status do servidor para alinhar UI com backend.
  const carregarDados = async () => {
    setLoading(true)
    setError('')
    try {
      const dados = await getInventory()
      setDispositivos(dados)
      setSelectedIds(prev => prev.filter(id => dados.some(device => device.id === id)))
      try {
        const status = await getServerStatus()
        setServerStatus(status || { server: 'offline' })
      } catch (_) {
        setServerStatus({ server: 'offline' })
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('theme-dark', darkMode)
    localStorage.setItem('themeMode', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const hasModalOpen = Boolean(editing || creating || selectedDevice || detailModal || termModalOpen)
    if (hasModalOpen) document.body.classList.add('modal-open')
    else document.body.classList.remove('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [editing, creating, selectedDevice, detailModal, termModalOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setEditing(null)
        setCreating(false)
        setSelectedDevice(null)
        setDetailModal(null)
        setTermModalOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const tipoOptions = useMemo(
    () => Array.from(new Set([...BASE_TIPO_OPTIONS, ...dispositivos.map(d => d.tipo).filter(Boolean)])),
    [dispositivos]
  )
  const tiposUnicos = useMemo(() => ['Todos', ...tipoOptions], [tipoOptions])
  const setorOptions = useMemo(
    () => Array.from(new Set([...BASE_SETOR_OPTIONS, ...dispositivos.map(d => d.setor).filter(Boolean)])),
    [dispositivos]
  )
  const cityOptions = useMemo(
    () => Array.from(new Set([...BASE_LOC_OPTIONS, ...dispositivos.map(d => d.city).filter(Boolean)])),
    [dispositivos]
  )

  // Derivacao principal da tabela: combina busca com filtros de tipo/status.
  const dispositivosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase()
    return dispositivos.filter(device => {
      const matchTipo = filtroTipo === 'Todos' || device.tipo === filtroTipo
      const matchStatus = filtroStatus === 'Todos' || String(device.status || '').toLowerCase() === filtroStatus.toLowerCase()
      const matchBusca = !termo ||
        device.nome?.toLowerCase().includes(termo) ||
        device.adDisplayName?.toLowerCase().includes(termo) ||
        device.usuario?.toLowerCase().includes(termo) ||
        device.email?.toLowerCase().includes(termo) ||
        device.cloud?.toLowerCase().includes(termo) ||
        device.setor?.toLowerCase().includes(termo) ||
        device.responsavelAtualNome?.toLowerCase().includes(termo) ||
        device.responsavelAtualDocumento?.toLowerCase().includes(termo) ||
        device.ip?.toLowerCase().includes(termo) ||
        device.organizacao?.toLowerCase().includes(termo)
      return matchTipo && matchStatus && matchBusca
    })
  }, [dispositivos, filtroTipo, filtroStatus, busca])

  const selectedDevices = useMemo(
    () => dispositivos.filter(device => selectedIds.includes(device.id)),
    [dispositivos, selectedIds]
  )

  const statsTop = useMemo(() => ({
    total: dispositivos.length,
    online: dispositivos.filter(d => String(d.status || '').toLowerCase() === 'online').length,
    offline: dispositivos.filter(d => String(d.status || '').toLowerCase() === 'offline').length,
    notebooks: dispositivos.filter(d => d.tipo === 'Notebook').length,
    workstations: dispositivos.filter(d => d.tipo === 'Workstation').length
  }), [dispositivos])

  // Cards de resumo no topo com metricas operacionais consolidadas.
  const cards = useMemo(() => {
    const clouds = new Set()
    const licenses = new Set()
    dispositivosFiltrados.forEach(d => {
      if (d.cloud && d.cloud !== 'N/A') clouds.add(String(d.cloud).toLowerCase())
      const email = obterEmail(d)
      if (email && email !== 'N/A' && email !== '-') licenses.add(email.toLowerCase())
    })
    return { total: dispositivosFiltrados.length, cloudsAtivos: clouds.size, licencas: licenses.size }
  }, [dispositivosFiltrados])

  const grupos = useMemo(() => {
    const grouped = new Map()
    dispositivosFiltrados.forEach(device => {
      const setor = device.setor || 'Sem setor'
      if (!grouped.has(setor)) grouped.set(setor, [])
      grouped.get(setor).push(device)
    })
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [dispositivosFiltrados])

  const detalhesAparelhos = useMemo(() => {
    const byTipo = new Map()
    const bySetorTipo = new Map()
    dispositivosFiltrados.forEach(d => {
      const tipo = d.tipo || 'Nao informado'
      const setor = d.setor || 'Sem setor'
      byTipo.set(tipo, (byTipo.get(tipo) || 0) + 1)
      const key = `${setor}|||${tipo}`
      bySetorTipo.set(key, (bySetorTipo.get(key) || 0) + 1)
    })
    return {
      byTipo: Array.from(byTipo.entries()).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total),
      bySetorTipo: Array.from(bySetorTipo.entries()).map(([key, quantidade]) => {
        const [setor, tipo] = key.split('|||')
        return { setor, tipo, quantidade }
      }).sort((a, b) => b.quantidade - a.quantidade)
    }
  }, [dispositivosFiltrados])

  const detalhesCloud = useMemo(() => {
    const rows = dispositivosFiltrados
      .filter(d => d.cloud && d.cloud !== 'N/A' && d.cloud !== 'Nao informado')
      .map(d => ({
        setor: d.setor || 'Sem setor',
        responsavel: d.adDisplayName || d.usuario || '-',
        cloud: d.cloud
      }))

    const byCloud = new Map()
    rows.forEach(r => byCloud.set(String(r.cloud).toLowerCase(), (byCloud.get(String(r.cloud).toLowerCase()) || 0) + 1))
    const repetidosSet = new Set(Array.from(byCloud.entries()).filter(([, v]) => v > 1).map(([k]) => k))
    const repetidos = rows.filter(r => repetidosSet.has(String(r.cloud).toLowerCase()))

    return {
      totalRegistros: rows.length,
      tiposCloud: new Set(rows.map(r => String(r.cloud).toLowerCase())).size,
      cloudsRepetidos: repetidosSet.size,
      repetidos
    }
  }, [dispositivosFiltrados])

  const detalhesLicencas = useMemo(() => {
    const rows = dispositivosFiltrados
      .map(d => ({
        setor: d.setor || 'Sem setor',
        responsavel: d.adDisplayName || d.usuario || '-',
        email: obterEmail(d)
      }))
      .filter(r => r.email && r.email !== '-' && r.email !== 'N/A' && !String(r.email).toLowerCase().includes('nao informado'))

    const uniq = new Set()
    const dedup = rows.filter(r => {
      const key = `${r.setor}|${r.responsavel}|${String(r.email).toLowerCase()}`
      if (uniq.has(key)) return false
      uniq.add(key)
      return true
    })

    return {
      totalLicencas: new Set(dedup.map(r => String(r.email).toLowerCase())).size,
      setores: new Set(dedup.map(r => r.setor)).size,
      responsaveis: new Set(dedup.map(r => String(r.responsavel).toLowerCase())).size,
      rows: dedup
    }
  }, [dispositivosFiltrados])

  const handleSync = async () => {
    setLoading(true)
    setError('')
    try {
      await syncInventory()
      await carregarDados()
    } catch (err) {
      setError(err.message || 'Erro na sincronizacao')
      setLoading(false)
    }
  }

  const abrirEdicao = (device) => {
    setEditing(device)
    setEditForm({
      adDisplayName: device.adDisplayName || device.usuario || '',
      email: device.email || '',
      cloud: device.cloud || '',
      setor: device.setor || '',
      city: device.city || '',
      status: device.status || '',
      dataAlteracao: device.dataAlteracao || '',
      descricao: device.descricao || formatarDescricao(device)
    })
  }

  // Persiste edicao do modal e aplica update otimista no estado local.
  const salvarEdicao = async (e) => {
    e.preventDefault()
    if (!editing) return
    const payload = {
      adDisplayName: editForm.adDisplayName,
      usuario: editForm.adDisplayName,
      email: editForm.email,
      cloud: editForm.cloud,
      setor: editForm.setor,
      city: editForm.city,
      status: editForm.status,
      dataAlteracao: editForm.dataAlteracao,
      descricao: editForm.descricao
    }
    try {
      await updateInventoryDevice(editing.id, payload)
      setDispositivos(prev => prev.map(d => (d.id === editing.id ? { ...d, ...payload } : d)))
      setEditing(null)
      setEditForm(EMPTY_EDIT)
    } catch (err) {
      setError(err.message || 'Erro ao salvar alteracao')
    }
  }

  const excluirDispositivo = async (device) => {
    const ok = window.confirm(`Excluir ${device.nome || device.id}?`)
    if (!ok) return
    try {
      await deleteInventoryByIds([device.id])
      setDispositivos(prev => prev.filter(d => d.id !== device.id))
    } catch (err) {
      setError(err.message || 'Erro ao excluir')
    }
  }

  const abrirCriacao = () => {
    setCreateForm({ ...EMPTY_CREATE, dataAlteracao: new Date().toLocaleString('pt-BR') })
    setCreating(true)
  }

  // Valida campos obrigatorios e persiste criacao manual de dispositivo.
  const salvarCriacao = async (e) => {
    e.preventDefault()
    if (!createForm.setor || !createForm.tipo || !createForm.city) {
      setError('Selecione Setor, Tipo de Aparelho e Localizacao Fisica')
      return
    }
    try {
      const payload = { ...createForm, usuario: createForm.adDisplayName }
      const result = await createInventoryDevice(payload)
      setDispositivos(prev => [result?.data || payload, ...prev])
      setCreating(false)
      setCreateForm(EMPTY_CREATE)
    } catch (err) {
      setError(err.message || 'Erro ao criar equipamento')
    }
  }

  const exportarCSV = () => window.open(`${SERVER_URL}/api/export/csv`, '_blank')

  const toggleDeviceSelection = (deviceId) => {
    setSelectedIds(prev =>
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    )
  }

  const toggleSetorSelection = (items) => {
    const ids = items.map(device => device.id)
    const allSelected = ids.every(id => selectedIds.includes(id))
    setSelectedIds(prev => {
      if (allSelected) {
        return prev.filter(id => !ids.includes(id))
      }
      return Array.from(new Set([...prev, ...ids]))
    })
  }

  const abrirTermoModal = () => {
    if (selectedIds.length === 0) return
    setTermModalOpen(true)
  }

  const handleTermGenerated = async () => {
    setSelectedIds([])
    await carregarDados()
  }

  const exportarDetalheCSV = (nome, linhas, headers) => {
    const csv = [headers.join(','), ...linhas.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nome}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="App">
      <header className="App-header">
        <section className="hero-header">
          <div className="hero-top">
            <div className="hero-title">
              <img src="/assets/logocarraro.png" alt="Carraro" />
              <h1>Inventario TI</h1>
            </div>
            <div className="hero-actions">
              <button className="theme-toggle" onClick={() => setDarkMode(prev => !prev)}>{darkMode ? 'Modo claro' : 'Modo noturno'}</button>
              <button className="hero-action" onClick={handleSync} disabled={loading}>{loading ? 'Sincronizando...' : 'Sincronizar'}</button>
            </div>
          </div>

          <div className="server-line">
            <span className={`dot ${isServerOnline(serverStatus) ? 'ok' : 'fail'}`} />
            <strong>Servidor {isServerOnline(serverStatus) ? 'Online' : 'Offline'}</strong>
          </div>

          <div className="top-stats">
            <span>Total: <strong>{statsTop.total}</strong></span>
            <span>Online: <strong>{statsTop.online}</strong></span>
            <span>Offline: <strong>{statsTop.offline}</strong></span>
            <span>Notebooks: <strong>{statsTop.notebooks}</strong></span>
            <span>Workstations: <strong>{statsTop.workstations}</strong></span>
          </div>

          <div className="hero-filters">
            <input className="search-input dark" type="text" placeholder="Buscar por nome, usuario, IP ou organizacao..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>{tiposUnicos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</select>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="Todos">Todos os Status</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Em Uso">Em Uso</option>
            </select>
            <button className="btn-term-top" onClick={abrirTermoModal} disabled={selectedIds.length === 0}>
              {selectedIds.length > 0 ? `Gerar termo (${selectedIds.length})` : 'Gerar termo'}
            </button>
            <button className="btn-export-top" onClick={exportarCSV}>Exportar CSV</button>
            <button className="btn-add-top" onClick={abrirCriacao}>Adicionar equipamento</button>
          </div>

          <div className="results-line">Mostrando {dispositivosFiltrados.length} de {dispositivos.length} dispositivos</div>
        </section>

        <section className="cards-grid">
          <article className="info-card card-clickable" onClick={() => setDetailModal('aparelhos')}>
            <p>Total de aparelhos</p><strong>{cards.total}</strong><span>Clique para ver o detalhamento</span>
          </article>
          <article className="info-card card-clickable" onClick={() => setDetailModal('clouds')}>
            <p>Clouds ativos</p><strong>{cards.cloudsAtivos}</strong><span>Clique para ver o detalhamento</span>
          </article>
          <article className="info-card card-clickable" onClick={() => setDetailModal('licencas')}>
            <p>Licencas Microsoft</p><strong>{cards.licencas}</strong><span>Clique para ver o detalhamento</span>
          </article>
        </section>

        {error && <div className="error">{error}</div>}
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
                    <th>Tipo</th><th>Responsavel</th><th>Email</th><th>Cloud</th><th>Descricao</th><th>Status</th><th>Localizacao</th><th>Ultima alteracao</th><th>Acoes</th>
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
                      <td>{getDisplayResponsible(device)}</td>
                      <td>{obterEmail(device)}</td>
                      <td>{device.cloud || '-'}</td>
                      <td>{device.descricao || formatarDescricao(device)}</td>
                      <td className="status-col"><span className={`badge-status ${normalizarStatus(device.status)}`}>{device.status || '-'}</span></td>
                      <td>{device.city || device.organizacao || '-'}</td>
                      <td>{device.dataAlteracao || '-'}</td>
                      <td className="acoes">
                        <button className="btn-edit" onClick={(e) => { e.stopPropagation(); abrirEdicao(device) }}>Editar</button>
                        <button className="btn-remove" onClick={(e) => { e.stopPropagation(); excluirDispositivo(device) }}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </header>

      {selectedDevice && (
        <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes do Equipamento</h3>
            <p><strong>Tipo:</strong> {selectedDevice.tipo || '-'}</p>
            <p><strong>Responsavel:</strong> {getDisplayResponsible(selectedDevice)}</p>
            <p><strong>Email:</strong> {obterEmail(selectedDevice)}</p>
            <p><strong>Cloud:</strong> {selectedDevice.cloud || '-'}</p>
            <p><strong>Descricao:</strong> {selectedDevice.descricao || formatarDescricao(selectedDevice)}</p>
            <p><strong>Localizacao Fisica:</strong> {selectedDevice.city || selectedDevice.organizacao || '-'}</p>
            <p><strong>Obs adicional:</strong> {selectedDevice.hostname || selectedDevice.nome || '-'}</p>
            <p><strong>Numero serie:</strong> {selectedDevice.serial || '-'}</p>
            <div className="modal-actions"><button type="button" onClick={() => setSelectedDevice(null)}>Fechar</button></div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <form className="edit-modal" onClick={(e) => e.stopPropagation()} onSubmit={salvarEdicao}>
            <h3>Editar dispositivo</h3>
            <p>{editing.nome}</p>
            <label>Responsavel<input value={editForm.adDisplayName} onChange={(e) => setEditForm(prev => ({ ...prev, adDisplayName: e.target.value }))} /></label>
            <label>Email<input value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} /></label>
            <label>Cloud<input value={editForm.cloud} onChange={(e) => setEditForm(prev => ({ ...prev, cloud: e.target.value }))} /></label>
            <label>Setor
              <select value={editForm.setor} onChange={(e) => setEditForm(prev => ({ ...prev, setor: e.target.value }))}>
                <option value="">Selecione</option>
                {setorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>Localizacao
              <select value={editForm.city} onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}>
                <option value="">Selecione</option>
                {cityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>Status<select value={editForm.status} onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}><option value="Online">Online</option><option value="Offline">Offline</option><option value="Em Uso">Em Uso</option></select></label>
            <label>Data alteracao<input value={editForm.dataAlteracao} onChange={(e) => setEditForm(prev => ({ ...prev, dataAlteracao: e.target.value }))} /></label>
            <label>Descricao<textarea rows="2" value={editForm.descricao} onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))} /></label>
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
            <label>Localizacao Fisica
              <select value={createForm.city} onChange={(e) => setCreateForm(prev => ({ ...prev, city: e.target.value }))} required>
                <option value="">Selecione</option>
                {cityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>HostName<input value={createForm.hostname} onChange={(e) => setCreateForm(prev => ({ ...prev, hostname: e.target.value }))} /></label>
            <label>Email Utilizado<input value={createForm.email} onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))} /></label>
            <label>Pessoa Responsavel<input value={createForm.adDisplayName} onChange={(e) => setCreateForm(prev => ({ ...prev, adDisplayName: e.target.value }))} /></label>
            <label>Cloud Utilizado<input value={createForm.cloud} onChange={(e) => setCreateForm(prev => ({ ...prev, cloud: e.target.value }))} /></label>
            <label>Perifericos<input value={createForm.perifericos} onChange={(e) => setCreateForm(prev => ({ ...prev, perifericos: e.target.value }))} /></label>
            <label>Chamadas Duas Telas
              <select value={createForm.duasTelas} onChange={(e) => setCreateForm(prev => ({ ...prev, duasTelas: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="Sim">Sim</option>
                <option value="Nao">Nao</option>
              </select>
            </label>
            <label>Numero de Serie<input value={createForm.serial} onChange={(e) => setCreateForm(prev => ({ ...prev, serial: e.target.value }))} /></label>
            <label>Descricao<textarea rows="2" value={createForm.descricao} onChange={(e) => setCreateForm(prev => ({ ...prev, descricao: e.target.value }))} /></label>
            <div className="modal-actions"><button type="button" onClick={() => setCreating(false)}>Cancelar</button><button type="submit">Salvar</button></div>
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
              <thead><tr><th>Setor</th><th>Responsavel</th><th>Cloud</th></tr></thead>
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
              <h3>Detalhes das Licencas Microsoft</h3>
              <button onClick={() => exportarDetalheCSV('licencas_microsoft', detalhesLicencas.rows, ['setor', 'responsavel', 'email'])}>Exportar para Excel</button>
            </div>
            <div className="mini-cards">
              <div className="mini-card"><span>Licencas</span><strong>{detalhesLicencas.totalLicencas}</strong></div>
              <div className="mini-card"><span>Setores</span><strong>{detalhesLicencas.setores}</strong></div>
              <div className="mini-card"><span>Responsaveis</span><strong>{detalhesLicencas.responsaveis}</strong></div>
            </div>
            <table className="inventory-table">
              <thead><tr><th>Setor</th><th>Responsavel</th><th>Email</th></tr></thead>
              <tbody>{detalhesLicencas.rows.map((r, i) => <tr key={`${r.email}-${r.responsavel}-${i}`}><td>{r.setor}</td><td>{r.responsavel}</td><td>{r.email}</td></tr>)}</tbody>
            </table>
            <div className="modal-actions"><button type="button" onClick={() => setDetailModal(null)}>Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

function isServerOnline(serverStatus) {
  return ['running', 'online'].includes(String(serverStatus?.server || '').toLowerCase())
}

// Monta descricao compacta de hardware quando a descricao estiver vazia.
function formatarDescricao(device) {
  const partes = []
  if (device.memoria && device.memoria !== 'N/A') partes.push(device.memoria)
  if (device.disco && device.disco !== 'N/A') partes.push(device.disco)
  if (device.so && device.so !== 'N/A') partes.push(device.so)
  return partes.join(', ') || 'N/A'
}

function normalizarStatus(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'online') return 'online'
  if (value === 'em uso') return 'emuso'
  if (value === 'offline') return 'offline'
  return 'other'
}

function getDisplayResponsible(device) {
  return device?.responsavelAtualNome || device?.adDisplayName || device?.usuario || '-'
}

// Usa email salvo; se ausente, deriva padrao corporativo pelo usuario.
function obterEmail(device) {
  if (device?.email && device.email !== 'N/A') return device.email
  if (!device?.usuario) return '-'
  return `${device.usuario.toLowerCase().replace(/\\/g, '').replace(/\s/g, '.').replace(/carrarolog/g, '')}@carrarologistica.com.br`
}

export default App
