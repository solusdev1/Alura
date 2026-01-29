# API Action 1 - Dashboard de Inventário

## 🚀 Deploy

**URL de Produção:** https://inventario-two-gamma.vercel.app

## Estrutura do Projeto

```
Api Action 1/
├── Dashboard-v2.0/          # Aplicação principal
│   ├── src/                 # Código-fonte React
│   │   ├── components/      # Componentes React (App.jsx)
│   │   ├── services/        # Serviços e APIs
│   │   └── styles/          # Arquivos CSS
│   ├── server/              # Backend Node.js
│   │   ├── controllers/     # Controladores da API
│   │   ├── database/        # Configurações MongoDB
│   │   ├── routes/          # Rotas da API
│   │   └── utils/           # Utilitários e segurança
│   ├── scripts/             # Scripts PowerShell
│   ├── api/                 # API serverless (Vercel)
│   ├── data/                # Dados JSON e metadata
│   ├── public/              # Arquivos públicos
│   ├── package.json         # Dependências do projeto
│   ├── vite.config.js       # Configuração Vite
│   ├── vercel.json          # Configuração Vercel
│   └── README.md            # Documentação do Dashboard
└── README.md                # Este arquivo
```

## Instalação

```bash
cd Dashboard-v2.0
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build para Produção

```bash
npm run build
```

## Deploy para Vercel

```bash
vercel --prod
```

## Funcionalidades

- ✅ Dashboard de inventário de dispositivos
- ✅ Sincronização com Action1
- ✅ Filtros e busca avançada
- ✅ Exportação para CSV
- ✅ **Modo Noturno** - Alterna entre tema claro e escuro
- ✅ Tabelas redimensionáveis
- ✅ Ordenação por colunas
- ✅ Status em tempo real
- ✅ Deploy automático no Vercel

## Tecnologias

- **Frontend:** React 18, Vite
- **Backend:** Node.js, Express
- **Banco de Dados:** MongoDB
- **Deploy:** Vercel (Serverless)
- **Estilização:** CSS puro com Dark Mode

## Modo Noturno

O dashboard agora inclui um modo noturno completo:
- 🌙 Clique no botão no canto superior direito para alternar
- ☀️ Preferência salva automaticamente no navegador
- 🎨 Paleta de cores otimizada para conforto visual
- ⚡ Transições suaves entre temas

## Limpeza Realizada

O projeto foi otimizado removendo:
- ❌ Arquivos de backup e versões antigas (Dashboard v1.0)
- ❌ Logs e arquivos temporários
- ❌ Documentação duplicada
- ❌ Arquivos de teste e debug
- ❌ Configurações redundantes

Estrutura agora mais limpa e organizada para melhor manutenção.
