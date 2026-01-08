# 🚀 Deploy Vercel - Dashboard v2.0

## ✅ Arquivos de Configuração Criados

### 1. `vercel.json`
- Configuração do Vercel
- Rotas para API serverless
- Build settings

### 2. `api/index.js`
- API serverless para Vercel
- Endpoints: `/api/status`, `/api/inventory`

### 3. `package.json` (atualizado)
- Script `vercel-build` adicionado

### 4. `src/services/api.js` (atualizado)
- Detecção automática de ambiente
- Usa mesma origem em produção

---

## 📋 Passo a Passo para Deploy

### 1️⃣ Configurar Variáveis de Ambiente no Vercel

No painel do Vercel, adicione as variáveis:

```env
MONGODB_URI=mongodb+srv://SEU_USUARIO:SUA_SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=action1_inventory
```

**Como adicionar:**
1. Abra o projeto no Vercel
2. Settings → Environment Variables
3. Adicione cada variável
4. Marque: Production, Preview, Development

### 2️⃣ Fazer Deploy via VS Code

**Opção A: Extensão Vercel**
```
1. Ctrl+Shift+P
2. Digite "Vercel: Deploy"
3. Selecione o projeto
4. Aguarde o deploy
```

**Opção B: CLI Vercel**
```powershell
# Instalar Vercel CLI (se necessário)
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### 3️⃣ Após o Deploy

O Vercel vai gerar uma URL tipo:
```
https://seu-projeto.vercel.app
```

---

## ⚠️ LIMITAÇÕES DO VERCEL (IMPORTANTE!)

### ❌ O que NÃO funcionará:
1. **Sincronização Automática (Cron Jobs)**
   - Vercel Serverless não suporta cron nativo
   - Solução: Usar Vercel Cron (pago) ou serviço externo

2. **POST /api/sync**
   - A sincronização manual pode ter timeout (10s limit)
   - Solução: Mover para outro serviço ou otimizar

### ✅ O que FUNCIONARÁ:
- Frontend React completo
- GET /api/status
- GET /api/inventory
- GET /api/inventory/status/:status
- MongoDB Atlas (100% compatível)

---

## 🎯 Alternativas Recomendadas

### Opção 1: Frontend no Vercel + Backend Separado

**Frontend (Vercel):**
- Deploy: Dashboard React
- Grátis e rápido

**Backend (Railway/Render/Heroku):**
- Deploy: API Node.js completa
- Suporta cron jobs
- Suporta long-running tasks

### Opção 2: Tudo no Vercel (com limitações)

**Frontend + API Serverless:**
- ✅ Leitura de dados
- ❌ Sincronização (timeout)
- ❌ Cron jobs automáticos

### Opção 3: Tudo em VPS (DigitalOcean, AWS, etc)

**Deploy completo:**
- ✅ Tudo funciona
- ✅ Cron jobs
- ✅ Sem timeout
- 💰 Custo mensal

---

## 🔧 Configuração Recomendada

### Para este projeto, sugiro:

**1. Frontend no Vercel** ✅
```
✅ Grátis
✅ CDN global
✅ Deploy automático
✅ SSL incluído
```

**2. Backend no Railway** ✅
```
✅ Grátis até $5/mês
✅ Suporta Node.js completo
✅ Cron jobs funcionam
✅ MongoDB Atlas funciona
✅ Sem timeout
```

---

## 📝 Como Configurar (Recomendado)

### Deploy Frontend (Vercel):

1. **Criar novo arquivo:** `vite.config.production.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist'
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://seu-backend.railway.app')
  }
})
```

2. **Atualizar api.js:**
```javascript
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
```

3. **Deploy no Vercel:**
```bash
vercel --prod
```

### Deploy Backend (Railway):

1. **Criar conta:** railway.app
2. **New Project** → Deploy from GitHub
3. **Adicionar variáveis de ambiente:**
   - MONGODB_URI
   - MONGODB_DATABASE
4. **Deploy automático!**

---

## ✅ Checklist de Deploy

- [ ] MongoDB Atlas configurado e acessível
- [ ] Variáveis de ambiente prontas
- [ ] .gitignore atualizado
- [ ] Código no GitHub/GitLab
- [ ] Conta Vercel criada
- [ ] (Opcional) Conta Railway criada
- [ ] Extensão Vercel instalada no VS Code

---

## 🆘 Problemas Comuns

### "Build failed"
- Verificar se `npm run build` funciona localmente
- Verificar versões do Node no vercel.json

### "API not responding"
- Verificar variáveis de ambiente
- Verificar se MongoDB Atlas permite conexões da Vercel

### "Timeout on /api/sync"
- Normal - Vercel limita a 10s
- Usar Railway/Render para backend

---

## 🎉 Próximo Passo

Escolha sua estratégia:

**A) Apenas Frontend no Vercel** (limitado)
```bash
vercel --prod
```

**B) Frontend (Vercel) + Backend (Railway)** (recomendado)
```
1. Deploy backend no Railway
2. Atualizar VITE_API_URL
3. Deploy frontend no Vercel
```

**Quer que eu configure qual opção?**
