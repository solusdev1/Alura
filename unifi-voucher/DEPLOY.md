# 📦 Guia de Deploy

Instruções para implantar o sistema em um servidor.

## 🚀 No Servidor

### 1. Preparação

```bash
# Clonar ou copiar a pasta do projeto
cd /caminho/do/projeto

# Instalar dependências
npm install

# Copiar configurações
cp .env.example .env
```

### 2. Configurar .env

Edite o arquivo `.env` com as credenciais do seu Unifi Controller:

```env
UNIFI_HOST=192.168.1.100
UNIFI_PORT=8443
UNIFI_USERNAME=seu_usuario
UNIFI_PASSWORD=sua_senha
UNIFI_SITE=default

VOUCHER_EXPIRE=480
VOUCHER_QUOTA=1

PORT=3000
NODE_ENV=production
```

### 3. Iniciar o Sistema

#### Opção A: Execução Manual (Desenvolvimento)
```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

#### Opção B: PM2 (Recomendado para Produção)

```bash
# Instalar PM2 globalmente (uma vez)
npm install -g pm2

# Iniciar com PM2
pm2 start server.js --name "voucher-wifi"

# Salvar configuração
pm2 save

# Iniciar automaticamente no boot
pm2 startup

# Visualizar status
pm2 status
pm2 logs
```

#### Opção C: Systemd (Linux)

Crie `/etc/systemd/system/voucher-wifi.service`:

```ini
[Unit]
Description=Unifi Voucher System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/caminho/do/projeto
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ativar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable voucher-wifi
sudo systemctl start voucher-wifi
```

### 4. Nginx Reverso (Opcional)

Se acessar de fora da rede local, configure um proxy reverso:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ✅ Verificação

Após iniciar, teste:

```bash
# Verificar se está respondendo
curl http://localhost:3000

# Verificar logs (se usar PM2)
pm2 logs voucher-wifi
```

## 🔄 Atualizar

Para atualizar o código no servidor:

```bash
# Parar o serviço
pm2 stop voucher-wifi
# ou
systemctl stop voucher-wifi

# Atualizar arquivos
git pull
# ou copiar novos arquivos

# Instalar dependências (se houver package.json atualizado)
npm install

# Reiniciar
pm2 restart voucher-wifi
# ou
systemctl start voucher-wifi
```

## 🐛 Troubleshooting

**Porta 3000 já em uso:**
```bash
# Mudar porta em .env (PORT=3001)
# ou encontrar processo
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Erro de conexão com Unifi:**
- Verificar IP e credenciais em `.env`
- Testar conectividade: `ping <UNIFI_HOST>`
- Verificar firewall

**Banco de dados corrompido:**
```bash
# Remover e deixar recriar
rm db/visitors.db
npm start
```
