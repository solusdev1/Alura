# 🚀 Migração para Windows Server 2022
**IP do Servidor:** `172.16.0.7`  
**Data:** Janeiro 2026

---

## ✅ CONFIGURAÇÕES JÁ APLICADAS

### 1. Script PowerShell AD Display Name
- ✅ IP atualizado de `172.16.2.181` → `172.16.0.7`
- ✅ Arquivo: `scripts/set-ad-display-name.ps1`
- ✅ URL: `http://172.16.0.7:3002/api/save-display-name`

### 2. CORS Whitelist
- ✅ Adicionado `http://172.16.0.7:3002` (Backend servidor)
- ✅ Adicionado `http://172.16.0.7:5173` (Frontend servidor)
- ✅ Mantido `http://172.16.2.181:*` (Desenvolvimento)
- ✅ Arquivo: `server/index.js`

---

## 📋 PASSOS PARA MIGRAÇÃO

### **PASSO 1: Preparar o Servidor Windows Server 2022**

#### 1.1 Instalar Node.js
```powershell
# Baixar e instalar Node.js v18+ (LTS)
# https://nodejs.org/

# Verificar instalação
node --version
npm --version
```

#### 1.2 Instalar MongoDB (OPCIONAL - se não usar Atlas)
```powershell
# Opção 1: MongoDB Atlas (Recomendado - nuvem)
# Sem instalação necessária, apenas string de conexão

# Opção 2: MongoDB Local
# Baixar: https://www.mongodb.com/try/download/community
# Instalar como serviço Windows
```

#### 1.3 Criar Pasta do Projeto
```powershell
# Criar diretório
New-Item -ItemType Directory -Path "C:\inetpub\dashboard-backend" -Force
```

---

### **PASSO 2: Copiar Arquivos**

```powershell
# Copiar de: C:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0
# Para: C:\inetpub\dashboard-backend

# Arquivos essenciais:
# - server/
# - scripts/
# - package.json
# - .env (criar no servidor)
# - node_modules/ (NÃO copiar, reinstalar)
```

---

### **PASSO 3: Configurar Variáveis de Ambiente**

Criar arquivo `.env` em `C:\inetpub\dashboard-backend\.env`:

```env
# ============================================
# MONGODB
# ============================================
# OPÇÃO 1: MongoDB Atlas (Nuvem - Recomendado)
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/action1_inventory?retryWrites=true&w=majority

# OPÇÃO 2: MongoDB Local
# MONGODB_URI=mongodb://127.0.0.1:27017

MONGODB_DATABASE=action1_inventory

# ============================================
# API ACTION1
# ============================================
ACTION1_CLIENT_ID=seu_client_id_aqui
ACTION1_CLIENT_SECRET=seu_client_secret_aqui

# ============================================
# SERVIDOR
# ============================================
PORT=3002
NODE_ENV=production
```

---

### **PASSO 4: Instalar Dependências**

```powershell
cd C:\inetpub\dashboard-backend
npm install --production
```

---

### **PASSO 5: Configurar Firewall**

```powershell
# Abrir porta 3002 (Backend API)
New-NetFirewallRule -DisplayName "Dashboard Backend API" -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow

# Abrir porta 5173 (Frontend - opcional)
New-NetFirewallRule -DisplayName "Dashboard Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Abrir porta 27017 (MongoDB Local - se usar)
New-NetFirewallRule -DisplayName "MongoDB Local" -Direction Inbound -LocalPort 27017 -Protocol TCP -Action Allow
```

---

### **PASSO 6: Configurar como Serviço Windows**

#### Opção A: Usando PM2 (Recomendado)

```powershell
# Instalar PM2 globalmente
npm install -g pm2
npm install -g pm2-windows-service

# Configurar PM2 como serviço Windows
pm2-service-install -n PM2

# Iniciar o backend
cd C:\inetpub\dashboard-backend
pm2 start server/index.js --name "dashboard-backend"

# Salvar configuração
pm2 save

# Verificar status
pm2 status
pm2 logs dashboard-backend
```

#### Opção B: Usando NSSM (Non-Sucking Service Manager)

