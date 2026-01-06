import { useState, useEffect } from 'react'
import './App.css'
import { getInventory, syncInventory, getServerStatus } from './api/serverApi.js'

function App() {
  const [dispositivos, setDispositivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [serverStatus, setServerStatus] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)

  const verificarServidor = async () => {
    try {
      const status = await getServerStatus()
      setServerStatus(status)
      if (status.lastUpdate) {
        setLastUpdate(new Date(status.lastUpdate))
      }
    } catch (err) {
      setServerStatus({ server: 'offline' })
    }
  }

  const carregarDados = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Buscar dados do servidor local
      const dados = await getInventory()
      setDispositivos(dados)
      await verificarServidor()
    } catch (err) {
      setError(err.message)
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const sincronizarAutomaticamente = async () => {
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

  useEffect(() => {
    // Sincronizar automaticamente ao carregar
    sincronizarAutomaticamente()
  }, [])

  // Filtrar dispositivos
  const dispositivosFiltrados = dispositivos.filter(device => {
    const matchTipo = filtroTipo === 'Todos' || device.tipo === filtroTipo
    const matchStatus = filtroStatus === 'Todos' || device.status?.toLowerCase() === filtroStatus.toLowerCase()
    return matchTipo && matchStatus
  })

  // Obter tipos únicos
  const tiposUnicos = ['Todos', ...new Set(dispositivos.map(d => d.tipo).filter(Boolean))]
  
  // Estatísticas
  const totalDispositivos = dispositivos.length
  const totalOnline = dispositivos.filter(d => d.status?.toLowerCase() === 'online').length
  const totalOffline = dispositivos.filter(d => d.status?.toLowerCase() === 'offline').length
  const totalOutros = totalDispositivos - totalOnline - totalOffline

  return (
    <div className="App">
      <header className="App-header">
        <h1>Estoque TI</h1>
        
        <div className="server-info">
          {serverStatus && (
            <div className={`status-badge ${serverStatus.server}`}>
              {serverStatus.server === 'running' ? '🟢 Servidor Online' : '🔴 Servidor Offline'}
            </div>
          )}
          {lastUpdate && (
            <div className="last-update">
              Última atualização: {lastUpdate.toLocaleString('pt-BR')}
            </div>
          )}
        </div>
        
        <div className="controls">
          <button onClick={sincronizarAutomaticamente} disabled={loading}>
            {loading ? '⏳ Sincronizando...' : '🔄 Atualizar do Action1'}
          </button>
        </div>

        {error && (
          <div className="error">
            ❌ Erro: {error}
          </div>
        )}

        <div className="filters">
          <div className="filter-group">
            <label>Tipo de aparelho</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              {tiposUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card" onClick={() => setMostrarDetalhes(!mostrarDetalhes)}>
            <div className="summary-icon">💻</div>
            <div className="summary-content">
              <div className="summary-label">Total de aparelhos</div>
              <div className="summary-value">{totalDispositivos}</div>
              <div className="summary-hint">Clique para ver o detalhamento</div>
            </div>
          </div>
          
          <div className="summary-card small">
            <div className="summary-icon">🟢</div>
            <div className="summary-content">
              <div className="summary-label">Online</div>
              <div className="summary-value">{totalOnline}</div>
            </div>
          </div>
          
          <div className="summary-card small">
            <div className="summary-icon">🔴</div>
            <div className="summary-content">
              <div className="summary-label">Offline</div>
              <div className="summary-value">{totalOffline}</div>
            </div>
          </div>
          
          {totalOutros > 0 && (
            <div className="summary-card small">
              <div className="summary-icon">⚪</div>
              <div className="summary-content">
                <div className="summary-label">Outros</div>
                <div className="summary-value">{totalOutros}</div>
              </div>
            </div>
          )}
        </div>

        {mostrarDetalhes && (
          <>
            <div className="results-info">
              Mostrando {dispositivosFiltrados.length} de {totalDispositivos} dispositivos
            </div>
                <div className="inventory-grid">
              {dispositivosFiltrados.map((device) => (
            <div key={device.id} className={`device-card ${device.status?.toLowerCase() || ''}`}>
              <h3>
                {device.nome} {device.status?.toLowerCase() === 'offline' ? '🔴' : device.status?.toLowerCase() === 'online' ? '🟢' : '⚪'}
              </h3>
              <div className="device-info">
                <p><strong>Dispositivo:</strong> {device.dispositivo || 'N/A'}</p>
                <p><strong>IP:</strong> {device.ip || 'N/A'}</p>
                <p><strong>SO:</strong> {device.so || 'N/A'}</p>
                <p><strong>Usuário:</strong> {device.usuario}</p>
                <p><strong>Status:</strong> <span className={`status ${device.status?.toLowerCase() || 'unknown'}`}>{device.status || 'Desconhecido'}</span></p>
                <p><strong>Tipo:</strong> {device.tipo || 'N/A'}</p>
                <p><strong>Org:</strong> {device.organizacao}</p>
                {device.gerenciado && <p><strong>Gerenciado:</strong> {device.gerenciado}</p>}
                <p><strong>CPU:</strong> {device.cpu || 'N/A'}</p>
                <p><strong>RAM:</strong> {device.memoria || 'N/A'}</p>
                <p><strong>Disco:</strong> {device.disco || 'N/A'}</p>
              </div>
            </div>
          ))}
            </div>
          </>
        )}

        {dispositivos.length === 0 && !loading && (
          <p>Nenhum dispositivo encontrado</p>
        )}
      </header>
    </div>
  )
}

export default App
