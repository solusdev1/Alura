# Dashboard v2.0 - Versão de Testes

Esta é a versão 2.0 do Dashboard, criada especificamente para testes e desenvolvimento de novas funcionalidades.

## ✨ Novas Funcionalidades v2.0

### 🗄️ Banco de Dados SQLite
- **Sincronização offline**: Dados persistem localmente
- **Performance**: Acesso rápido aos dados sem consultar a API
- **Economia de requisições**: Reduz chamadas à API do Action1

### 📄 Paginação Melhorada
- **Parâmetro `from`**: Usa o padrão correto da API Action1
- **Campo `next_page`**: Processa automaticamente próximas páginas
- **Busca completa**: Garante recuperação de todos os dispositivos

### ⏰ Sincronização Automática
- **Agendamento**: Sincroniza automaticamente 1x por dia às 03:00
- **Timezone**: Configurado para America/Sao_Paulo
- **Background**: Executa sem intervenção manual

## Diferenças da Versão 1.0

| Recurso | v1.0 | v2.0 |
|---------|------|------|
| **Versão** | 1.0.0 | 2.0.0 |
| **Porta** | 3001 | 3002 |
| **Armazenamento** | Memória (volátil) | SQLite (persistente) |
| **Paginação** | offset | from + next_page |
| **Sincronização** | Manual | Manual + Automática (diária) |
| **Offline** | ❌ | ✅ |

## Como Executar

### 1. Instalar Dependências
```bash
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0"
npm install
```

### 2. Iniciar o Servidor Backend
```bash
npm run server
```
O servidor rodará em: http://localhost:3002

### 3. Iniciar o Frontend React (em outro terminal)
```bash
npm start
```
ou
```bash
npm run dev
```
O React rodará em: http://localhost:5173

**Importante:** Tanto o servidor backend (porta 3002) quanto o frontend React (porta 5173) precisam estar rodando simultaneamente para o dashboard funcionar corretamente.

## 📡 Endpoints Disponíveis

### Status e Informações
- **GET** `/api/status` - Status do servidor, banco e última sincronização

### Inventário
- **GET** `/api/inventory` - Obter inventário completo (do banco local)
- **GET** `/api/inventory/status/:status` - Filtrar por status (Online/Offline)
- **POST** `/api/sync` - Sincronizar manualmente com Action1
- **DELETE** `/api/inventory` - Limpar inventário do banco

### Exemplo de Uso
```javascript
// Verificar status
fetch('http://localhost:3002/api/status')

// Obter inventário (offline)
fetch('http://localhost:3002/api/inventory')

// Filtrar apenas dispositivos online
fetch('http://localhost:3002/api/inventory/status/Online')

// Sincronizar manualmente
fetch('http://localhost:3002/api/sync', { method: 'POST' })
```

## 💾 Banco de Dados

### Localização
`Dashboard-v2.0/data/inventory.db`

### Tabelas
1. **inventory** - Armazena todos os dispositivos
2. **sync_metadata** - Informações sobre sincronizações

### Campos Adicionais
- `last_seen` - Última vez que o dispositivo foi visto
- `agent_version` - Versão do agente instalado
- `vulnerabilities_critical` - Vulnerabilidades críticas
- `vulnerabilities_other` - Outras vulnerabilidades
- `missing_updates_critical` - Updates críticos pendentes
- `missing_updates_other` - Outros updates pendentes

## ⏰ Sincronização Automática

A sincronização ocorre automaticamente todos os dias às **03:00** (horário de Brasília).

Para alterar o horário, edite a linha no [server.js](server.js):
```javascript
cron.schedule('0 3 * * *', async () => { ... })
//            ┬ ┬ ┬ ┬ ┬
//            │ │ │ │ │
//            │ │ │ │ └─── Dia da semana (0-7, 0=Domingo)
//            │ │ │ └───── Mês (1-12)
//            │ │ └─────── Dia do mês (1-31)
//            │ └───────── Hora (0-23)
//            └─────────── Minuto (0-59)
```

## 🔍 Vantagens da v2.0

1. **Funciona offline**: Dados persistem mesmo após reiniciar o servidor
2. **Mais rápido**: Consultas ao banco local são instantâneas
3. **Menos requisições**: Economiza chamadas à API do Action1
4. **Automático**: Sincronização diária sem intervenção
5. **Paginação correta**: Usa `from` ao invés de `offset`
6. **Mais dados**: Armazena vulnerabilidades e updates pendentes

## Observações

- Esta versão roda em paralelo com a versão 1.0
- Use esta versão para testar novas features sem afetar a versão em produção
- As configurações da API são compartilhadas com a versão 1.0
- O banco de dados será criado automaticamente na primeira execução
