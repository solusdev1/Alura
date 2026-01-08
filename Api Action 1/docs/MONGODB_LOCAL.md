# 🍃 MongoDB Local - Dashboard v2.0

## 📋 Configuração Atual

O Dashboard v2.0 está configurado para usar **MongoDB instalado localmente** na máquina Windows, **sem Docker**.

---

## 🚀 Como Usar

### 1️⃣ Verificar se MongoDB está instalado

Execute o script de verificação:
```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0\config"
.\start-mongodb-local.ps1
```

### 2️⃣ Iniciar o MongoDB

**Se instalado como serviço** (recomendado):
```powershell
net start MongoDB
```

**Se não estiver como serviço**:
```powershell
& "C:\Program Files\MongoDB\Server\<versão>\bin\mongod.exe" --dbpath "C:\data\db"
```

### 3️⃣ Verificar se está rodando

```powershell
Get-Process -Name mongod
```

Ou tente conectar:
```powershell
& "C:\Program Files\MongoDB\Server\<versão>\bin\mongo.exe"
```

### 4️⃣ Iniciar o Dashboard

```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0"
npm start
```

---

## 📦 Instalação do MongoDB (se necessário)

1. **Download**: https://www.mongodb.com/try/download/community
2. **Durante a instalação**:
   - ✅ Install MongoDB as a Service
   - ✅ Run service as Network Service user
   - ✅ Install MongoDB Compass (opcional, interface gráfica)

3. **Configuração padrão**:
   - Porta: `27017`
   - URI: `mongodb://127.0.0.1:27017`
   - Data Path: `C:\data\db`

---

## 🔧 Comandos Úteis

### Parar o MongoDB
```powershell
net stop MongoDB
```

### Iniciar o MongoDB
```powershell
net start MongoDB
```

### Status do MongoDB
```powershell
Get-Service MongoDB
```

### Verificar processo
```powershell
Get-Process mongod
```

### Conectar ao MongoDB Shell
```powershell
mongosh
# ou para versões antigas:
mongo
```

---

## 🗄️ Configuração do Dashboard

O Dashboard está configurado em [server/database/database.js](../server/database/database.js):

```javascript
const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'action1_inventory';
```

**Fallback Automático**: Se o MongoDB não estiver disponível, o sistema usa arquivos JSON em `data/` como backup.

---

## ✅ Verificação de Funcionamento

Após iniciar o servidor com `npm start`, você deve ver:

```
✅ Conectado ao MongoDB local
💾 Usando MongoDB como banco de dados
🚀 Servidor v2.0 rodando em http://localhost:3002
```

Se ver "usando JSON como fallback", significa que o MongoDB não está rodando.

---

## 🆘 Problemas Comuns

### MongoDB não inicia
- Verifique se a pasta `C:\data\db` existe
- Execute como Administrador: `net start MongoDB`

### Porta 27017 já em uso
```powershell
netstat -ano | findstr :27017
```

### Reinstalar MongoDB
1. Desinstale pelo Painel de Controle
2. Remova `C:\Program Files\MongoDB`
3. Remova `C:\data\db` (opcional, apaga dados)
4. Reinstale

---

## 📝 Notas

- ❌ **Docker não é mais usado**
- ✅ **MongoDB local instalado diretamente no Windows**
- ✅ **Melhor performance** (sem virtualização)
- ✅ **Inicia automaticamente** com o Windows (se configurado como serviço)
