// ============================================================================
// MÓDULO DE AUTENTICAÇÃO: Segurança e Permissões (JWT)
// ============================================================================
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

// A chave secreta é como a matriz da fechadura. Só quem tem essa chave consegue
// fabricar Tokens (ingressos) válidos ou verificar se um ingresso é falso.
const SECRET_KEY = process.env.JWT_SECRET || 'unifi-voucher-secret-key-2026';

// ============================================================================
// MIDDLEWARE DE VERIFICAÇÃO (O "Segurança da Porta")
// Middlewares são funções que rodam "no meio do caminho" antes de chegar na rota final.
// ============================================================================
function verifyToken(req, res, next) {
  // Os tokens JWT são enviados pelo front-end no cabeçalho 'Authorization' no formato: "Bearer <token_aqui>"
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    // Erro 401: Unauthorized (Não autorizado - Faltou o ingresso)
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    // O jwt.verify faz a matemática pra saber se o token foi assinado com a nossa SECRET_KEY
    // e se ele não expirou. Se for válido, ele devolve os dados que escondemos lá dentro.
    const decoded = jwt.verify(token, SECRET_KEY);
    // Penduramos os dados do usuário logado na requisição (req), para as próximas funções saberem quem ele é.
    req.user = decoded;
    next(); // "Pode passar!" -> Manda o fluxo seguir para a rota desejada.
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Sessão expirada, faça login novamente' : 'Token inválido';
    return res.status(401).json({ error: message });
  }
}

// ============================================================================
// MIDDLEWARE DE AUTORIZAÇÃO (O "Verificador de VIP")
// Higher-Order Function: Uma função que devolve outra função!
// ============================================================================
function checkRole(...roles) {
  return (req, res, next) => {
    // Se a regra da pessoa (ex: 'recepcao') não estiver dentro das roles permitidas, barra o acesso.
    if (!req.user || !roles.includes(req.user.role)) {
      // Erro 403: Forbidden (Proibido - Você tem ingresso, mas é da pista e tentou entrar no camarote)
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

// ============================================================================
// FUNÇÃO DE LOGIN
// ============================================================================
async function login(username, password) {
  const db = getDb();
  
  if (!db) {
    throw new Error('Banco de dados não inicializado');
  }

  try {
    // Busca o usuário no banco de dados
    const result = db.exec(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username]
    );

    if (!result || result.length === 0 || result[0].values.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    // Desestrutura o array de retorno do banco
    const [id, usr, hash, role] = result[0].values[0];
    
    // O bcrypt protege as senhas. Ele nunca guarda a senha em texto limpo (ex: "123456").
    // O 'compare' faz o cálculo matemático para saber se a senha digitada equivale ao hash embaralhado do banco.
    const isValidPassword = await bcrypt.compare(password, hash);

    if (!isValidPassword) {
      throw new Error('Senha incorreta');
    }

    // Se a senha está correta, fabricamos o Token JWT (o ingresso digital)
    const token = jwt.sign(
      { id, username: usr, role }, // Payload: O que vai "escondido" no token (nunca coloque senhas aqui!)
      SECRET_KEY,                  // Assinatura
      { expiresIn: '8h' }          // Validade
    );

    return { success: true, token, user: { id, username: usr, role } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { verifyToken, checkRole, login };
