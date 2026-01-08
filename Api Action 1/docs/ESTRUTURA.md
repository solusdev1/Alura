# 📁 Estrutura do Projeto Dashboard v2.0

## Organização de Pastas

```
Dashboard-v2.0/
├── 📂 server/                    # Backend Node.js + Express
│   ├── 📂 database/              # Camada de dados
│   │   ├── configs.js           # Credenciais Action1
│   │   └── database.js          # Funções de persistência (JSON)
│   ├── 📂 routes/               # Rotas da API (futuro)
│   ├── 📂 controllers/          # Lógica de negócio (futuro)
│   ├── 📂 utils/                # Utilitários do servidor (futuro)
│   └── index.js                 # Servidor principal (Express + Cron)
│
├── 📂 src/                       # Frontend React
│   ├── 📂 components/           # Componentes React
│   │   └── App.jsx              # Componente principal
│   ├── 📂 services/             # Serviços de API
│   │   └── api.js               # Cliente API (chamadas ao backend)
│   ├── 📂 styles/               # Arquivos CSS
│   │   ├── App.css              # Estilos do App
│   │   └── index.css            # Estilos globais
│   └── main.jsx                 # Entry point React
│
├── 📂 public/                    # Arquivos estáticos
│   ├── index.html               # HTML principal
│   └── test-page.html           # Página de teste da API
│
├── 📂 data/                      # Dados persistidos
│   ├── inventory.json           # Inventário de dispositivos
│   └── metadata.json            # Metadados de sincronização
│
├── 📂 logs/                      # Logs do servidor
│   └── server-log.txt           # Log de operações
│
├── 📂 tests/                     # Testes
│   ├── test-api.js              # Testes de API
│   ├── test-full-sync.js        # Teste sincronização completa
│   ├── test-pagination.js       # Teste paginação
│   └── test-sync.js             # Testes diversos
│
├── 📂 backup/                    # Arquivos de backup
│   └── server-simple.js         # Versão antiga do servidor
│
├── 📄 package.json              # Dependências do projeto
├── 📄 vite.config.js            # Configuração Vite
├── 📄 .gitignore                # Arquivos ignorados pelo Git
├── 📄 README.md                 # Documentação principal
└── 📄 URLS_TESTE.txt            # URLs para testes (gitignore)
```

## Fluxo de Dados

```
Action1 API 
    ↓
server/index.js (sincronização via cron)
    ↓
server/database/database.js (persistência)
    ↓
data/inventory.json
    ↓
API REST (Express routes)
    ↓
src/services/api.js
    ↓
src/components/App.jsx (React UI)
```

## Scripts Disponíveis

- `npm start` - Inicia frontend React (porta 5173)
- `npm run server` - Inicia backend Node.js (porta 3002)
- `npm run dev` - Inicia desenvolvimento Vite
- `npm run build` - Build de produção

## Portas

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3002
- **API**: http://localhost:3002/api

## Padrões de Organização

### Backend (server/)
- `index.js` - Servidor Express principal
- `database/` - Camada de acesso a dados
- `routes/` - Definição de rotas (futuro uso)
- `controllers/` - Lógica de negócio (futuro uso)

### Frontend (src/)
- `components/` - Componentes React reutilizáveis
- `services/` - Comunicação com APIs externas
- `styles/` - Arquivos CSS organizados
- `main.jsx` - Ponto de entrada da aplicação

### Dados (data/)
- Arquivos JSON para persistência offline
- Separado do código fonte

### Testes (tests/)
- Testes unitários e de integração
- Scripts de teste da API

Esta estrutura segue as melhores práticas de organização para projetos React + Node.js.
