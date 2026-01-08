# API Action 1 - Dashboard de Inventário

## Estrutura do Projeto

```
Api Action 1/
├── Dashboard-v2.0/          # Aplicação principal (versão atual)
│   ├── src/                 # Código-fonte da aplicação
│   │   ├── components/      # Componentes React
│   │   ├── services/        # Serviços e APIs
│   │   └── styles/          # Arquivos CSS
│   ├── server/              # Backend Node.js
│   │   ├── controllers/     # Controladores
│   │   ├── database/        # Configurações de banco de dados
│   │   ├── routes/          # Rotas da API
│   │   └── utils/           # Utilitários
│   ├── tests/               # Testes automatizados
│   ├── config/              # Arquivos de configuração
│   │   ├── vite.config.js   # Configuração Vite
│   │   ├── start-mongo.ps1  # Scripts MongoDB
│   │   └── start-mongodb.ps1
│   ├── data/                # Dados JSON e mocks
│   ├── logs/                # Logs do servidor
│   ├── archive/             # Backups e versões antigas
│   └── public/              # Arquivos públicos
├── docs/                    # Documentação do projeto
│   ├── DOCKER_MONGODB.md
│   ├── ESTRUTURA.md
│   ├── INICIAR_MONGODB.md
│   ├── MONGODB_SETUP.md
│   └── README-v2.0.md
├── archive/                 # Versões anteriores
│   └── Dashboard-v1.0/      # Versão 1.0 (arquivada)
└── README.md               # Este arquivo

## Instalação

```bash
cd Dashboard-v2.0
npm install
```

## Executar a Aplicação

```bash
npm start
```

## Estrutura de Pastas - Dashboard-v2.0

- **src/** - Código-fonte React
- **server/** - Backend Express/Node.js
- **tests/** - Scripts de teste
- **config/** - Configurações (Vite, MongoDB, etc)
- **data/** - Arquivos JSON de dados
- **logs/** - Logs de execução
- **archive/** - Backups e código antigo
- **public/** - Assets estáticos

## Mudanças Recentes

### ✅ Removido
- Campo "Última Alteração" da tabela de inventário

### ✅ Reorganizado
- Arquivos de documentação movidos para `/docs`
- Configurações consolidadas em `/config`
- Dashboard v1.0 arquivado em `/archive/Dashboard-v1.0`
- Backup movido para `/archive` dentro do Dashboard-v2.0

## Tecnologias

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Banco de Dados**: MongoDB
- **Estilização**: CSS puro
