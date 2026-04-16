# 📋 Índice de Documentação

## 🚀 Para Usar Agora

- **[⚡ QUICKSTART.md](QUICKSTART.md)** - Comece em 2 minutos
- **[start.bat](start.bat)** - Execute em Windows
- **[start.sh](start.sh)** - Execute em Linux/Mac

## 📖 Para Entender

- **[README.md](README.md)** - Visão geral do projeto
- **[RESUMO.md](RESUMO.md)** - O que foi feito e removido

## 🖥️ Para Deploy no Servidor

- **[DEPLOY.md](DEPLOY.md)** - Guia completo de deployment
- **[CHECKLIST.md](CHECKLIST.md)** - Checklist passo-a-passo
- **[setup.bat](setup.bat)** - Script de setup (Windows)
- **[setup.sh](setup.sh)** - Script de setup (Linux/Mac)

## 📁 Estrutura do Projeto

```
unifi-voucher/
├── 📄 Arquivos de Documentação
│   ├── README.md          ← Leia isto primeiro
│   ├── QUICKSTART.md      ← Para começar rápido
│   ├── DEPLOY.md          ← Para server/produção
│   ├── CHECKLIST.md       ← Checklist de deploy
│   └── RESUMO.md          ← Resumo das mudanças
│
├── 🚀 Scripts de Execução
│   ├── start.bat          ← Iniciar (Windows)
│   ├── start.sh           ← Iniciar (Linux/Mac)
│   ├── setup.bat          ← Setup (Windows)
│   └── setup.sh           ← Setup (Linux/Mac)
│
├── ⚙️ Configuração
│   ├── .env.example       ← Template de configuração
│   ├── .env               ← Suas configurações (não versionado)
│   ├── .gitignore         ← Configuração Git
│   └── package.json       ← Dependências Node.js
│
├── 💾 Servidor
│   ├── server.js          ← Servidor Express principal
│   │
│   ├── 📁 db/
│   │   ├── database.js    ← Setup do banco SQLite
│   │   └── visitors.db    ← Banco de dados (criado auto)
│   │
│   ├── 📁 routes/
│   │   ├── api.js         ← Endpoints REST
│   │   ├── auth.js        ← Autenticação JWT
│   │   └── unifi.js       ← Integração Unifi
│   │
│   └── 📁 public/
│       ├── login.html     ← Página de login
│       ├── dashboard.html ← Dashboard principal
│       ├── historico.html ← Histórico de vouchers
│       └── imprimir.html  ← Página de impressão
```

## 🎯 Fluxo de Uso

### Primeira Vez?
1. Leia [QUICKSTART.md](QUICKSTART.md)
2. Execute `setup.bat` ou `./setup.sh`
3. Execute `start.bat` ou `./start.sh`

### Levando para Servidor?
1. Leia [DEPLOY.md](DEPLOY.md)
2. Use [CHECKLIST.md](CHECKLIST.md) como guia
3. Copie a pasta sem `node_modules`
4. Execute `./setup.sh` no servidor
5. Configure PM2 ou Systemd

### Entender o Código?
1. Leia [README.md](README.md) para estrutura
2. Leia [RESUMO.md](RESUMO.md) para entender mudanças
3. Explore arquivo por arquivo

## 🔑 Informações Importantes

⚠️ **Arquivo `.env`**
- Contém credenciais sensíveis
- Nunca versioná-lo no Git
- Criar a partir de `.env.example`
- Manter seguro no servidor

✅ **Dependências**
- Instaladas via `npm install`
- Baseado em `package.json`
- Node.js 18+ required

🗄️ **Banco de Dados**
- SQLite em `db/visitors.db`
- Criado automaticamente na primeira execução
- Senhas criptografadas com bcrypt
- Fazer backup regularmente

🔐 **Segurança**
- Autenticação JWT (8 horas de validade)
- Roles: recepcao (gera vouchers) | admin (visualiza)
- Credenciais de demo removidas do frontend
- Headers de segurança configurados

---

**Pronto para começar? → [QUICKSTART.md](QUICKSTART.md)** ⚡
