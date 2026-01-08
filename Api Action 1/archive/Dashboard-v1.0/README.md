# Dashboard Action1

Dashboard de inventário integrado com API Action1 para gerenciamento de dispositivos.

## 📁 Estrutura do Projeto

```
Dashboard/
├── src/                    # Código fonte do frontend
│   ├── api/               # Configurações e clients API
│   │   ├── configs.js     # Credenciais OAuth Action1
│   │   └── serverApi.js   # Client para backend local
│   ├── App.jsx            # Componente principal
│   ├── App.css            # Estilos do dashboard
│   ├── main.jsx           # Entry point React
│   └── index.css          # Estilos globais
├── data/                  # Dados mockados para testes
│   └── mockdata.jsx
├── components/            # Componentes React (vazio)
├── tests/                 # Arquivos de teste
├── logs/                  # Logs do servidor
├── backup/                # Arquivos antigos
├── server.js              # Backend Express (porta 3001)
├── package.json           # Dependências do projeto
└── vite.config.js         # Configuração Vite

```

## 🚀 Como Usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o backend (Terminal 1)
```bash
npm run server
```

### 3. Iniciar o frontend (Terminal 2)
```bash
npm start
```

### 4. Acessar
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📊 Funcionalidades

- ✅ Sincronização automática com Action1 API
- ✅ Exibição de dispositivos Online/Offline
- ✅ Filtros por tipo e status
- ✅ Cards de resumo (Total, Online, Offline)
- ✅ Normalização de status (Connected→Online, Disconnected→Offline)
- ✅ Deduplicação de dispositivos

## 🔧 Endpoints do Backend

- `GET /api/status` - Status do servidor
- `GET /api/inventory` - Obter inventário armazenado
- `POST /api/sync` - Sincronizar com Action1
- `DELETE /api/inventory` - Limpar cache

## ⚙️ Configuração

Edite `src/api/configs.js` com suas credenciais OAuth da Action1:
```javascript
export default {
    grant_type: 'client_credentials',
    client_id: 'seu_client_id',
    client_secret: 'seu_client_secret'
}
```

## 📝 Limitações Conhecidas

- A API Action1 tem limitação de paginação (retorna máximo 50 dispositivos por requisição)
- Endpoints não gerenciados retornam 403 Forbidden (requer permissões adicionais)
