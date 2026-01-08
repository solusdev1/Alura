# 🔒 GUIA DE SEGURANÇA - Credenciais

## ⚠️ AÇÃO URGENTE NECESSÁRIA

As credenciais foram removidas do código, mas elas **JÁ FORAM COMMITADAS** no GitHub!

### 🚨 Passos Imediatos:

#### 1. **TROCAR AS SENHAS IMEDIATAMENTE**

##### MongoDB Atlas:
1. Acesse: https://cloud.mongodb.com/
2. Vá em **Database Access**
3. Encontre o usuário `gestordavidoliveira_db_user`
4. Clique em **Edit** → **Edit Password**
5. Gere uma nova senha forte
6. Atualize a senha no arquivo `.env` local

##### API Action1:
1. Acesse: https://app.action1.com/settings/api
2. **Revogue** as credenciais antigas
3. Gere **novas** credenciais (client_id e client_secret)
4. Atualize no arquivo `.env` local

---

#### 2. **REMOVER DO HISTÓRICO DO GIT**

As credenciais antigas ainda estão no histórico do Git. Use o BFG Repo-Cleaner ou git filter-repo:

```powershell
# Opção 1: BFG Repo-Cleaner (mais simples)
# Baixe em: https://rtyley.github.io/bfg-repo-cleaner/

# Substitua as credenciais antigas
bfg --replace-text passwords.txt

# Force push (CUIDADO!)
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

**Arquivo `passwords.txt`:**
```
gestordavidoliveira_db_user
sh9biC5zzJFfhqh1
api-key-f1d39dc7-8871-4773-abf4-d42599f1544ea590810c-951b-40b3-a396-3d4ec72e2848@action1.com
d32e3b0e6749f83cd3dc3c43e650eb56
```

---

#### 3. **CONFIGURAR VARIÁVEIS DE AMBIENTE**

##### Desenvolvimento Local:
1. Copie o arquivo `.env.example` para `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Edite o `.env` com as **NOVAS** credenciais:
   ```env
   MONGODB_URI=mongodb+srv://SEU_NOVO_USUARIO:SUA_NOVA_SENHA@cluster0.xxxxx.mongodb.net/...
   ACTION1_CLIENT_ID=sua-nova-client-id
   ACTION1_CLIENT_SECRET=sua-nova-client-secret
   ```

##### Vercel (Produção):
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - `MONGODB_URI` = [nova connection string]
   - `MONGODB_DATABASE` = action1_inventory
   - `ACTION1_CLIENT_ID` = [nova client id]
   - `ACTION1_CLIENT_SECRET` = [nova client secret]
5. **Redeploy** o projeto

---

## ✅ Boas Práticas Implementadas

- ✅ `.gitignore` configurado para ignorar `.env`
- ✅ Arquivo `.env.example` criado com exemplos
- ✅ Credenciais removidas dos arquivos de documentação
- ✅ Código atualizado para usar variáveis de ambiente
- ✅ `server/database/configs.js` protegido no `.gitignore`

---

## 📋 Checklist de Verificação

- [ ] Trocar senha do MongoDB Atlas
- [ ] Revogar e gerar novas credenciais da API Action1
- [ ] Limpar histórico do Git (BFG ou git filter-repo)
- [ ] Force push do repositório limpo
- [ ] Criar arquivo `.env` local com novas credenciais
- [ ] Atualizar variáveis de ambiente na Vercel
- [ ] Testar aplicação local
- [ ] Redeploy na Vercel
- [ ] Verificar que nenhuma credencial aparece no GitHub

---

## 🔍 Como Verificar se Está Seguro

```powershell
# Verificar se .env está no .gitignore
Get-Content .gitignore | Select-String ".env"

# Verificar se .env NÃO está sendo rastreado
git status --ignored

# Buscar por possíveis credenciais no código
git grep -i "password\|secret\|mongodb+srv://.*:.*@"
```

---

## 🆘 Suporte

Se tiver dúvidas, consulte:
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
