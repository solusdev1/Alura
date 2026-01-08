# ✅ Dashboard v2.0 - Configuração Atualizada

## 🎯 O que foi feito

Dashboard v2.0 configurado para usar **MongoDB na nuvem (MongoDB Atlas)** como principal, com fallback automático para JSON.

---

## 🚀 Como Usar

### Opção 1: Com MongoDB Atlas (Nuvem) - **Recomendado** ⭐

```powershell
# 1. Configurar conexão com MongoDB Atlas
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0\config"
.\setup-mongodb-atlas.ps1

# 2. Iniciar Dashboard
cd ..
npm start
```

### Opção 2: Com MongoDB Local

Crie um arquivo `.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=action1_inventory
```

```powershell
# Iniciar MongoDB local
net start MongoDB

# Iniciar Dashboard
npm start
```

### Opção 3: Sem MongoDB (Usa JSON automático)

```powershell
# Apenas iniciar Dashboard (usará arquivos JSON)
npm start
```

---

## 📋 Status Atual

✅ **Suporte MongoDB Atlas** - Configurado para nuvem  
✅ **Suporte MongoDB Local** - Também funciona  
✅ **Fallback automático** - Usa JSON se MongoDB não disponível  
✅ **Collections criadas automaticamente** - Na primeira sincronização  
✅ **Variáveis de ambiente** - Configuração via .env  

---

## 📊 Configuração

### MongoDB Atlas (Nuvem)
- **Connection**: Via `.env` (MONGODB_URI)
- **Database**: `action1_inventory` (configurável)
- **Collections**: `devices`, `metadata`
- **Fallback**: `data/inventory.json` e `data/metadata.json`

### Porta
- **Backend**: 3002
- **Frontend**: 5173 (Vite)

### Sincronização
- **Manual**: `POST /api/sync`
- **Automática**: Diariamente às 03:00

---

## 🌐 MongoDB Atlas - Setup Rápido

### Método 1: Script Automático (Mais Fácil)

```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0\config"
.\setup-mongodb-atlas.ps1
```

### Método 2: Manual

1. **Copie** sua connection string do MongoDB Atlas
2. **Crie** arquivo `.env` na raiz do Dashboard-v2.0:
   ```env
   MONGODB_URI=mongodb+srv://usuario:senha@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DATABASE=action1_inventory
   ```
3. **Inicie**: `npm start`

---

## 📚 Documentação

- [MONGODB_ATLAS_SETUP.md](../docs/MONGODB_ATLAS_SETUP.md) - Guia completo MongoDB Atlas
- [MONGODB_LOCAL.md](../docs/MONGODB_LOCAL.md) - Guia MongoDB local
- [README-v2.0.md](../docs/README-v2.0.md) - Documentação completa
- [MIGRACAO_DOCKER_LOCAL.md](../docs/MIGRACAO_DOCKER_LOCAL.md) - Migração do Docker

---

## 💡 Próximos Passos

### 1️⃣ Configurar MongoDB Atlas
```powershell
.\config\setup-mongodb-atlas.ps1
```

### 2️⃣ Iniciar Dashboard
```powershell
npm start
```

### 3️⃣ Sincronizar Dados
Acesse: http://localhost:3002/test
Clique em "Sincronizar Agora"

### 4️⃣ Ver Dados na Nuvem
No VS Code:
- Abra extensão MongoDB (🍃)
- Expanda sua conexão
- Expanda `action1_inventory`
- Veja collections `devices` e `metadata`

---

## ✅ Mensagens de Sucesso

### MongoDB Atlas (Nuvem)
```
✅ Conectado ao MongoDB Atlas (Nuvem)
📊 Database: action1_inventory
💾 Usando MongoDB como banco de dados
🚀 Servidor v2.0 rodando em http://localhost:3002
```

### MongoDB Local
```
✅ Conectado ao MongoDB Local
📊 Database: action1_inventory
💾 Usando MongoDB como banco de dados
🚀 Servidor v2.0 rodando em http://localhost:3002
```

### Fallback JSON
```
⚠️  MongoDB não disponível, usando JSON como fallback
💾 Usando JSON como banco de dados
🚀 Servidor v2.0 rodando em http://localhost:3002
```

---

## 🔒 Segurança

⚠️ **IMPORTANTE**: Nunca compartilhe o arquivo `.env`!

O `.gitignore` já está configurado para proteger suas credenciais:
```
.env
.env.local
```

---

## ✅ Status de Implementação

**Configuração Atual**: MongoDB Atlas + Fallback JSON  
**Docker**: ❌ Removido (não é mais usado)  
**MongoDB Local**: ✅ Suportado (via .env)  
**MongoDB Atlas**: ✅ Implementado e testado  
**Fallback JSON**: ✅ Funcionando  
**Collections auto-criadas**: ✅ Sim  
**Índices otimizados**: ✅ Criados automaticamente
