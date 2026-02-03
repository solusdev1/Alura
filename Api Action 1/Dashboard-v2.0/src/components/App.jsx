import { useState, useEffect } from 'react'
import '../styles/App.css'
import { getInventory, syncInventory, getServerStatus, deleteInventoryByIds } from '../services/api.js'

function App() { // Componente principal da aplicação
  const [dispositivos, setDispositivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [serverStatus, setServerStatus] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState({ campo: 'tipo', direcao: 'asc' })
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [columnWidths, setColumnWidths] = useState({
    select: 50,
    tipo: 120,
    responsavel: 150,
    email: 250,
    nome: 200,
    descricao: 300,
    status: 120,
    localizacao: 150
  }) // Larguras iniciais das colunas
  const [isResizing, setIsResizing] = useState(null)
  const [tableHeight, setTableHeight] = useState(500)
  const [isResizingHeight, setIsResizingHeight] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(null)
  const [isResizingHeader, setIsResizingHeader] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved === 'true'
  })

  const handleOrdenar = (campo) => { // Função para ordenar por coluna
    setOrdenacao(prev => ({
      campo: campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleMouseDown = (e, column) => { // Função para redimensionar colunas
    e.preventDefault()
    e.stopPropagation()
    setIsResizing({ column, startX: e.pageX, startWidth: columnWidths[column] })
  }

  useEffect(() => { // Redimensionar colunas
    const handleMouseMove = (e) => { // Função para redimensionar colunas
      if (!isResizing) return
      const diff = e.pageX - isResizing.startX
      const newWidth = Math.max(50, isResizing.startWidth + diff)
      setColumnWidths(prev => ({ ...prev, [isResizing.column]: newWidth }))
    }

    const handleMouseUp = () => {
      setIsResizing(null)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleHeightMouseDown = (e) => { // Função para redimensionar altura da tabela
    e.preventDefault()
    setIsResizingHeight({ startY: e.pageY, startHeight: tableHeight })
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingHeight) return
      const diff = e.pageY - isResizingHeight.startY
      const newHeight = Math.max(200, isResizingHeight.startHeight + diff)
      setTableHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizingHeight(false)
    }

    if (isResizingHeight) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingHeight])

  const handleHeaderMouseDown = (e) => {
    e.preventDefault()
    setIsResizingHeader({ startY: e.pageY, startHeight: headerHeight || 0 })
  }

  useEffect(() => { // Redimensionar altura do cabeçalho
    const handleMouseMove = (e) => {
      if (!isResizingHeader) return
      const diff = e.pageY - isResizingHeader.startY
      const newHeight = Math.max(50, isResizingHeader.startHeight + diff)
      setHeaderHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizingHeader(false)
    }

    if (isResizingHeader) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingHeader])

  const verificarServidor = async () => { // Verificar status do servidor
    try {
      const status = await getServerStatus()
      setServerStatus(status)
      if (status.lastSync) {
        setLastUpdate(new Date(status.lastSync))
      }
    } catch (err) {
      setServerStatus({ server: 'offline' })
    }
  }

  const carregarDados = async () => { // Carregar dados do inventário
    setLoading(true)
    setError(null)
    
    try {
      // Buscar dados do servidor local
      const dados = await getInventory()
      setDispositivos(dados)
      setSelectedIds(new Set())
      await verificarServidor()
    } catch (err) {
      setError(err.message)
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const sincronizarAutomaticamente = async () => { // Sincronizar automaticamente com Action1
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Sincronizando automaticamente com Action1...')
      const result = await syncInventory()
      console.log('✅ Sincronização concluída:', result)
      
      // Carregar dados após sincronizar
      await carregarDados()
    } catch (err) {
      setError(`Erro na sincronização: ${err.message}`)
      console.error('Erro ao sincronizar:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { // Carregar dados ao montar o componente
    // Apenas carregar dados existentes ao iniciar
    // Não sincronizar automaticamente
    carregarDados()
  }, [])

  useEffect(() => { // Aplicar dark mode
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // Filtrar dispositivos
  const dispositivosFiltrados = dispositivos.filter(device => { // Função para filtrar dispositivos
    const matchTipo = filtroTipo === 'Todos' || device.tipo === filtroTipo
    const matchStatus = filtroStatus === 'Todos' || device.status?.toLowerCase() === filtroStatus.toLowerCase()
    const matchBusca = busca === '' || 
      device.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      device.usuario?.toLowerCase().includes(busca.toLowerCase()) ||
      device.adDisplayName?.toLowerCase().includes(busca.toLowerCase()) ||
      device.ip?.toLowerCase().includes(busca.toLowerCase()) ||
      device.organizacao?.toLowerCase().includes(busca.toLowerCase()) ||
      device.city?.toLowerCase().includes(busca.toLowerCase())
    return matchTipo && matchStatus && matchBusca
  }).sort((a, b) => {
    let valorA, valorB;
    
    switch(ordenacao.campo) { // Definir valores para ordenação
      case 'tipo':
        valorA = a.tipo || '';
        valorB = b.tipo || '';
        break;
      case 'responsavel':
        valorA = a.adDisplayName || a.usuario || '';
        valorB = b.adDisplayName || b.usuario || '';
        break;
      case 'nome':
        valorA = a.nome || '';
        valorB = b.nome || '';
        break;
      case 'status':
        valorA = a.status || '';
        valorB = b.status || '';
        break;
      case 'localizacao':
        valorA = a.city || a.organizacao || '';
        valorB = b.city || b.organizacao || '';
        break;
      case 'data':
        valorA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
        valorB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
        break;
      default:
        return 0;
    }
    
    if (typeof valorA === 'string') {
      valorA = valorA.toLowerCase();
      valorB = valorB.toLowerCase();
    }
    
    if (ordenacao.direcao === 'asc') {
      return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
    } else {
      return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
    }
  })

  const isAllVisibleSelected = dispositivosFiltrados.length > 0 &&
    dispositivosFiltrados.every(d => selectedIds.has(d.id))

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (isAllVisibleSelected) {
        dispositivosFiltrados.forEach(d => next.delete(d.id))
      } else {
        dispositivosFiltrados.forEach(d => next.add(d.id))
      }
      return next
    })
  }

  const limparSelecao = () => setSelectedIds(new Set())

  const excluirSelecionados = async () => {
    if (selectedIds.size === 0) return
    const quantidade = selectedIds.size
    const ok = window.confirm(`Excluir ${quantidade} dispositivo(s) do dashboard? Essa ação não pode ser desfeita.`)
    if (!ok) return

    setLoading(true)
    setError(null)
    try {
      const ids = Array.from(selectedIds)
      await deleteInventoryByIds(ids)
      setDispositivos(prev => prev.filter(d => !selectedIds.has(d.id)))
      limparSelecao()
    } catch (err) {
      setError(`Erro ao excluir: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const abrirDetalhes = (device) => {
    setSelectedDevice(device)
  }

  const fecharDetalhes = () => {
    setSelectedDevice(null)
  }

  // Obter tipos únicos
  const tiposUnicos = ['Todos', ...new Set(dispositivos.map(d => d.tipo).filter(Boolean))]
  
  // Estatísticas
  const totalDispositivos = dispositivos.length
  const totalOnline = dispositivos.filter(d => d.status?.toLowerCase() === 'online').length
  const totalOffline = dispositivos.filter(d => d.status?.toLowerCase() === 'offline').length
  const totalNotebooks = dispositivos.filter(d => d.tipo === 'Notebook').length
  const totalWorkstations = dispositivos.filter(d => d.tipo === 'Workstation').length
  
  // Formatar descrição do dispositivo
  const formatarDescricao = (device) => { // Função para formatar descrição
    const partes = []
    if (device.memoria && device.memoria !== 'N/A') partes.push(device.memoria)
    if (device.disco && device.disco !== 'N/A') partes.push(device.disco)
    if (device.so && device.so !== 'N/A') partes.push(device.so)
    return partes.join(', ') || 'N/A'
  }

  // Exportar para CSV
  const exportarCSV = () => {
    window.open('http://localhost:3002/api/export/csv', '_blank')
  }

  const obterEmail = (device) => {
    if (!device?.usuario) return 'N/A'
    return `${device.usuario.toLowerCase().replace(/\\/g, '').replace(/\s/g, '.').replace(/carrarolog/g, '')}@carrarologistica.com.br`
  }

  const obterCloud = (device) => {
    return device?.cloudEmail || device?.cloud || 'N/A'
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-title-row">
          <h1>📊 Inventário TI</h1>
          <button 
            onClick={toggleDarkMode} 
            className="dark-mode-toggle"
            title={darkMode ? "Ativar modo claro" : "Ativar modo noturno"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="header-content" style={headerHeight ? {height: headerHeight, overflow: 'auto'} : {}}>
        <div className="server-info">
          {serverStatus && (
            <>
              <div className={`status-badge ${serverStatus.server}`}>
                {serverStatus.server === 'running' ? '🟢 Servidor Online' : '🔴 Servidor Offline'}
                {serverStatus.version && ` v${serverStatus.version}`}
              </div>
              {serverStatus.database && (
                <div className="db-badge">
                  💾 {serverStatus.database.toUpperCase()}
                </div>
              )}
            </>
          )}
          {lastUpdate && (
            <div className="last-update">
              Última sincronização: {lastUpdate.toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        {error && (
          <div className="error">
            ❌ {error}
          </div>
        )}

        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{totalDispositivos}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">🟢 Online:</span>
            <span className="stat-value">{totalOnline}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">🔴 Offline:</span>
            <span className="stat-value">{totalOffline}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">💻 Notebooks:</span>
            <span className="stat-value">{totalNotebooks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">🖥️ Workstations:</span>
            <span className="stat-value">{totalWorkstations}</span>
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <input 
              type="text" 
              placeholder="🔍 Buscar por nome, usuário, IP ou organização..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              {tiposUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="Todos">Todos os Status</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div className="filter-group">
            <button onClick={exportarCSV} className="btn-export" title="Exportar para CSV">
              📥 Exportar CSV
            </button>
          
          {selectedIds.size > 0 && (
            <div className="filter-group">
              <button 
                onClick={excluirSelecionados} 
                className="btn-delete" 
                title="Excluir selecionados"
                disabled={loading}
              >
                Excluir ({selectedIds.size})
              </button>
            </div>
          )}
          </div>
        </div>

        <div className="results-info">
          Mostrando {dispositivosFiltrados.length} de {totalDispositivos} dispositivos
          {selectedIds.size > 0 && ` â€¢ Selecionados: ${selectedIds.size}`}
        </div>
        </div>

        <div className="header-resize-handle" onMouseDown={handleHeaderMouseDown}>
          <div className="resize-indicator">⋮</div>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <div className="table-wrapper">
            <div className="table-container" style={{height: tableHeight, overflow: 'auto'}}>
              <table className="inventory-table">
              <thead>
                <tr>
                    <th style={{width: columnWidths.select, position: 'relative'}}>
                      <input
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        title="Selecionar todos"
                      />
                      <div className="resize-handle" onMouseDown={(e) => handleMouseDown(e, 'select')} />
                    </th>
                  <th style={{width: columnWidths.tipo, position: 'relative'}}>
                    <div onClick={() => handleOrdenar('tipo')} style={{cursor: 'pointer', paddingRight: '10px'}}>
                      Tipo {ordenacao.campo === 'tipo' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                    </div>
                    <div className="resize-handle" onMouseDown={(e) => handleMouseDown(e, 'tipo')} />
                  </th>
                  <th style={{width: columnWidths.responsavel, position: 'relative'}}>
                    <div onClick={() => handleOrdenar('responsavel')} style={{cursor: 'pointer', paddingRight: '10px'}}>
                      Responsável {ordenacao.campo === 'responsavel' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                    </div>
                    <div className="resize-handle" onMouseDown={(e) => handleMouseDown(e, 'responsavel')} />
                  </th>
                  <th style={{width: columnWidths.email, position: 'relative'}}>
                    <div style={{paddingRight: '10px'}}>Email</div>
                    <div className="resize-handle" onMouseDown={(e) => handleMouseDown(e, 'email')} />
                  </th>
                  <th style={{width: columnWidths.nome, position: 'relative'}}>
                    <div onClick={() => handleOrdenar('nome')} style={{cursor: 'pointer', paddingRight: '10px'}}>
                      Nome do Dispositivo {ordenacao.campo === 'nome' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                    </div>
                    <div className="resize-handle" onMouseDown={(e) => handleMouseDown(e, 'nome')} />
                  </th>
                  <th style={{width: columnWidths.descricao, position: 'relative'}}>
                    <div style={{paddingRight: '10px'}}>Descrição</div>
                    <div className="resize-handle" onMouseDown={(e) => handleMouseDown(e, 'descricao')} />
                  </th>
                  <th style={{width: columnWidths.status, position: 'relative'}}>
                    <div onClick={() => handleOrdenar('status')} style={{cursor: 'pointer', paddingRight: '10px'}}>
                      Status {ordenacao.campo === 'status' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                    </div>
                    <div className="resize-handle" onMouseDown={(e) => handleMouseDown(e, 'status')} />
                  </th>
                  <th style={{width: columnWidths.localizacao, position: 'relative'}}>
                    <div onClick={() => handleOrdenar('localizacao')} style={{cursor: 'pointer', paddingRight: '10px'}}>
                      Localização {ordenacao.campo === 'localizacao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                    </div>
                    <div className="resize-handle" onMouseDown={(e) => handleMouseDown(e, 'localizacao')} />
                  </th>
                </tr>
              </thead>
              <tbody> 
                {dispositivosFiltrados.map((device) => (
                  <tr 
                    key={device.id} 
                    className={`${device.status?.toLowerCase()} ${selectedIds.has(device.id) ? 'selected' : ''}`}
                    onClick={() => abrirDetalhes(device)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(device.id)}
                        onChange={() => toggleSelect(device.id)}
                        onClick={(e) => e.stopPropagation()}
                        title="Selecionar linha"
                      />
                    </td>
                    <td><span className="badge-tipo">{device.tipo || 'N/A'}</span></td>
                    <td>{device.adDisplayName || device.usuario || 'N/A'}</td>
                    <td className="email-col">{obterEmail(device)}</td>
                    <td className="device-name">{device.nome || 'N/A'}</td>
                    <td className="description">{formatarDescricao(device)}</td>
                    <td>
                      <span className={`badge-status ${device.status?.toLowerCase()}`}>
                        {device.status === 'Online' ? '✓ Em Uso' : device.status === 'Offline' ? '○ Offline' : device.status || 'N/A'}
                      </span>
                    </td>
                    <td>{device.city || device.organizacao || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="height-resize-handle" onMouseDown={handleHeightMouseDown}>
              <div className="resize-indicator">⋮</div>
            </div>
          </div>
        )}

        {dispositivos.length === 0 && !loading && (
          <p className="empty-message">Nenhum dispositivo encontrado. Clique em "Atualizar do Action1" para sincronizar.</p>
        )}

        {selectedDevice && (
          <div className="modal-overlay" onClick={fecharDetalhes}>
            <div className="detail-card" onClick={(e) => e.stopPropagation()}>
              <div className="detail-card-header">
                <h2>Detalhes do Equipamento</h2>
                <button className="detail-close" onClick={fecharDetalhes} aria-label="Fechar">
                  X
                </button>
              </div>
              <div className="detail-card-body">
                <div className="detail-row"><span className="detail-label">Tipo:</span> {selectedDevice.tipo || 'N/A'}</div>
                <div className="detail-row"><span className="detail-label">Responsavel:</span> {selectedDevice.adDisplayName || selectedDevice.usuario || 'N/A'}</div>
                <div className="detail-row"><span className="detail-label">Email:</span> {obterEmail(selectedDevice)}</div>
                <div className="detail-row"><span className="detail-label">Cloud:</span> {obterCloud(selectedDevice)}</div>
                <div className="detail-row"><span className="detail-label">Descricao:</span> {formatarDescricao(selectedDevice)}</div>
                <div className="detail-row"><span className="detail-label">Localizacao Fisica:</span> {selectedDevice.city || selectedDevice.organizacao || 'N/A'}</div>
                <div className="detail-row"><span className="detail-label">Obs adicional:</span> {selectedDevice.dispositivo || selectedDevice.hostname || selectedDevice.nome || 'N/A'}</div>
                <div className="detail-row"><span className="detail-label">Numero serie:</span> {selectedDevice.serial || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  )
}

export default App
