import { useEffect, useMemo, useState } from 'react';
import '../styles/App.css';
import AdminPanel from './AdminPanel.jsx';
import InventoryView from './InventoryView.jsx';
import {
  createAdminUser,
  createBase,
  createInventoryDevice,
  createMovement,
  deleteInventoryByIds,
  getAdminSnapshot,
  getInventory,
  getServerStatus,
  respondMovement,
  syncInventory,
  toggleBaseStatus,
  updateAdminUser,
  updateInventoryDevice
} from '../services/api.js';

const SESSION_STORAGE_KEY = 'dashboard_v2_current_user';
const TAB_STORAGE_KEY = 'dashboard_v2_active_tab';
const SECTION_STORAGE_KEY = 'dashboard_v2_active_section';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'estoque', label: 'Estoque' }
];

function App() {
  const initialRoute = getRouteState(window.location.pathname);
  const [inventory, setInventory] = useState([]);
  const [serverStatus, setServerStatus] = useState({ server: 'offline' });
  const [adminData, setAdminData] = useState({ bases: [], users: [], movements: [], reports: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(() => initialRoute.tab || localStorage.getItem(TAB_STORAGE_KEY) || 'dashboard');
  const [activeSection, setActiveSection] = useState(() => initialRoute.section || localStorage.getItem(SECTION_STORAGE_KEY) || 'visao-geral');
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem(SESSION_STORAGE_KEY) || '');

  const carregarDados = async () => {
    setLoading(true);
    setError('');
    try {
      const [devices, status, adminSnapshot] = await Promise.all([
        getInventory(),
        getServerStatus().catch(() => ({ server: 'offline' })),
        getAdminSnapshot()
      ]);

      setInventory(devices);
      setServerStatus(status || { server: 'offline' });
      setAdminData(adminSnapshot);

      const hasSelected = adminSnapshot.users.some(user => user.id === currentUserId);
      if (!hasSelected && adminSnapshot.users[0]?.id) {
        setCurrentUserId(adminSnapshot.users[0].id);
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(SECTION_STORAGE_KEY, activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (currentUserId) localStorage.setItem(SESSION_STORAGE_KEY, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteState(window.location.pathname);
      setActiveTab(route.tab);
      setActiveSection(route.section);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const nextPath = buildPath(activeTab, activeSection);
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({}, '', nextPath);
    }
  }, [activeSection, activeTab]);

  const currentUser = useMemo(() => {
    return adminData.users.find(user => user.id === currentUserId) || adminData.users[0] || null;
  }, [adminData.users, currentUserId]);

  const scopedDevices = useMemo(() => {
    if (!currentUser || currentUser.perfil === 'Administrador') return inventory;
    return inventory.filter(device => matchDeviceToUserBase(device, currentUser));
  }, [currentUser, inventory]);

  const scopedReports = useMemo(() => {
    if (!currentUser || currentUser.perfil === 'Administrador') return adminData.reports;
    return adminData.reports.filter(item => item.baseId === currentUser.baseId);
  }, [adminData.reports, currentUser]);

  const scopedBases = useMemo(() => {
    if (!currentUser || currentUser.perfil === 'Administrador') return adminData.bases;
    return adminData.bases.filter(base => base.id === currentUser.baseId);
  }, [adminData.bases, currentUser]);

  const scopedUsers = useMemo(() => {
    if (!currentUser || currentUser.perfil === 'Administrador') return adminData.users;
    return adminData.users.filter(user => user.id === currentUser.id || user.baseId === currentUser.baseId);
  }, [adminData.users, currentUser]);

  const scopedMovements = useMemo(() => {
    if (!currentUser || currentUser.perfil === 'Administrador') return adminData.movements;
    return adminData.movements.filter(item =>
      item.origemBaseId === currentUser.baseId || item.destinoBaseId === currentUser.baseId
    );
  }, [adminData.movements, currentUser]);

  const sessionLabel = currentUser
    ? `${currentUser.nome} • ${currentUser.perfil}${currentUser.baseNome && currentUser.perfil !== 'Administrador' ? ` • ${currentUser.baseNome}` : ''}`
    : 'Sem sessão';

  const runAndRefresh = async (action) => {
    setError('');
    await action();
    await carregarDados();
  };

  const handleSync = async () => {
    await runAndRefresh(() => syncInventory());
  };

  const handleCreateDevice = async (payload) => {
    await runAndRefresh(() => createInventoryDevice(payload));
  };

  const handleUpdateDevice = async (id, payload) => {
    await runAndRefresh(() => updateInventoryDevice(id, payload));
  };

  const handleDeleteDevice = async (id) => {
    await runAndRefresh(() => deleteInventoryByIds([id]));
  };

  const handleCreateBase = async (payload) => {
    await runAndRefresh(() => createBase(payload));
  };

  const handleToggleBaseStatus = async (id) => {
    await runAndRefresh(() => toggleBaseStatus(id));
  };

  const handleCreateUser = async (payload) => {
    await runAndRefresh(() => createAdminUser(payload));
  };

  const handleUpdateUser = async (id, payload) => {
    await runAndRefresh(() => updateAdminUser(id, payload));
  };

  const handleCreateMovement = async (payload) => {
    await runAndRefresh(() => createMovement(payload));
  };

  const handleRespondMovement = async (id, payload) => {
    await runAndRefresh(() => respondMovement(id, payload));
  };

  return (
    <div className="App">
      <header className="workspace-header">
        <div className="workspace-topbar">
          <div>
            <span className="eyebrow">Carraro logística</span>
            <h1>Governança do Inventário</h1>
            <p>Novo painel administrativo para usuários, bases, relatórios e movimentações com aceite.</p>
          </div>

          <div className="workspace-session">
            <label>
              Acesso atual
              <select value={currentUser?.id || ''} onChange={(e) => setCurrentUserId(e.target.value)}>
                {adminData.users.map(user => (
                  <option key={user.id} value={user.id}>{user.nome} • {user.perfil}</option>
                ))}
              </select>
            </label>
            <div className="session-box">
              <strong>{sessionLabel}</strong>
              <span>{currentUser?.status || 'Sem status'}</span>
            </div>
          </div>
        </div>

        <nav className="workspace-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={item.id === activeTab ? 'nav-pill active' : 'nav-pill'}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'dashboard' && !activeSection) setActiveSection('visao-geral');
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'dashboard' ? (
        <AdminPanel
          currentUser={currentUser}
          bases={scopedBases}
          users={scopedUsers}
          movements={scopedMovements}
          reports={scopedReports}
          devices={scopedDevices}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onCreateBase={handleCreateBase}
          onToggleBaseStatus={handleToggleBaseStatus}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onRespondMovement={handleRespondMovement}
          onOpenInventory={() => setActiveTab('estoque')}
        />
      ) : (
        <InventoryView
          devices={scopedDevices}
          allDevices={inventory}
          loading={loading}
          error={error}
          currentUser={currentUser}
          serverStatus={serverStatus}
          bases={adminData.bases}
          onSync={handleSync}
          onReload={carregarDados}
          onCreateDevice={handleCreateDevice}
          onUpdateDevice={handleUpdateDevice}
          onDeleteDevice={handleDeleteDevice}
          onCreateMovement={handleCreateMovement}
        />
      )}
    </div>
  );
}

function matchDeviceToUserBase(device, user) {
  const baseKeys = [
    user?.baseId,
    user?.baseNome
  ].filter(Boolean).map(value => String(value).trim().toLowerCase());

  const deviceKeys = [
    device?.baseId,
    device?.baseNome,
    device?.baseCodigo,
    device?.city,
    device?.organizacao
  ].filter(Boolean).map(value => String(value).trim().toLowerCase());

  return baseKeys.some(key => deviceKeys.includes(key));
}

export default App;

function getRouteState(pathname) {
  const path = String(pathname || '/').replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/dashboard') {
    return { tab: 'dashboard', section: 'visao-geral' };
  }
  if (path === '/dashboard/estoque') {
    return { tab: 'estoque', section: 'visao-geral' };
  }
  if (path.startsWith('/dashboard/admin/')) {
    const section = path.split('/').filter(Boolean)[2] || 'visao-geral';
    return { tab: 'dashboard', section };
  }
  return { tab: 'dashboard', section: 'visao-geral' };
}

function buildPath(tab, section) {
  if (tab === 'estoque') return '/dashboard/estoque';
  if (!section || section === 'visao-geral') return '/dashboard';
  return `/dashboard/admin/${section}`;
}
