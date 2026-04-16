# ✅ Checklist de Deploy

Use este checklist para garantir que tudo está configurado corretamente antes de levar para o servidor.

## 📋 Pré-Deploy (Local)

- [ ] Sistema rodando em `http://localhost:3000`
- [ ] Login funciona com credenciais (recepcao/admin)
- [ ] Dashboard carrega após login
- [ ] Poder gerar voucher (role recepcao)
- [ ] Poder visualizar histórico (role admin)
- [ ] `.env` configurado com credenciais Unifi reais
- [ ] Banco de dados (`db/visitors.db`) criado

## 📦 Preparação para Deploy

- [ ] Remover `node_modules` (será instalado no servidor)
- [ ] Remover `package-lock.json` (será criado no servidor)
- [ ] Verificar se todos os arquivos principais estão:
  - [ ] `server.js`
  - [ ] `package.json`
  - [ ] `.env.example`
  - [ ] `db/database.js`
  - [ ] `routes/api.js`, `auth.js`, `unifi.js`
  - [ ] `public/login.html`, `dashboard.html`, etc.
  - [ ] `start.bat` ou `start.sh`
  - [ ] `README.md`
  - [ ] `DEPLOY.md`

## 🖥️ No Servidor

### Instalação Inicial

- [ ] Copiar pasta do projeto
- [ ] `npm install` executado com sucesso
- [ ] `.env` criado a partir de `.env.example`
- [ ] Valores em `.env` preenchidos corretamente:
  - [ ] `UNIFI_HOST` (IP do controller)
  - [ ] `UNIFI_PORT` (geralmente 8443)
  - [ ] `UNIFI_USERNAME`
  - [ ] `UNIFI_PASSWORD`
  - [ ] `UNIFI_SITE`
  - [ ] `PORT` (se não for 3000)
  - [ ] `NODE_ENV=production`

### Testes Iniciais

- [ ] System inicia sem erros: `npm start` ou `./start.sh`
- [ ] Acessível em `http://localhost:3000`
- [ ] Login funciona com as credenciais configuradas
- [ ] Banco de dados criado automaticamente
- [ ] Usuários padrão (recepcao/admin) criados

### Configuração de Produção

Escolha um método e configure:

**PM2 (Recomendado):**
- [ ] PM2 instalado globalmente
- [ ] Serviço iniciado com `pm2 start server.js`
- [ ] Configuração salva com `pm2 save`
- [ ] Auto-restart configurado com `pm2 startup`

**Systemd (Linux):**
- [ ] Arquivo de serviço criado em `/etc/systemd/system/`
- [ ] Daemon recarregado: `systemctl daemon-reload`
- [ ] Serviço habilitado: `systemctl enable voucher-wifi`
- [ ] Serviço iniciado: `systemctl start voucher-wifi`

**Manual:**
- [ ] Script `start.bat` ou `start.sh` testado
- [ ] Terminal/console permanece aberto

### Acesso Externo (Se Necessário)

- [ ] Nginx/Apache configurado como proxy reverso
- [ ] SSL/TLS ativado (Let's Encrypt)
- [ ] Firewall configurado para aceitar porta 80/443
- [ ] DNS apontando para o servidor

## 🔒 Segurança

- [ ] `.env` NÃO foi versionado (está em `.gitignore`)
- [ ] Arquivo `.env` com permissões restritas (`chmod 600 .env`)
- [ ] Senhas de usuários foram alteradas (não usar demo)
- [ ] Banco de dados em disco seguro com backup
- [ ] Não expor `node_modules` ou ferramentas de desenvolvimento

## 📊 Monitoramento

- [ ] Logs sendo monitorados (PM2: `pm2 logs`)
- [ ] Alertas configurados para falhas
- [ ] Espaço em disco verificado regularmente
- [ ] Backup do banco de dados (`db/visitors.db`) feito

## 🔄 Maintenance

- [ ] Plano de backup definido
- [ ] Rotina de limpeza de vouchers antigos (configurar em `.env`)
- [ ] Atualização de dependências planejada
- [ ] Plano de rollback em caso de problemas

---

## 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| Porta 3000 em uso | Mudar `PORT` em `.env` |
| Erro de conexão Unifi | Verificar `UNIFI_HOST`, `UNIFI_PORT`, credenciais |
| Banco de dados vazio | Deletar `db/visitors.db` e reiniciar |
| PM2 não executa | Usar `chmod +x server.js` e verificar caminho Node.js |
| 404 em endpoints | Verificar se `routes/api.js` está correto |

---

✅ **Checklist Completo!** Sistema pronto para produção.
