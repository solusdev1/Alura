import { hash } from 'bcryptjs';
import { getDb } from '@/backend/db/mongodb';

const BOOTSTRAP_DEFAULT_PASSWORD = String(process.env.BOOTSTRAP_DEFAULT_PASSWORD || '').trim();

declare global {
  var __dashboardBootstrapPromise: Promise<void> | undefined;
}

type SeedBase = {
  codigo: string;
  nome: string;
  tipo: 'OPERACIONAL' | 'MATRIZ';
  isActive: boolean;
};

type SeedUser = {
  name: string;
  email: string;
  role: 'ADMIN' | 'GERENTE' | 'GESTOR_BASE' | 'MANUTENCAO';
  baseCodigo: string | null;
  isActive: boolean;
};

const BASES: SeedBase[] = [
  { codigo: 'APARECIDA DE GOIANIA', nome: 'APARECIDA DE GOIANIA', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'BRUSQUE', nome: 'BRUSQUE', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'BASE_01', nome: 'Base Operacional 01', tipo: 'OPERACIONAL', isActive: false },
  { codigo: 'Base Raia SJP', nome: 'Base Raia SJP', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'CAMBE', nome: 'CAMBE', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'CONTAGEM', nome: 'CONTAGEM', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'CUIABÁ', nome: 'CUIABÁ', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'EMBU', nome: 'EMBU', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'GRAVATAI', nome: 'GRAVATAI', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'GUARULHOS', nome: 'GUARULHOS', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'LONDRINA', nome: 'LONDRINA', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'MARINGÁ', nome: 'MARINGÁ', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'MARINGA', nome: 'MARINGÁ', tipo: 'OPERACIONAL', isActive: false },
  { codigo: 'MATRIZ_01', nome: 'Matriz Principal', tipo: 'MATRIZ', isActive: true },
  { codigo: 'PTO', nome: 'PATO BRANCO', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'PAULINIA', nome: 'PAULINIA', tipo: 'OPERACIONAL', isActive: true },
  { codigo: 'RIBEIRÃO PRETO', nome: 'RIBEIRÃO PRETO', tipo: 'OPERACIONAL', isActive: true }
];

const USERS: SeedUser[] = [
  { name: 'Altemir Cevalho', email: 'suporte.sistema@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'MATRIZ_01', isActive: true },
  { name: 'André Luiz do Nascimento', email: 'cdribeiraopreto@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'RIBEIRÃO PRETO', isActive: true },
  { name: 'David de Oliveira (Você)', email: 'suporteti@carrarologistica.com.br', role: 'ADMIN', baseCodigo: null, isActive: true },
  { name: 'Gestor da Base 01', email: 'gestor1@tj.com.br', role: 'GESTOR_BASE', baseCodigo: 'BASE_01', isActive: false },
  { name: 'Gustavo Carraro', email: 'projetoti@carrarologistica.com.br', role: 'ADMIN', baseCodigo: null, isActive: true },
  { name: 'Lucas Matheus Alessio Ramos', email: 'cdgravatia@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'GRAVATAI', isActive: true },
  { name: 'Lucas de Abreu Carneiro', email: 'cdcuiaba3@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'CUIABÁ', isActive: true },
  { name: 'Marcela Rocio', email: 'marcela.rocio@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'MATRIZ_01', isActive: true },
  { name: 'Marcos Rogério Rampaneli', email: 'cd.paulinia@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'PAULINIA', isActive: true },
  { name: 'Márcio Sprada', email: 'cdsjp@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'Base Raia SJP', isActive: true },
  { name: 'Robson Caitano de Oliveira', email: 'cd.embu@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'EMBU', isActive: true },
  { name: 'Thiago Zavorotiuk', email: 'cdcontagem3@carrarologistica.com.br', role: 'GESTOR_BASE', baseCodigo: 'CONTAGEM', isActive: true },
  { name: 'Equipe Manutenção', email: 'manutencao@carrarologistica.com.br', role: 'MANUTENCAO', baseCodigo: null, isActive: true }
];

export async function ensureBootstrapData() {
  if (!global.__dashboardBootstrapPromise) {
    global.__dashboardBootstrapPromise = bootstrap();
  }
  await global.__dashboardBootstrapPromise;
}

async function bootstrap() {
  const db = await getDb();
  const bases = db.collection('bases');
  const users = db.collection('users');
  const passwordHash = BOOTSTRAP_DEFAULT_PASSWORD ? await hash(BOOTSTRAP_DEFAULT_PASSWORD, 12) : null;

  for (const base of BASES) {
    await bases.updateOne(
      { codigo: base.codigo },
      {
        $set: {
          nome: base.nome,
          codigo: base.codigo,
          tipo: base.tipo,
          isActive: base.isActive,
          updatedAt: new Date().toISOString()
        },
        $setOnInsert: {
          createdAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
  }

  const baseDocs = await bases.find({}).toArray();
  const baseByCodigo = new Map(baseDocs.map(base => [String(base.codigo), base]));

  for (const user of USERS) {
    const base = user.baseCodigo ? baseByCodigo.get(user.baseCodigo) : null;
    const normalizedEmail = user.email.toLowerCase();

    await users.updateOne(
      { email: normalizedEmail },
      {
        $set: {
          name: user.name,
          email: normalizedEmail,
          role: user.role,
          baseId: base ? String(base._id) : null,
          baseName: base ? String(base.nome) : null,
          isActive: user.isActive,
          updatedAt: new Date().toISOString()
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
          ...(passwordHash ? { passwordHash } : {}),
          mustChangePassword: true
        }
      },
      { upsert: true }
    );
  }
}
