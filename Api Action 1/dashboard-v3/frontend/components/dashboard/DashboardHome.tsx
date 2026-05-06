'use client';

import Link from 'next/link';

type Mov = Record<string, unknown>;

export default function DashboardHome({
  userName, userRole, baseName, totalAtivos, totalManutencao, totalPendentes, totalSolicitacoes, notificacoes, ultimasMovimentacoes,
}: {
  userName: string;
  userRole: string;
  baseName: string;
  totalAtivos: number;
  totalManutencao: number;
  totalPendentes: number;
  totalSolicitacoes: number;
  notificacoes: Mov[];
  ultimasMovimentacoes: Mov[];
}) {
  const isAdmin = userRole === 'ADMIN';
  const isMaintenance = userRole === 'MANUTENCAO';
  const canSeeAllBases = userRole === 'ADMIN' || userRole === 'GERENTE';
  const roleLabel = isAdmin ? 'Administrador Global' : userRole === 'GERENTE' ? 'Gerente' : isMaintenance ? 'Manutenção' : 'Gestor de Base';
  
  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador Global',
    GERENTE: 'Gerente',
    MANUTENCAO: 'Manutenção',
  };
  const roleLabel = roleLabels[userRole] || 'Gestor de Base';

  const atalhos = [
    { label: 'Listagem de equipamentos', href: '/dashboard/equipamentos' },
    { label: 'Pendências e aprovações', href: '/dashboard/movimentacoes' },
    ...(!isMaintenance ? [{ label: 'Solicitações de equipamentos', href: '/dashboard/solicitacoes' }] : []),
    ...(isAdmin ? [
      { label: 'Gestão de usuários', href: '/dashboard/admin/usuarios' },
      { label: 'Gestão de bases', href: '/dashboard/admin/bases' },
    ] : []),
    ...(!isMaintenance ? [{ label: 'Relatórios de estoque', href: '/dashboard/relatorios' }] : []),
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Painel Operacional</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Visão executiva do inventário</h2>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{roleLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumo Diário</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Olá, {userName}. {isMaintenance ? 'A fila central de manutenção está pronta para triagem e devolução.' : `O inventário de visão ${canSeeAllBases ? 'global' : 'da sua base'} está sob controle.`}
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            {isMaintenance
               ? 'Use este painel para aceitar equipamentos enviados à manutenção, registrar diagnóstico, devolver para a base e concluir baixas rastreadas.'
              : 'Use este painel para acompanhar capacidade operacional, pendências de aceite e os Últimos movimentos que exigem rastreabilidade.'}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/dashboard/equipamentos"
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Ver equipamentos
            </Link>
            {!isMaintenance ? (
              <Link href="/api/export/csv" target="_blank"
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Exportar inventário
              </Link>
            ) : null}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Leitura Rápida</p>
          <div>
            <p className="text-xs text-gray-500 mb-1">Escopo ativo</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{baseName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Pendências no funil</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {totalPendentes} movimentação(ões)
            </p>
          </div>
          {!isMaintenance ? (
            <div>
              <p className="text-xs text-gray-500 mb-1">Solicitações em aberto</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalSolicitacoes}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-5 text-white">
          <p className="text-sm text-gray-400 mb-1">Equipamentos ativos no recorte</p>
          <p className="text-4xl font-bold">{totalAtivos}</p>
        </div>
        <div className="bg-orange-500 rounded-2xl p-5 text-white">
          <p className="text-sm text-orange-100 mb-1">Itens em manutenção</p>
          <p className="text-4xl font-bold">{totalManutencao}</p>
        </div>
        <div className="bg-emerald-600 rounded-2xl p-5 text-white">
          <p className="text-sm text-emerald-100 mb-1">{isMaintenance ? 'Na fila da manutenção' : 'Aguardando aceite'}</p>
          <p className="text-4xl font-bold">{totalPendentes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Últimas movimentações</h4>
              <p className="text-xs text-gray-500">Fila recente para acompanhamento operacional e validação de consistência.</p>
            </div>
            <Link href="/dashboard/movimentacoes" className="text-sm text-blue-600 hover:underline whitespace-nowrap ml-4">
              Abrir módulo
            </Link>
          </div>
          {ultimasMovimentacoes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma movimentação recente encontrada para este escopo.</p>
          ) : (
            <div className="space-y-2">
              {ultimasMovimentacoes.map(m => (
                <div key={String(m._id)} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{String(m.deviceNome || '-')}</span>
                    <span className="text-gray-400 ml-2">{String(m.baseOrigemNome || '')} → {String(m.baseDestinoNome || '')}</span>
                  </div>
                  <StatusBadge status={String(m.status)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {notificacoes.length > 0 ? 'Notificações da operação' : 'Atalhos operacionais'}
          </h4>
          <p className="text-xs text-gray-500 mb-4">
            {notificacoes.length > 0
               ? 'Avisos vinculados à sua base e às movimentações concluídas.'
              : 'Ações mais frequentes para o primeiro ciclo do novo shell.'}
          </p>
          <div className="space-y-2">
            {notificacoes.length > 0 ? notificacoes.slice(0, 5).map(item => (
              <div key={String(item._id)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{String(item.titulo || 'Notificação')}</p>
                <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">{String(item.mensagem || '')}</p>
              </div>
            )) : atalhos.map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className="text-xs text-blue-600 group-hover:underline">Abrir</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    APROVADA: 'bg-green-100 text-green-800',
    REJEITADA: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
