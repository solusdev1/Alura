// ============================================================================
// 1. IMPORTAÇÕES (DEPENDÊNCIAS)
// ============================================================================
// O pacote 'dotenv' puxa as chaves secretas do arquivo '.env' e coloca em 'process.env'
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { initDb, initializeUsers } = require('./db/database');
const { login } = require('./routes/auth');

// Cria a aplicação (o servidor propriamente dito) usando o framework Express
const app = express();
// Define como a aplicação será escutada na rede (0.0.0.0 significa 'todas as placas de rede')
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, '.server-config.json');

// ============================================================================
// 2. FUNÇÕES UTILITÁRIAS
// ============================================================================
// Função para obter IP da máquina
// Varre as placas de rede do PC (Ethernet/Wi-Fi) para encontrar o IP local (IPv4).
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorar loopback e IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Função para carregar ou salvar IP fixo
function getFixedIP() {
  try {
    // Se já geramos o arquivo de configuração antes, vamos ler o IP salvo nele.
    if (fs.existsSync(CONFIG_FILE)) {
      // Converte o texto JSON salvo no arquivo de volta em um Objeto Javascript.
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.ip) {
        return config.ip;
      }
    }
  } catch (e) {
    // Um bloco 'try/catch' vazio aqui ignora problemas caso o arquivo falte permissão.
  }
  
  // Se não existir arquivo prévio, tenta descobrir o IP atual e criar o arquivo
  const ip = getLocalIP();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ip, createdAt: new Date().toISOString() }, null, 2));
  } catch (e) {
    console.warn('⚠️ Não foi possível salvar IP fixo:', e.message);
  }
  
  return ip;
}

const localIP = getFixedIP();

// Permite que o servidor entenda dados enviados no formato JSON (ex: formulários)
app.use(express.json());

// ============================================================================
// 3. CONFIGURAÇÕES DE MIDDLEWARE E ARQUIVOS ESTÁTICOS
// ============================================================================
// Middleware para servir arquivos HTML com Content-Type correto
// Garante que o navegador do usuário não grave uma versão velha da página (cache)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// ============================================================================
// 4. ROTAS DA APLICAÇÃO (ENDPOINTS)
// ============================================================================
// Rota de login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }

  try {
    const result = await login(username, password);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ error: 'Erro interno ao processar login' });
  }
});

// Diz ao servidor para usar o arquivo 'api.js' para qualquer rota que comece com '/api'
app.use('/api', require('./routes/api'));

// Servir arquivos HTML manualmente para garantir Content-Type
// Quando o usuário acessar 'localhost:3000/', ele vai ver a página 'login.html'
app.get('/', (req, res) => {
  const file = path.join(__dirname, 'public/login.html');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(file);
});

app.get('/dashboard', (req, res) => {
  const file = path.join(__dirname, 'public/dashboard.html');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(file);
});

app.get('/historico', (req, res) => {
  const file = path.join(__dirname, 'public/historico.html');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(file);
});

app.get('/imprimir/:id', (req, res) => {
  const file = path.join(__dirname, 'public/imprimir.html');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(file);
});

// ============================================================================
// 5. INICIALIZAÇÃO DO SISTEMA E SERVIDOR
// ============================================================================
// Inicializar banco de dados e iniciar servidor
// Primeiro cria as tabelas do banco, depois cria os usuários padrão, e por fim liga a porta (3000)
initDb().then(() => {
  return initializeUsers();
}).then(() => {
  app.listen(PORT, HOST, () => {
    console.log('\n┌───────────────────────────────────────────────────────────┐');
    console.log('│  ✅ Sistema de Vouchers WiFi Unifi inicializado com sucesso │');
    console.log('└───────────────────────────────────────────────────────────┘\n');
    console.log('📱 ACESSO LOCAL (esta máquina):');
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://127.0.0.1:${PORT}\n`);
    console.log('🌐 ACESSO REMOTO (outras máquinas na rede):');
    console.log(`   http://${localIP}:${PORT}`);
    console.log(`   ⚡ IP FIXO - permanecerá sempre: ${localIP}\n`);
    console.log('📝 Credenciais padrão configuradas (consulte o .env.example para alterar)\n');
    console.log('💾 Banco de dados: db/visitors.db');
    console.log(''); 
  });
}).catch(err => {
  console.error('❌ Erro ao inicializar:', err);
  process.exit(1);
});
