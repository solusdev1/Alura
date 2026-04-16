// ============================================================================
// MÓDULO DE ROTAS DA API
// ============================================================================
// O 'express.Router()' age como um "mini-aplicativo". Em vez de colocar 
// centenas de linhas no server.js, criamos um módulo focado apenas na API.
const express = require('express');
const router = express.Router();
const { getDb, save } = require('../db/database');
const { createVoucher } = require('./unifi');
const { verifyToken, checkRole } = require('./auth');
const { validarCPF } = require('../utils/cpf');
const { formatarDataBrasil } = require('../utils/timezone');

// ============================================================================
// 1. ROTA: GERAR NOVO VOUCHER (Método POST)
// ============================================================================
// verifyToken e checkRole são 'Middlewares': eles barram quem não for recepção/admin de fazer isso.
router.post('/voucher', verifyToken, checkRole('recepcao', 'admin'), async (req, res) => {
  // Extrai o 'nome' e o 'cpf' do corpo da requisição (que veio do Front-end)
  const { nome, cpf } = req.body;
  const user = req.user;

  let nomeVisitante = nome ? nome.trim() : '';
  let cpfVisitante = cpf ? cpf.replace(/\D/g, '') : '';

  // Se admin gera sem dados, usar valores padrão
  if (user.role === 'admin' && (!nomeVisitante || !cpfVisitante)) {
    nomeVisitante = 'Voucher Gerado';
    cpfVisitante = '00000000000';
  } else {
    // Se Recepção ou admin com dados, validar
    if (!nomeVisitante || !cpfVisitante) {
      return res.status(400).json({ error: 'Nome e CPF são obrigatórios' });
    }

    if (!validarCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido. Verifique os dígitos verificadores.' });
    }

    // Verificar consistência CPF × Nome com registros anteriores
    // Pega a conexão com o banco e 'prepara' uma consulta SQL para evitar ataques de SQL Injection
    const dbCheck = getDb();
    const stmt = dbCheck.prepare(
      'SELECT nome FROM visitors WHERE cpf = ? AND cpf != ? ORDER BY id ASC LIMIT 1'
    );
    // Troca as interrogações '?' na query acima pelos valores reais
    stmt.bind([cpfVisitante, '00000000000']);
    if (stmt.step()) {
      const nomeExistente = stmt.getAsObject().nome;
      stmt.free();
      if (nomeExistente.toLowerCase() !== nomeVisitante.toLowerCase()) {
        return res.status(400).json({
          error: 'Nome não confere com o CPF já cadastrado. Verifique o nome e tente novamente.'
        });
      }
    } else {
      stmt.free();
    }
  }

  try {
    const { code, id, expire } = await createVoucher();

    const agora = new Date();
    const expireDate = new Date();
    expireDate.setMinutes(expireDate.getMinutes() + expire);

    // Grava o visitante no Banco de Dados SQLite usando um comando INSERT
    const db = getDb();
    db.run(
      'INSERT INTO visitors (nome, cpf, voucher_code, criado_em, expira_em, unifi_id) VALUES (?, ?, ?, ?, ?, ?)',
      [nomeVisitante, cpfVisitante, code, agora.toISOString(), expireDate.toISOString(), id]
    );

    const lastId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    save();

    const dataBrasil = formatarDataBrasil(agora);
    const dataExpireBrasil = formatarDataBrasil(expireDate);

    // Devolve uma resposta de sucesso pro Front-end contendo os dados gerados
    res.json({
      success: true,
      visitor: {
        id: lastId,
        nome: nomeVisitante,
        cpf: cpfVisitante,
        voucher_code: code,
        criado_em: dataBrasil.completo,
        expira_em: dataExpireBrasil.completo,
        expire_minutes: expire
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar voucher: ' + err.message });
  }
});

// ============================================================================
// 2. ROTA: LISTAR HISTÓRICO COM BUSCA E PAGINAÇÃO (Método GET)
// ============================================================================
router.get('/historico', verifyToken, checkRole('admin'), (req, res) => {
  // 'req.query' pega os dados da URL (ex: /historico?busca=Joao&pagina=2)
  const { busca } = req.query;
  // Define limites para a paginação (20 itens por página) e faz cálculos matemáticos
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = 20;
  const offset = (pagina - 1) * limite;

  const db = getDb();
  
  // Monta dinamicamente os comandos SQL baseados em se o usuário digitou uma busca ou não
  let countQuery = 'SELECT COUNT(*) as total FROM visitors';
  let dataQuery = 'SELECT * FROM visitors';
  let params = [];

  if (busca) {
    // O sinal '%' no SQL significa "qualquer coisa antes" ou "qualquer coisa depois".
    const where = ' WHERE nome LIKE ? OR cpf LIKE ? OR voucher_code LIKE ?';
    countQuery += where;
    dataQuery += where;
    params = [`%${busca}%`, `%${busca}%`, `%${busca}%`];
  }

  // Contar total
  const countStmt = db.prepare(countQuery);
  if (params.length) countStmt.bind(params);
  countStmt.step();
  const total = countStmt.get()[0];
  countStmt.free();

  // Buscar dados
  dataQuery += ' ORDER BY criado_em DESC LIMIT ? OFFSET ?';
  const dataStmt = db.prepare(dataQuery);
  dataStmt.bind([...params, limite, offset]);

  const visitors = [];
  // Varre linha por linha dos resultados do banco e empurra (.push) para a nossa lista
  while (dataStmt.step()) {
    visitors.push(dataStmt.getAsObject());
  }
  dataStmt.free();

  // Devolve a lista de visitantes e informações sobre as páginas pro Front-end
  res.json({
    visitors,
    total,
    paginas: Math.ceil(total / limite),
    pagina_atual: parseInt(pagina)
  });
});

// ============================================================================
// 3. ROTA: BUSCAR UM ÚNICO VISITANTE PELO ID
// ============================================================================
router.get('/visitante/:id', verifyToken, checkRole('admin'), (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM visitors WHERE id = ?');
  stmt.bind([parseInt(req.params.id)]);

  if (stmt.step()) {
    const visitor = stmt.getAsObject();
    stmt.free();
    res.json(visitor);
  } else {
    stmt.free();
    res.status(404).json({ error: 'Visitante não encontrado' });
  }
});

// ============================================================================
// 4. ROTA: OBTER DADOS PRO DASHBOARD DE ADMINISTRAÇÃO E EXPORTAÇÃO
// ============================================================================
router.get('/vouchers', verifyToken, checkRole('admin'), (req, res) => {
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = 50;
  const offset = (pagina - 1) * limite;

  const db = getDb();
  
  // Contar total
  const countResult = db.exec('SELECT COUNT(*) as total FROM visitors');
  const total = countResult.length > 0 ? countResult[0].values[0][0] : 0;

  // Buscar dados
  const result = db.exec(
    'SELECT * FROM visitors ORDER BY criado_em DESC LIMIT ? OFFSET ?',
    [limite, offset]
  );

  const vouchers = [];
  if (result.length > 0) {
    const columns = result[0].columns;
    result[0].values.forEach(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      // Formatar data para timezone Brasil
      if (obj.criado_em) {
        obj.criado_em = formatarDataBrasil(obj.criado_em).completo;
      }
      if (obj.expira_em) {
        obj.expira_em = formatarDataBrasil(obj.expira_em).completo;
      }
      vouchers.push(obj);
    });
  }

  res.json({
    data: vouchers,
    total,
    paginas: Math.ceil(total / limite),
    pagina_atual: parseInt(pagina)
  });
});

module.exports = router;
