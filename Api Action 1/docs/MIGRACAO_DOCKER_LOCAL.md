# 🔄 Migração: Docker → MongoDB Local

## ✅ Mudanças Realizadas

### Arquivos Removidos
- ❌ `config/start-mongo.ps1` (script Docker)
- ❌ `config/start-mongodb.ps1` (script Docker)

### Arquivos Criados
- ✅ `config/start-mongodb-local.ps1` (verificação MongoDB local)
- ✅ `docs/MONGODB_LOCAL.md` (documentação completa)

### Arquivos Modificados
- ✅ `server/database/database.js` 
  - URI alterada para `mongodb://127.0.0.1:27017`
  - Timeout aumentado para 5000ms
  - Comentários atualizados

- ✅ `docs/README-v2.0.md`
  - Documentação atualizada
  - Instruções de MongoDB local

---

## 🚀 Como Usar Agora

### 1. Certifique-se que MongoDB está instalado

```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0\config"
.\start-mongodb-local.ps1
```

### 2. Inicie o MongoDB (se não estiver rodando)

```powershell
net start MongoDB
```

### 3. Execute o Dashboard

```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0"
npm start
```

---

## 📦 Se MongoDB NÃO estiver instalado

### Download e Instalação

1. **Baixe**: https://www.mongodb.com/try/download/community
2. **Versão**: MongoDB Community Server (Windows)
3. **Durante instalação**:
   - ✅ Install MongoDB as a Service
   - ✅ Run service as Network Service user
   - Porta padrão: 27017

### Após instalação

O MongoDB iniciará automaticamente como serviço do Windows.

---

## 🔧 Comandos Úteis

### Verificar se MongoDB está rodando
```powershell
Get-Service MongoDB
```

### Iniciar MongoDB
```powershell
net start MongoDB
```

### Parar MongoDB
```powershell
net stop MongoDB
```

### Verificar porta
```powershell
netstat -ano | findstr :27017
```

---

## ⚠️ Limpeza Docker (Opcional)

Se você tinha MongoDB no Docker e quer remover:

### Parar container (se estiver rodando)
```powershell
docker stop mongodb-action1
```

### Remover container
```powershell
docker rm mongodb-action1
```

### Remover volume (apaga os dados!)
```powershell
docker volume rm mongodb_data
```

### Remover imagem
```powershell
docker rmi mongo:latest
```

---

## ✅ Vantagens da Mudança

| Aspecto | Docker | MongoDB Local |
|---------|--------|---------------|
| **Performance** | Virtualizado | Nativo |
| **Inicialização** | Manual/Script | Automático (serviço) |
| **Recursos** | Mais RAM/CPU | Menos overhead |
| **Simplicidade** | Complexo | Direto |
| **Manutenção** | Docker + MongoDB | Apenas MongoDB |

---

## 🆘 Problemas?

### Dashboard não conecta ao MongoDB

1. Verifique se MongoDB está rodando:
   ```powershell
   Get-Process mongod
   ```

2. Tente iniciar:
   ```powershell
   net start MongoDB
   ```

3. Se falhar, verifique logs:
   ```powershell
   Get-EventLog -LogName Application -Source MongoDB -Newest 10
   ```

### Erro "MongoDB não disponível"

O sistema automaticamente usará arquivos JSON como fallback:
- ✅ Aplicação continua funcionando
- ⚠️ Dados em `data/inventory.json` e `data/metadata.json`

---

## 📚 Documentação

- [MONGODB_LOCAL.md](MONGODB_LOCAL.md) - Guia completo MongoDB local
- [README-v2.0.md](README-v2.0.md) - Documentação do Dashboard v2.0