```powershell
# Baixar NSSM: https://nssm.cc/download

# Instalar serviço
nssm install DashboardBackend "C:\Program Files\nodejs\node.exe" "C:\inetpub\dashboard-backend\server\index.js"

# Configurar diretório de trabalho
nssm set DashboardBackend AppDirectory "C:\inetpub\dashboard-backend"

# Iniciar serviço
nssm start DashboardBackend

# Verificar status
nssm status DashboardBackend
```

---

### **PASSO 7: Testar o Backend**

```powershell
# Testar status do servidor
Invoke-RestMethod -Uri "http://172.16.0.7:3002/api/status" -Method GET

# Testar sincronização
Invoke-RestMethod -Uri "http://172.16.0.7:3002/api/sync" -Method POST

# Testar inventário
Invoke-RestMethod -Uri "http://172.16.0.7:3002/api/inventory" -Method GET
```

---

### **PASSO 8: Atualizar Máquinas Cliente**

Se você distribui o script `set-ad-display-name.ps1` via GPO:

```powershell
# O script JÁ está configurado com o novo IP (172.16.0.7)
# Redistribuir via GPO ou copiar manualmente

# Testar do cliente:
.\set-ad-display-name.ps1
```

---

## 🔒 CHECKLIST DE SEGURANÇA

- [ ] Firewall configurado (apenas portas necessárias)
- [ ] Arquivo `.env` com credenciais protegido
- [ ] CORS whitelist configurado
- [ ] Rate limiting ativo (15 min / 100 req)
- [ ] Helmet.js ativo (headers de segurança)
- [ ] MongoDB com autenticação (se local)
- [ ] Backup automático do MongoDB configurado

---

## 📊 MONITORAMENTO

### Logs do PM2
```powershell
pm2 logs dashboard-backend
pm2 logs dashboard-backend --lines 100
```

### Logs do Sistema
```powershell
# Ver logs do Windows Event Viewer
Get-EventLog -LogName Application -Source "Node.js" -Newest 50
```

### Verificar Uso de Recursos
```powershell
pm2 monit
```

---

## 🔄 MANUTENÇÃO

### Atualizar Código
```powershell
cd C:\inetpub\dashboard-backend

# Parar serviço
pm2 stop dashboard-backend

# Atualizar arquivos (copiar novos)
# ...

# Reinstalar dependências (se necessário)
npm install --production

# Reiniciar serviço
pm2 restart dashboard-backend
```

### Backup MongoDB
```powershell
# MongoDB Atlas: Backup automático incluído

# MongoDB Local:
mongodump --db action1_inventory --out C:\Backups\mongodb\$(Get-Date -Format 'yyyy-MM-dd')
```

---

## ⚠️ TROUBLESHOOTING

### Backend não inicia
```powershell
# Verificar logs
pm2 logs dashboard-backend --err

# Verificar porta em uso
netstat -ano | findstr :3002

# Verificar variáveis de ambiente
cat .env
```

### Erro de conexão MongoDB
```powershell
# Testar conexão MongoDB
node -e "const { MongoClient } = require('mongodb'); const client = new MongoClient('sua-connection-string'); client.connect().then(() => console.log('OK')).catch(e => console.error(e));"
```

### CORS bloqueado
```powershell
# Verificar logs do servidor
pm2 logs dashboard-backend | Select-String "CORS"

# Adicionar IP no server/index.js na lista allowedOrigins
```

---

## 📞 CONTATOS

**Servidor:** Windows Server 2022 Standard  
**IP:** 172.16.0.7  
**Porta Backend:** 3002  
**Porta Frontend:** 5173 (opcional)  

---

## ✅ VALIDAÇÃO FINAL

Após migração, testar:

1. ✅ Backend rodando: `http://172.16.0.7:3002/api/status`
2. ✅ Sincronização funcionando: POST `/api/sync`
3. ✅ Inventário retornando dados: GET `/api/inventory`
4. ✅ Script PowerShell salvando Display Names
5. ✅ Serviço Windows iniciando automaticamente
6. ✅ Logs sendo gerados corretamente
7. ✅ MongoDB persistindo dados

---

**Status:** Pronto para migração  
**Última atualização:** Janeiro 2026
