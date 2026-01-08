# Dashboard v2.0 - Estrutura de Pastas

## 📁 Estrutura Reorganizada

```
Dashboard-v2.0/
│
├── 📄 Arquivos de Configuração
│   ├── .env                    # Configurações MongoDB Atlas (NÃO COMMITAR!)
│   ├── .env.example            # Exemplo de configuração
│   ├── .gitignore              # Arquivos ignorados pelo Git
│   ├── package.json            # Dependências do projeto
│   ├── vite.config.js          # Configuração do Vite
│   └── README.md               # Documentação principal
│
├── 📂 archive/                 # Arquivos antigos/backup
│   ├── server-simple.js
│   └── TESTE.md
│
├── 📂 data/                    # Dados persistentes (fallback JSON)
│   ├── inventory.json          # Inventário (se MongoDB offline)
│   └── metadata.json           # Metadados de sincronização
│
├── 📂 docs/                    # Documentação
│   └── SETUP_RAPIDO.txt        # Guia rápido de configuração
│
├── 📂 logs/                    # Logs do servidor
│   ├── server-log.txt
│   └── server-debug.txt
│
├── 📂 public/                  # Arquivos públicos
│   ├── debug.html              # Página de debug/testes
│   └── test-page.html          # Página de testes
│
├── 📂 scripts/                 # Scripts de configuração
│   ├── setup-mongodb-atlas.ps1 # Configurar MongoDB Atlas
│   └── start-mongodb-local.ps1 # Iniciar MongoDB local
│
├── 📂 server/                  # Backend Node.js
│   ├── index.js                # Servidor principal
│   │
│   ├── controllers/            # Lógica de negócio
│   │
│   ├── database/               # Conexão e queries DB
│   │   ├── configs.js          # Credenciais Action1
│   │   └── database.js         # MongoDB + Fallback JSON
│   │
│   ├── routes/                 # Rotas da API
│   │
│   └── utils/                  # Funções auxiliares
│
├── 📂 src/                     # Frontend React
│   ├── main.jsx                # Entry point React
│   │
│   ├── components/             # Componentes React
│   │   ├── App.jsx             # Componente principal
│   │   └── TestApp.jsx         # Componente de teste
│   │
│   ├── data/                   # Dados mockados
│   │   └── mockdata.jsx
│   │
│   ├── services/               # Serviços/APIs
│   │   └── api.js              # Cliente API
│   │
│   └── styles/                 # Estilos CSS
│       ├── App.css
│       └── index.css
│
└── 📂 tests/                   # Scripts de teste
    ├── debug-status.js
    ├── test-api.js
    ├── test-full-sync.js
    ├── test-pagination.js
    ├── test-server.js
    └── test-sync-v2.js
```

## 🎯 Principais Mudanças

### ✅ Organizadas
- Scripts movidos para `scripts/`
- Documentação em `docs/`
- Mockdata em `src/data/`
- Removido `config/` (vite.config na raiz)

### 📦 Estrutura Limpa
- Backend: `server/`
- Frontend: `src/`
- Dados: `data/` (fallback JSON)
- Scripts: `scripts/`
- Docs: `docs/`
- Testes: `tests/`

## 🚀 Como Usar

### Desenvolvimento
```bash
npm start                # Backend + Frontend
npm run server          # Apenas Backend
npm run frontend        # Apenas Frontend
```

### Configuração MongoDB
```bash
.\scripts\setup-mongodb-atlas.ps1
```

### Testes
```bash
node tests/test-api.js
```

## 📋 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `.env` | Configurações MongoDB (SECRET!) |
| `server/index.js` | Servidor backend |
| `src/components/App.jsx` | Dashboard principal |
| `server/database/database.js` | Conexão MongoDB |
| `vite.config.js` | Config Vite |

## 🔒 Segurança

**NÃO COMMITAR:**
- `.env` ← Credenciais MongoDB
- `node_modules/`
- `logs/`
- `data/*.json`

Tudo já está no `.gitignore`! ✅
