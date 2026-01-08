# 🐳 Docker + MongoDB - Guia Rápido

## ⚠️ IMPORTANTE: Reinicie o Terminal

Após instalar o Docker, você precisa **fechar e reabrir** o VS Code ou o terminal PowerShell para que o comando `docker` seja reconhecido.

---

## 🚀 Passos Rápidos

### 1️⃣ Reinicie o VS Code
- Feche completamente o VS Code
- Abra novamente
- Ou abra um novo terminal PowerShell

### 2️⃣ Inicie o MongoDB
```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0"
.\start-mongo.ps1
```

**OU** manualmente:
```powershell
docker run -d -p 27017:27017 --name mongodb-action1 -v mongodb_data:/data/db mongo:latest
```

### 3️⃣ Verifique se está rodando
```powershell
docker ps
```

Você deve ver:
```
CONTAINER ID   IMAGE          STATUS         PORTS                      NAMES
xxxxx          mongo:latest   Up X seconds   0.0.0.0:27017->27017/tcp   mongodb-action1
```

### 4️⃣ Inicie o Servidor
```powershell
npm run server
```

Agora você verá:
```
✅ Conectado ao MongoDB local
💾 Usando MongoDB como banco de dados
🚀 Servidor v2.0 rodando em http://localhost:3002
```

### 5️⃣ Sincronize os Dados
Abra o navegador em:
```
http://localhost:3002/api/sync
```

Ou via PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/sync" -Method POST
```

---

## 📊 Verificar Dados no MongoDB

### Via Docker:
```powershell
docker exec -it mongodb-action1 mongosh
```

Dentro do mongosh:
```javascript
use action1_inventory
db.devices.countDocuments()
db.devices.find().limit(3)
```

### Via MongoDB Compass (Interface Gráfica):
1. Baixe: https://www.mongodb.com/try/download/compass
2. Conecte em: `mongodb://localhost:27017`
3. Database: `action1_inventory`

---

## 🔧 Comandos Úteis do Docker

### Ver containers rodando:
```powershell
docker ps
```

### Ver todos os containers (incluindo parados):
```powershell
docker ps -a
```

### Parar MongoDB:
```powershell
docker stop mongodb-action1
```

### Iniciar MongoDB:
```powershell
docker start mongodb-action1
```

### Ver logs:
```powershell
docker logs mongodb-action1
```

### Remover container:
```powershell
docker rm -f mongodb-action1
```

### Remover volume de dados:
```powershell
docker volume rm mongodb_data
```

---

## ✅ Checklist

- [ ] Docker instalado e Docker Desktop rodando
- [ ] Terminal reiniciado (fechar e reabrir VS Code)
- [ ] Comando `docker ps` funciona
- [ ] Container MongoDB criado e rodando
- [ ] Servidor Node.js conectado ao MongoDB
- [ ] Sincronização funcionando

---

## 🎯 Resultado Esperado

Quando tudo estiver funcionando:

```
✅ Conectado ao MongoDB local
💾 Usando MongoDB como banco de dados
🚀 Servidor v2.0 rodando em http://localhost:3002
📦 Dispositivos no banco: 89
```

A aplicação migrará automaticamente de JSON para MongoDB assim que detectar que o MongoDB está disponível!

---

## 💡 Dica

Enquanto o Docker não estiver disponível no terminal, a aplicação funciona perfeitamente com JSON. Você pode usar normalmente e migrar para MongoDB depois quando reiniciar.
