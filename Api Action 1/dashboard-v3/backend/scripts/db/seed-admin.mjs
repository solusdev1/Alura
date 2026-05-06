/**
 * Cria o primeiro usuario ADMIN no MongoDB.
 * Uso: npm run seed:admin
 * Requer: MONGODB_URI, MONGODB_DATABASE, ADMIN_EMAIL e ADMIN_PASSWORD no ambiente/.env.local.
 */
import { MongoClient } from 'mongodb';
import bcryptjs from 'bcryptjs';
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const env = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  env.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && !key.startsWith('#') && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
} catch {
  console.warn('[AVISO] .env.local nao encontrado, usando variaveis do ambiente');
}

async function hashPassword(password) {
  return bcryptjs.hash(password, 12);
}

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DATABASE || 'action1_inventory';
const DEFAULT_EMAIL = String(process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const DEFAULT_PASSWORD = String(process.env.ADMIN_PASSWORD || '');

if (!DEFAULT_EMAIL || !DEFAULT_PASSWORD) {
  console.error('ADMIN_EMAIL e ADMIN_PASSWORD sao obrigatorios para criar o usuario admin.');
  process.exit(1);
}

if (DEFAULT_PASSWORD.length < 6) {
  console.error('ADMIN_PASSWORD deve ter no minimo 6 caracteres.');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection('users');

    const existing = await users.findOne({ email: DEFAULT_EMAIL });
    if (existing) {
      console.log(`[OK] Usuario admin ja existe: ${DEFAULT_EMAIL}`);
      return;
    }

    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    await users.insertOne({
      name: 'Administrador',
      email: DEFAULT_EMAIL,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date().toISOString()
    });

    console.log('[OK] Usuario admin criado com sucesso!');
    console.log(`   Email: ${DEFAULT_EMAIL}`);
    console.log('   Senha: definida via ADMIN_PASSWORD');
    console.log('   Altere/remova ADMIN_PASSWORD do ambiente apos usar o seed.');
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
