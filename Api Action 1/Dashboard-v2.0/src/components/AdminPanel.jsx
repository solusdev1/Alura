import { Fragment, useMemo, useState } from 'react';

const EMPTY_BASE = { nome: '', codigo: '', tipo: 'Operacional' };
const EMPTY_USER = { nome: '', email: '', senhaTemporaria: '', perfil: 'Gestor de Base', baseId: '' };

function AdminPanel({
  currentUser,
  bases,
  users,
  movements,
  reports,
  devices,
  activeSection,
  onSectionChange,
  onCreateBase,
  onToggleBaseStatus,
  onCreateUser,
  onUpdateUser,
  onRespondMovement,
  onOpenInventory
}) {
  const [baseForm, setBaseForm] = useState(EMPTY_BASE);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [error, setError] = useState('');
  const [expandedMovementId, setExpandedMovementId] = useState('');

  const isAdmin = currentUser?.perfil === 'Administrador';

  const overview = useMemo(() => ({
    basesAtivas: reports.filter(item => item.status === 'Ativa').length,
    gestoresAtivos: users.filter(item => item.status === 'Ativo' && item.perfil === 'Gestor de Base').length,
    pendencias: movements.filter(item => item.status === 'Pendente').length,
    totalEquipamentos: devices.length
  }), [devices.length, movements, reports, users]);

  const sections = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'usuarios', label: 'Usuários' },
    { id: 'bases', label: 'Bases' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'movimentacoes', label: 'Movimentações' }
  ];

  const pendingForCurrentUser = useMemo(() => {
    if (isAdmin) return movements.filter(item => item.status === 'Pendente');
    return movements.filter(item => item.status === 'Pendente' && item.destinoBaseId === currentUser?.baseId);
  }, [currentUser?.baseId, isAdmin, movements]);

  const handleBaseSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCreateBase(baseForm);
      setBaseForm(EMPTY_BASE);
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao criar base');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCreateUser(userForm);
      setUserForm(EMPTY_USER);
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao criar usuário');
    }
  };

  const handleUserStatus = async (user) => {
    try {
      await onUpdateUser(user.id, { status: user.status === 'Ativo' ? 'Inativo' : 'Ativo' });
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao atualizar usuário');
    }
  };

  const handleRespond = async (movement, acao) => {
    try {
      await onRespondMovement(movement.id, { acao, userId: currentUser?.id });
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao responder movimentação');
    }
  };

  return (
    <section className="page-shell">
      <div className="page-intro">
        <div>
          <span className="eyebrow">Painel administrativo</span>
          <h2>{isAdmin ? 'Gestão Central de Bases e Usuários' : `Base ${currentUser?.baseNome}`}</h2>
          <p>{isAdmin ? 'Gerencie administradores, gestores, bases operacionais e todo o fluxo de movimentação.' : 'Seu acesso foi restringido à sua base, com aceite obrigatório para transferências recebidas.'}</p>
        </div>
        <button className="hero-action" onClick={onOpenInventory}>Abrir estoque</button>
      </div>

      <nav className="subnav">
        {sections.map(section => (
          <button
            key={section.id}
            className={section.id === activeSection ? 'subnav-pill active' : 'subnav-pill'}
            onClick={() => onSectionChange?.(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {(activeSection === 'visao-geral' || activeSection === 'usuarios' || activeSection === 'bases' || activeSection === 'relatorios' || activeSection === 'movimentacoes') && (
      <section className="cards-grid admin-cards">
        <article className="info-card">
          <p>Bases ativas</p>
          <strong>{overview.basesAtivas}</strong>
          <span>Operação distribuída e monitorada</span>
        </article>
        <article className="info-card">
          <p>Gestores ativos</p>
          <strong>{overview.gestoresAtivos}</strong>
          <span>Acessos segmentados por base</span>
        </article>
        <article className="info-card">
          <p>Transferências pendentes</p>
          <strong>{overview.pendencias}</strong>
          <span>Aguardando aceite da base destino</span>
        </article>
        <article className="info-card">
          <p>Equipamentos controlados</p>
          <strong>{overview.totalEquipamentos}</strong>
          <span>Visão consolidada do estoque</span>
        </article>
      </section>
      )}

      {error && <div className="error">{error}</div>}

      {isAdmin && (activeSection === 'visao-geral' || activeSection === 'usuarios') && (
        <section className="admin-grid">
          <div className="admin-panel-card">
            <div className="panel-head">
              <div>
                <h3>Gestão de Usuários</h3>
                <p>Gerencie administradores e gestores de base.</p>
              </div>
            </div>

            <form className="admin-form" onSubmit={handleUserSubmit}>
              <div className="form-grid four">
                <label>Nome
                  <input value={userForm.nome} onChange={(e) => setUserForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome completo" required />
                </label>
                <label>E-mail
                  <input value={userForm.email} onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} placeholder="usuario@empresa.com" required />
                </label>
                <label>Senha provisória
                  <input value={userForm.senhaTemporaria} onChange={(e) => setUserForm(prev => ({ ...prev, senhaTemporaria: e.target.value }))} placeholder="Senha temporária" required />
                </label>
                <label>Perfil
                  <select value={userForm.perfil} onChange={(e) => setUserForm(prev => ({ ...prev, perfil: e.target.value }))}>
                    <option value="Gestor de Base">Gestor de Base</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label className="grow">Base de vínculo
                  <select value={userForm.baseId} onChange={(e) => setUserForm(prev => ({ ...prev, baseId: e.target.value }))} disabled={userForm.perfil !== 'Gestor de Base'}>
                    <option value="">{userForm.perfil === 'Administrador' ? 'Administrador acessa todas as bases' : 'Selecione a base autorizada para este gestor'}</option>
                    {bases.filter(base => base.status === 'Ativa').map(base => (
                      <option key={base.id} value={base.id}>{base.nome}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn-primary">Salvar usuário</button>
              </div>
            </form>

            <div className="table-scroll">
              <table className="inventory-table admin-table">
                <thead>
                  <tr>
                    <th>Nome / E-mail</th>
                    <th>Perfil</th>
                    <th>Base vinculada</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.nome}</strong>
                        <div className="table-subline">{user.email}</div>
                      </td>
                      <td><span className={`tag ${user.perfil === 'Administrador' ? 'blue' : 'green'}`}>{user.perfil}</span></td>
                      <td>{user.baseNome || 'Todas as bases'}</td>
                      <td className={user.status === 'Ativo' ? 'status-ok' : 'status-fail'}>{user.status}</td>
                      <td><button className="link-action" onClick={() => handleUserStatus(user)}>{user.status === 'Ativo' ? 'Inativar' : 'Reativar'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {isAdmin && (activeSection === 'visao-geral' || activeSection === 'bases') && (
        <section className="admin-grid">
          <div className="admin-panel-card">
            <div className="panel-head">
              <div>
                <h3>Gestão de Bases</h3>
                <p>Crie e gerencie as bases operacionais e a matriz do sistema.</p>
              </div>
            </div>

            <form className="admin-form" onSubmit={handleBaseSubmit}>
              <div className="form-grid three">
                <label>Nome da base
                  <input value={baseForm.nome} onChange={(e) => setBaseForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Base Belém" required />
                </label>
                <label>Código único
                  <input value={baseForm.codigo} onChange={(e) => setBaseForm(prev => ({ ...prev, codigo: e.target.value }))} placeholder="Ex: BEL-01" required />
                </label>
                <label>Tipo de base
                  <select value={baseForm.tipo} onChange={(e) => setBaseForm(prev => ({ ...prev, tipo: e.target.value }))}>
                    <option value="Operacional">Operacional</option>
                    <option value="Matriz">Matriz</option>
                    <option value="Apoio">Apoio</option>
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar base</button>
              </div>
            </form>

            <div className="table-scroll">
              <table className="inventory-table admin-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nome da base</th>
                    <th>Tipo</th>
                    <th>Equip. (total)</th>
                    <th>Gestores cad.</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.baseId}>
                      <td><strong>{report.codigo}</strong></td>
                      <td>{report.nome}</td>
                      <td><span className="tag neutral">{report.tipo}</span></td>
                      <td>{report.totalEquipamentos}</td>
                      <td>{report.gestoresAtivos}</td>
                      <td className={report.status === 'Ativa' ? 'status-ok' : 'status-fail'}>{report.status}</td>
                      <td><button className="link-action" onClick={() => onToggleBaseStatus(report.baseId)}>{report.status === 'Ativa' ? 'Inativar' : 'Reativar'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {(activeSection === 'visao-geral' || activeSection === 'relatorios') && (
      <section className="admin-panel-card">
        <div className="panel-head">
          <div>
            <h3>Relatório por Base</h3>
            <p>Resumo operacional com equipamentos, status e pendências por base.</p>
          </div>
        </div>
        <div className="cards-grid report-cards">
          {reports.map(report => (
            <article key={report.baseId} className="info-card report-card">
              <div className="report-title">
                <strong>{report.nome}</strong>
                <span>{report.codigo}</span>
              </div>
              <p>{report.tipo} • {report.status}</p>
              <div className="report-line"><span>Equipamentos</span><strong>{report.totalEquipamentos}</strong></div>
              <div className="report-line"><span>Gestores</span><strong>{report.gestoresAtivos}</strong></div>
              <div className="report-line"><span>Pendências</span><strong>{report.transferenciasPendentes}</strong></div>
              <div className="report-line"><span>Online / Offline</span><strong>{report.online} / {report.offline}</strong></div>
            </article>
          ))}
        </div>
      </section>
      )}

      {(activeSection === 'visao-geral' || activeSection === 'movimentacoes') && (
      <section className="admin-panel-card">
        <div className="panel-head">
          <div>
            <h3>Movimentação e Histórico</h3>
            <p>Solicitações entre bases, aceite obrigatório e trilha de auditoria completa.</p>
          </div>
        </div>

        {pendingForCurrentUser.length > 0 && (
          <div className="movement-highlight">
            <strong>{pendingForCurrentUser.length}</strong>
            <span>{isAdmin ? 'transferências aguardando decisão administrativa' : 'transferências aguardando seu aceite na base de destino'}</span>
          </div>
        )}

        <div className="table-scroll">
          <table className="inventory-table admin-table">
            <thead>
              <tr>
                <th>Equipamento</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Solicitante</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(movement => {
                const canRespond = movement.status === 'Pendente' && (isAdmin || movement.destinoBaseId === currentUser?.baseId);
                const expanded = expandedMovementId === movement.id;
                return (
                  <Fragment key={movement.id}>
                    <tr>
                      <td>
                        <strong>{movement.deviceNome}</strong>
                        <div className="table-subline">{movement.tipo}</div>
                      </td>
                      <td>{movement.origemBaseNome}</td>
                      <td>{movement.destinoBaseNome}</td>
                      <td>{movement.solicitanteNome}</td>
                      <td><span className={`tag ${movement.status === 'Aceita' ? 'green' : movement.status === 'Rejeitada' ? 'red' : 'yellow'}`}>{movement.status}</span></td>
                      <td className="movement-actions">
                        {canRespond && <button className="link-action" onClick={() => handleRespond(movement, 'aceitar')}>Aceitar</button>}
                        {canRespond && <button className="link-action danger" onClick={() => handleRespond(movement, 'rejeitar')}>Rejeitar</button>}
                        <button className="link-action" onClick={() => setExpandedMovementId(expanded ? '' : movement.id)}>{expanded ? 'Ocultar histórico' : 'Ver histórico'}</button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${movement.id}-history`} className="history-row">
                        <td colSpan="6">
                          <div className="history-box">
                            <p><strong>Motivo:</strong> {movement.motivo}</p>
                            {(movement.history || []).map((entry, index) => (
                              <div key={`${movement.id}-${index}`} className="history-item">
                                <strong>{entry.status}</strong>
                                <span>{entry.descricao}</span>
                                {entry.observacao && <small>{entry.observacao}</small>}
                                <time>{formatDate(entry.data)}</time>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </section>
  );
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
}

export default AdminPanel;
