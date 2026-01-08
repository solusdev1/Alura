# 🚀 Passos para Iniciar o MongoDB e a Aplicação

## 1️⃣ Reiniciar o Terminal PowerShell

Feche e abra um novo terminal PowerShell para que o Docker seja reconhecido.

## 2️⃣ Iniciar MongoDB via Docker

Abra um **novo** PowerShell e execute:

```powershell
docker run -d -p 27017:27017 --name mongodb-action1 -v mongodb_action1_data:/data/db mongo:latest
```

**Aguarde alguns segundos** para o container baixar a imagem (primeira vez).

## 3️⃣ Verificar se MongoDB está rodando

```powershell
docker ps
```

Você deve ver algo como:
```
CONTAINER ID   IMAGE          STATUS         PORTS                      NAMES
xxxxxxxxxxxxx  mongo:latest   Up X seconds   0.0.0.0:27017->27017/tcp   mongodb-action1
```

## 4️⃣ Iniciar o Servidor

```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0"
npm run server
```

Você deverá ver:
```
✅ Conectado ao MongoDB local
🚀 Servidor v2.0 rodando em http://localhost:3002
💾 Banco de dados: MongoDB (local)
📦 Dispositivos no banco: 0
```

## 5️⃣ Testar a Aplicação

Abra o navegador em: http://localhost:3002/api/status

Ou teste via PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/status" -Method GET
```

## 6️⃣ Fazer Sincronização

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/sync" -Method POST
```

---

## ⚙️ Comandos Úteis do Docker

### Parar MongoDB
```powershell
docker stop mongodb-action1
```

### Iniciar MongoDB novamente
```powershell
docker start mongodb-action1
```

### Ver logs do MongoDB
```powershell
docker logs mongodb-action1
```

### Remover container (mantém os dados)
```powershell
docker rm -f mongodb-action1
```

### Remover dados completamente
```powershell
docker volume rm mongodb_action1_data
```

---

## 🔍 Verificar Dados no MongoDB

### Opção 1: MongoDB Compass (Interface Gráfica)
1. Baixe: https://www.mongodb.com/try/download/compass
2. Conecte em: `mongodb://localhost:27017`
3. Navegue até database: `action1_inventory`

### Opção 2: Linha de Comando
```powershell
# Acessar shell do MongoDB
docker exec -it mongodb-action1 mongosh

# Dentro do mongosh:
use action1_inventory
db.devices.countDocuments()
db.devices.find().limit(3)
db.metadata.findOne({ _id: 'sync_info' })
```

---

## 📊 Estrutura do Banco

**Database:** `action1_inventory`

**Collections:**
- `devices` - Dispositivos do inventário
- `metadata` - Informações de sincronização

**Índices:**
- `id` (único)
- `status`
- `organizacao`

---

## ❌ Problemas Comuns

### "Docker não é reconhecido"
- **Solução:** Feche e reabra o PowerShell
- Ou reinicie o computador

### "Cannot connect to Docker daemon"
- **Solução:** Abra o Docker Desktop
- Aguarde até ver "Docker Desktop is running"

### "Port 27017 already in use"
- **Solução:** 
```powershell
docker stop mongodb-action1
docker rm mongodb-action1
# Depois execute o comando run novamente
```

### "Cannot connect to MongoDB"
- **Solução:** Verifique se o container está rodando:
```powershell
docker ps
```
- Se não estiver na lista, inicie:
```powershell
docker start mongodb-action1
```

---

## ✅ Próximos Passos

Após tudo funcionando:

1. ✅ MongoDB rodando no Docker
2. ✅ Servidor Node.js rodando (`npm run server`)
3. ✅ Testar API: `http://localhost:3002/api/status`
4. ✅ Sincronizar dados: `POST http://localhost:3002/api/sync`
5. ✅ Abrir frontend: `npm run dev` (em outro terminal)
