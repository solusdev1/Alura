# 🍃 Guia de Instalação do MongoDB Local (Windows)

## Opção 1: Instalação via Chocolatey (Recomendado)

### Passo 1: Instalar MongoDB
```powershell
# Se não tiver Chocolatey instalado:
# Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar MongoDB
choco install mongodb -y
```

### Passo 2: Criar diretórios de dados
```powershell
# Criar pasta para dados do MongoDB
New-Item -ItemType Directory -Force -Path C:\data\db
```

### Passo 3: Iniciar MongoDB
```powershell
# Iniciar MongoDB manualmente
mongod --dbpath C:\data\db
```

**OU** criar como serviço:
```powershell
# Executar como Administrador
mongod --install --serviceName "MongoDB" --serviceDisplayName "MongoDB" --dbpath C:\data\db

# Iniciar serviço
net start MongoDB
```

---

## Opção 2: Download Manual

### Passo 1: Baixar MongoDB
1. Acesse: https://www.mongodb.com/try/download/community
2. Escolha a versão para Windows
3. Baixe o instalador MSI

### Passo 2: Instalar
1. Execute o arquivo MSI baixado
2. Escolha "Complete" installation
3. **IMPORTANTE**: Marque a opção "Install MongoDB as a Service"
4. **IMPORTANTE**: Marque "Install MongoDB Compass" (interface gráfica opcional)

### Passo 3: Verificar Instalação
```powershell
# Verificar versão
mongod --version

# Verificar se o serviço está rodando
Get-Service MongoDB
```

---

## Opção 3: MongoDB em Docker (Mais Rápido)

Se você tem Docker instalado:

```powershell
# Criar e executar container MongoDB
docker run -d -p 27017:27017 --name mongodb-action1 -v mongodb_data:/data/db mongo:latest

# Verificar se está rodando
docker ps
```

Para parar:
```powershell
docker stop mongodb-action1
```

Para iniciar novamente:
```powershell
docker start mongodb-action1
```

---

## Verificar Conexão

Após instalar e iniciar o MongoDB, teste a conexão:

```powershell
# Conectar ao MongoDB shell
mongosh
# ou (versão antiga)
mongo
```

Se conectar com sucesso, você verá algo como:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/
Using MongoDB: 7.x.x
```

---

## Iniciar a Aplicação

Depois que o MongoDB estiver rodando:

```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0"
npm run server
```

Você deverá ver:
```
✅ Conectado ao MongoDB local
🚀 Servidor v2.0 rodando em http://localhost:3002
💾 Banco de dados: MongoDB (local)
```

---

## Estrutura do Banco de Dados

**Database**: `action1_inventory`

**Collections**:
- `devices` - Armazena todos os dispositivos do inventário
- `metadata` - Armazena informações de sincronização

**Índices criados automaticamente**:
- `id` (único) - Para busca rápida por ID
- `status` - Para filtrar por status (Online/Offline)
- `organizacao` - Para filtrar por organização

---

## Gerenciar MongoDB

### Ver bancos de dados:
```javascript
// No mongosh
show dbs
use action1_inventory
show collections
```

### Ver documentos:
```javascript
// Ver todos os dispositivos
db.devices.find().limit(5)

// Ver metadados
db.metadata.findOne({ _id: 'sync_info' })

// Contar dispositivos
db.devices.countDocuments()
```

### Limpar dados:
```javascript
// Limpar coleção de dispositivos
db.devices.deleteMany({})

// Excluir banco inteiro
use action1_inventory
db.dropDatabase()
```

---

## Troubleshooting

### Erro: "MongoDB não está rodando"
```powershell
# Verificar se o serviço está ativo
Get-Service MongoDB

# Se não estiver, iniciar:
net start MongoDB
```

### Erro: "Porta 27017 já em uso"
```powershell
# Ver qual processo está usando a porta
netstat -ano | findstr :27017

# Parar o processo (substitua PID pelo número encontrado)
taskkill /PID [número_do_pid] /F
```

### Erro: "Falha ao conectar"
- Verifique se o MongoDB está rodando
- Verifique se a porta 27017 está aberta
- Tente reiniciar o serviço MongoDB

---

## MongoDB Compass (Interface Gráfica)

Para visualizar e gerenciar dados graficamente:

1. Abra MongoDB Compass
2. Conecte em: `mongodb://localhost:27017`
3. Navegue até o database `action1_inventory`
4. Explore as collections `devices` e `metadata`

---

## Próximos Passos

Após configurar o MongoDB:

1. ✅ Inicie o MongoDB
2. ✅ Execute `npm run server`
3. ✅ Teste com: `http://localhost:3002/api/status`
4. ✅ Execute sincronização: `POST http://localhost:3002/api/sync`
5. ✅ Visualize dados: `http://localhost:3002/api/inventory`
