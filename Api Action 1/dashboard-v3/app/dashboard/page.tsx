import { auth } from '@/backend/auth';
import { getDb } from '@/backend/db/mongodb';
import DashboardHome from '@/frontend/components/dashboard/DashboardHome';

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as { name: string; role: string; baseName: string | null };
  const isScoped = user.role === 'GESTOR_BASE' && user.baseName;
  const isMaintenance = user.role === 'MANUTENCAO';

  const db = await getDb();
  const baseFilter: Record<string, unknown> = isMaintenance
     ? { $or: [{ baseNome: 'MANUTENCAO' }, { status: { $in: ['MANUTENCAO', 'Manutenção', 'MANUTENÇÃO'] } }] }
    : isScoped
      ? { $or: [{ baseNome: user.baseName }, { $and: [{ baseNome: { $exists: false } }, { setor: user.baseName }] }] }
      : {};

  const [totalAtivos, totalManutencao, totalPendentes, totalSolicitacoes, notificacoes, ultimasMovimentacoes] = await Promise.all([
    db.collection('devices').countDocuments(baseFilter),
    db.collection('devices').countDocuments({
      ...baseFilter,
      status: { $in: ['MANUTENCAO', 'Manutenção', 'MANUTENÇÃO'] }
    }),
    db.collection('movimentacoes').countDocuments({
      status: 'PENDENTE',
      ...(isMaintenance
        ? { $or: [{ baseDestinoNome: 'MANUTENCAO' }, { tipo: 'MANUTENCAO' }] }
        : isScoped ? { baseDestinoNome: user.baseName } : {})
    }),
    isMaintenance
      ? Promise.resolve(0)
      : db.collection('solicitacoes').countDocuments(
          isScoped
            ? { baseSolicitanteNome: user.baseName, status: { $nin: ['ATENDIDA', 'CANCELADA', 'REJEITADA_GERENTE', 'REJEITADA_ADMIN'] } }
            : { status: { $nin: ['ATENDIDA', 'CANCELADA', 'REJEITADA_GERENTE', 'REJEITADA_ADMIN'] } }
        ),
    isMaintenance
      ? Promise.resolve([])
      : db.collection('notificacoes')
          .find(isScoped ? { baseDestinoNome: user.baseName, lida: { $ne: true } } : { lida: { $ne: true } })
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
    db.collection('movimentacoes')
      .find(
        isMaintenance
          ? { $or: [{ baseOrigemNome: 'MANUTENCAO' }, { baseDestinoNome: 'MANUTENCAO' }, { tipo: 'MANUTENCAO' }, { tipo: 'RETORNO_MANUTENCAO' }, { tipo: 'BAIXA' }] }
          : isScoped
            ? { $or: [{ baseOrigemNome: user.baseName }, { baseDestinoNome: user.baseName }] }
            : {}
      )
      .sort({ dataAbertura: -1 })
      .limit(5)
      .toArray()
  ]);

  return (
    <DashboardHome
      userName={user.name?.split(' ')[0] || 'Usuário'}
      userRole={user.role || 'GESTOR_BASE'}
      baseName={isScoped ? (user.baseName || 'Base vinculada') : isMaintenance ? 'Fila central de manutenção' : 'Visão global'}
      totalAtivos={totalAtivos}
      totalManutencao={totalManutencao}
      totalPendentes={totalPendentes}
      totalSolicitacoes={totalSolicitacoes}
      notificacoes={(notificacoes as Record<string, unknown>[]).map(item => ({ ...item, _id: String(item._id) }))}
      ultimasMovimentacoes={ultimasMovimentacoes.map(m => ({ ...m, _id: String(m._id) }))}
    />
  );
}
