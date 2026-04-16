// ============================================================================
// MÓDULO UNIFI: Conversa com a controladora Wi-Fi da Ubiquiti
// ============================================================================
const https = require('https');
const fetch = require('node-fetch');

// O Unifi Controller geralmente roda localmente (ex: 192.168.x.x) e usa um certificado
// de segurança SSL "falso" (auto-assinado). Se não colocarmos 'rejectUnauthorized: false',
// o Node.js se recusa a conectar por achar que é um site hacker.
const agent = new https.Agent({ rejectUnauthorized: false });

const BASE_URL = `https://${process.env.UNIFI_HOST}:${process.env.UNIFI_PORT}`;
const SITE = process.env.UNIFI_SITE || 'default';

// Variável de estado global. Armazena o "crachá de acesso" (Cookie) do admin do Unifi.
let cookies = null;

// ============================================================================
// FUNÇÃO: Realiza o login na Controladora Unifi
// ============================================================================
async function login() {
  // O 'fetch' faz uma chamada HTTP simulando um navegador web.
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST', // POST porque estamos enviando dados sensíveis (senha)
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.UNIFI_USERNAME,
      password: process.env.UNIFI_PASSWORD
    }),
    agent // Passamos o agente que ignora o erro de SSL
  });

  // 'res.ok' significa que o servidor respondeu com status 200 (Sucesso) a 299.
  if (!res.ok) throw new Error('Falha ao autenticar no Unifi Controller');

  // O servidor Unifi devolve um cabeçalho (Header) chamado 'set-cookie'. 
  // É ele que diz ao navegador: "Guarde essa chave para provar que você fez login".
  const setCookie = res.headers.raw()['set-cookie'];
  // Limpamos o texto do cookie para pegar apenas o que importa antes do primeiro ';'
  cookies = setCookie.map(c => c.split(';')[0]).join('; ');
}

// ============================================================================
// FUNÇÃO: Cria efetivamente o código do Voucher
// ============================================================================
async function createVoucher() {
  // Primeiro, garante que estamos logados e temos o Cookie atualizado.
  await login();

  // Pega os valores do arquivo .env, se não existirem, usa 480 minutos (8h) e 1 uso (quota).
  const expire = parseInt(process.env.VOUCHER_EXPIRE) || 480;
  const quota = parseInt(process.env.VOUCHER_QUOTA) || 1;

  // 1º PASSO: Manda o comando de criar o voucher
  const res = await fetch(`${BASE_URL}/api/s/${SITE}/cmd/hotspot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies // Anexamos o crachá aqui. Sem isso, o Unifi recusa o comando.
    },
    body: JSON.stringify({
      cmd: 'create-voucher',
      expire,
      n: 1, // Quantidade de códigos para gerar de uma vez
      quota
    }),
    agent
  });

  // Converte a resposta bruta em um objeto JavaScript
  const data = await res.json();

  if (!data.data || !data.data[0]) {
    throw new Error('Erro ao criar voucher no Unifi');
  }

  // Curiosidade: O Unifi NÃO retorna o código numérico do voucher imediatamente após criar!
  // Ele retorna apenas o "Tempo de Criação" (create_time). Precisamos fazer uma segunda busca.
  const createTime = data.data[0].create_time;

  // 2º PASSO: Buscar os detalhes do voucher criado usando o momento exato em que ele foi gerado
  const listRes = await fetch(`${BASE_URL}/api/s/${SITE}/stat/voucher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ create_time: createTime }),
    agent
  });

  const listData = await listRes.json();
  const voucher = listData.data && listData.data[0];

  if (!voucher) {
    throw new Error('Voucher criado no Unifi mas não encontrado na listagem');
  }

  // Finalmente, devolvemos os dados estruturados para quem chamou essa função (lá no api.js)
  return {
    code: voucher.code, // O código que o visitante vai digitar no celular (ex: 12345-67890)
    id: voucher._id,    // O ID interno do banco de dados do Unifi
    expire
  };
}

module.exports = { createVoucher };
