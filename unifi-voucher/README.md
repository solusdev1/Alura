# 📶 Unifi Voucher System

Sistema web para gerar vouchers de acesso Wi-Fi visitantes via Unifi Controller.

## 🚀 Início Rápido

### Windows
```bash
start.bat
```

### Linux / macOS
```bash
chmod +x start.sh
./start.sh
```

## ⚙️ Primeira Execução

1. **Copie as configurações:**
   ```bash
   cp .env.example .env
   ```

2. **Edite o arquivo `.env`** com seus dados:
   - `UNIFI_HOST`: IP do Unifi Controller
   - `UNIFI_PORT`: Porta do Unifi (padrão: 8443)
   - `UNIFI_USERNAME`: Usuário do Unifi
   - `UNIFI_PASSWORD`: Senha do Unifi
   - Outras configurações de voucher

3. **Execute o sistema:**
   - Windows: `start.bat`
   - Linux/Mac: `./start.sh`

4. **Acesse:** `http://localhost:3000`

## 👤 Usuários

**Recepcao** (gera vouchers)
- Formulário para criar vouchers com nome e CPF

**Admin** (visualiza histórico)
- Listagem de todos os vouchers gerados

As senhas são definidas durante a primeira inicialização. Altere-as no banco de dados se necessário.

## 📊 Estrutura

```
├── server.js              Servidor Express
├── .env                   Configurações (criar a partir de .env.example)
├── db/database.js         Banco de dados SQLite
├── routes/
│   ├── api.js            Endpoints da API
│   ├── auth.js           Autenticação JWT
│   └── unifi.js          Integração Unifi Controller
└── public/
    ├── login.html        Tela de login
    ├── dashboard.html    Painel de controle
    ├── historico.html    Histórico de vouchers
    └── imprimir.html     Página de impressão
```

## 📝 Notas

- Banco de dados é automaticamente criado na primeira execução
- Porta padrão: 3000 (configure em `.env` se necessário)
- Tokens JWT com validade de 8 horas
