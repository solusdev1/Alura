# 🌐 Configuração MongoDB Atlas (Nuvem)

## 🎯 Passos Rápidos

### 1️⃣ Obter Connection String

No VS Code, com a extensão MongoDB:

1. **Veja suas conexões** no painel MongoDB (ícone de folha 🍃 na barra lateral)
2. **Clique com botão direito** na sua conexão
3. **Copie a Connection String**

Ou no MongoDB Atlas (site):
1. Acesse https://cloud.mongodb.com
2. Vá em **Database** → **Connect** → **Connect your application**
3. Copie a connection string

### 2️⃣ Criar arquivo .env

```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0"
Copy-Item .env.example .env
notepad .env
```

### 3️⃣ Configurar .env

Edite o arquivo `.env` e cole sua connection string:

```env
# Cole sua connection string do MongoDB Atlas aqui
MONGODB_URI=mongodb+srv://seu-usuario:sua-senha@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Nome do banco de dados
MONGODB_DATABASE=action1_inventory
```

**⚠️ Importante:**
- Substitua `seu-usuario` e `sua-senha` pelas credenciais corretas
- Mantenha `MONGODB_DATABASE=action1_inventory` ou escolha outro nome

### 4️⃣ Iniciar Dashboard

```powershell
npm start
```

Você deve ver:
```
✅ Conectado ao MongoDB Atlas (Nuvem)
📊 Database: action1_inventory
💾 Usando MongoDB como banco de dados
🚀 Servidor v2.0 rodando em http://localhost:3002
```

---

## 📋 Formato da Connection String

### MongoDB Atlas (Nuvem)
```
mongodb+srv://usuario:senha@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### MongoDB Local (sem .env)
```
mongodb://127.0.0.1:27017
```

---

## 🔄 Como Funciona

### Prioridade de Conexão:

1. **MongoDB Atlas** (se `.env` configurado)
   ```
   ✅ Conectado ao MongoDB Atlas (Nuvem)
   ```

2. **MongoDB Local** (se não houver `.env`)
   ```
   ✅ Conectado ao MongoDB Local
   ```

3. **Fallback JSON** (se nenhum MongoDB disponível)
   ```
   ⚠️  MongoDB não disponível, usando JSON como fallback
   ```

---

## 📊 Sincronização e Collections

Ao fazer a primeira sincronização (`POST /api/sync`), o sistema:

1. **Cria automaticamente** o database `action1_inventory`
2. **Cria as collections**:
   - `devices` - armazena todos os dispositivos
   - `metadata` - informações de sincronização
3. **Cria índices** para melhor performance:
   - `id` (único)
   - `status`
   - `organizacao`

### Testar Sincronização

```powershell
# No navegador ou usando curl
curl -X POST http://localhost:3002/api/sync
```

Ou acesse: http://localhost:3002/test e clique em "Sincronizar Agora"

---

## 🛠️ Comandos Úteis

### Verificar qual banco está usando
```powershell
curl http://localhost:3002/api/status
```

### Ver dados no MongoDB Atlas

No VS Code:
1. Abra a extensão MongoDB
2. Expanda sua conexão
3. Expanda `action1_inventory`
4. Clique nas collections `devices` ou `metadata`
5. Explore os documentos

---

## 🔒 Segurança

### ⚠️ Nunca commite o arquivo .env!

O `.gitignore` já está configurado para ignorar:
```
.env
.env.local
```

### ✅ Boas Práticas:
- Use usuário específico para a aplicação (não admin)
- Configure IP Whitelist no MongoDB Atlas
- Use senhas fortes
- Rotacione credenciais periodicamente

---

## 🆘 Problemas Comuns

### Erro: "bad auth"
- ✅ Verifique usuário e senha no `.env`
- ✅ Certifique-se que o usuário existe no MongoDB Atlas

### Erro: "network timeout"
- ✅ Verifique sua conexão com internet
- ✅ Confirme que seu IP está na whitelist do Atlas

### Usando JSON mesmo com .env configurado
- ✅ Verifique se o arquivo é `.env` (não `.env.example`)
- ✅ Verifique se não há espaços extras na connection string
- ✅ Reinicie o servidor: parar e `npm start` novamente

### Ver logs detalhados
```powershell
# Inicie apenas o servidor para ver logs
npm run server:only
```

---

## 📝 Exemplo de .env Completo

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://dashboard-user:Abc123456@cluster0.ab1cd.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=action1_inventory
```

---

## ✅ Checklist de Configuração

- [ ] Extensão MongoDB instalada no VS Code
- [ ] Conectado ao MongoDB Atlas na extensão
- [ ] Connection string copiada
- [ ] Arquivo `.env` criado (renomeado de `.env.example`)
- [ ] Connection string colada no `.env`
- [ ] Servidor reiniciado (`npm start`)
- [ ] Mensagem "✅ Conectado ao MongoDB Atlas (Nuvem)" apareceu
- [ ] Sincronização executada (`POST /api/sync`)
- [ ] Collections criadas e visíveis na extensão MongoDB

---

## 🎉 Resultado Esperado

Após configurar, ao executar `npm start`:

```
✅ Conectado ao MongoDB Atlas (Nuvem)
📊 Database: action1_inventory
💾 Usando MongoDB como banco de dados
🚀 Servidor v2.0 rodando em http://localhost:3002
📦 Dispositivos no banco: 0
🕐 Última sincronização: Nunca
```

Execute a sincronização e veja os dados na nuvem! 🚀
