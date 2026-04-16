// ============================================================================
// MÓDULO DE BANCO DE DADOS (Persistência)
// ============================================================================
// Este arquivo gerencia onde e como as informações são salvas para não sumirem
// quando o servidor for desligado. Usamos o SQLite via pacote 'sql.js'.
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Cria um caminho absoluto unindo a pasta atual (__dirname) ao nome do arquivo
const DB_PATH = path.join(__dirname, 'visitors.db');

// Variáveis globais para armazenar o estado do banco
let db = null;
let dbReady = null;

// ============================================================================
// FUNÇÃO: Inicializa e carrega o Banco de Dados
// ============================================================================
function initDb() {
  // Evita recarregar o banco duas vezes caso a função seja chamada novamente
  if (dbReady) return dbReady;

  dbReady = initSqlJs().then(SQL => {
    // fs.existsSync checa se o arquivo do banco já existe no seu Disco Rígido
    if (fs.existsSync(DB_PATH)) {
      // Se existir, lê o arquivo físico para a Memória RAM (buffer) tornando tudo mais rápido
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      // Se não existir, cria um banco novo e totalmente vazio na memória
      db = new SQL.Database();
    }

    // Comandos DDL (Data Definition Language) do SQL.
    // CREATE TABLE IF NOT EXISTS: Cria a "planilha" de visitantes apenas se ela não existir.
    // AUTOINCREMENT: O banco cuida de numerar os IDs (1, 2, 3...) automaticamente.
    db.run(`
      CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL,
        voucher_code TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        expira_em DATETIME,
        unifi_id TEXT
      )
    `);

    // Cria a tabela 'users' (os usuários que acessam o painel: admin e recepcao)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Salva as novas tabelas recém-criadas no Disco
    save();
    console.log('📦 Banco de dados SQLite inicializado com sucesso');
    return db;
  });

  return dbReady;
}

// ============================================================================
// FUNÇÃO: Salvar alterações no Disco (HD)
// ============================================================================
// Como o 'sql.js' trabalha na Memória RAM, precisamos desta função para
// "despejar" (exportar) os dados em formato binário para o arquivo .db.
function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Função utilitária (Getter) para emprestar a conexão com banco para outros arquivos
function getDb() {
  return db;
}

// ============================================================================
// FUNÇÃO: Criar Usuários Iniciais do Sistema
// ============================================================================
async function initializeUsers() {
  const db = getDb();
  
  try {
    // Faz uma pergunta ao banco (SELECT): "Quantos usuários existem na tabela?"
    const result = db.exec('SELECT COUNT(*) as count FROM users');
    // Navega pela matriz de resposta do SQLite para pegar o número exato
    const count = result.length > 0 ? result[0].values[0][0] : 0;
    
    // Se a tabela estiver vazia (primeira inicialização do sistema)
    if (count === 0) {
      // Segurança: Transforma a senha numa string embaralhada (Hash) usando Bcrypt.
      // O número 10 é o "Salt Rounds", o peso computacional do embaralhamento.
      const recepcaoHash = await bcrypt.hash('1234', 10);
      const adminHash = await bcrypt.hash('71566dc193ba', 10);
      
      // Injeta os dados nas colunas da tabela
      db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['recepcao', recepcaoHash, 'recepcao']
      );
      
      db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', adminHash, 'admin']
      );
      
      // Efetiva a gravação no disco
      save();
      console.log('✅ Usuários padrão criados');
    }
  } catch (err) {
    console.error('Erro ao inicializar usuários:', err);
  }
}

module.exports = { initDb, getDb, save, initializeUsers };
