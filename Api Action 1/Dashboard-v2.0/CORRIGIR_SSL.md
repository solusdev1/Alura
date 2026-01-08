# 🔧 Corrigir Erro SSL MongoDB Atlas

## ❌ Erro Atual:
```
SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```

## ✅ Solução: Permitir Conexões do Vercel

### 1️⃣ Acesse MongoDB Atlas

https://cloud.mongodb.com

### 2️⃣ Configure Network Access

1. **Database Access** → Verifique se usuário existe
2. **Network Access** → **IP Access List**
3. Clique em **"ADD IP ADDRESS"**
4. Escolha: **"ALLOW ACCESS FROM ANYWHERE"**
   - IP: `0.0.0.0/0`
   - Comment: "Vercel Deploy"
5. Clique **"Confirm"**

### 3️⃣ Atualizar Connection String no Vercel

A connection string deve incluir `retryWrites=true&w=majority`:

```
mongodb+srv://gestordavidoliveira_db_user:sh9biC5zzJFfhqh1@cluster0.88shjh6.mongodb.net/?retryWrites=true&w=majority
```

### 4️⃣ Verificar Senha

Se a senha tiver caracteres especiais, codifique-os:
- `@` = `%40`
- `#` = `%23`
- `$` = `%24`
- etc.

Sua senha atual: `sh9biC5zzJFfhqh1` (parece OK)

### 5️⃣ Testar Localmente

```powershell
cd "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0"
node -e "import('mongodb').then(m => m.MongoClient.connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(e => console.error(e)))"
```

---

## 🎯 Checklist Rápido

- [ ] MongoDB Atlas → Network Access → Allow 0.0.0.0/0
- [ ] Vercel → Environment Variables → MONGODB_URI correto
- [ ] Vercel → Redeploy após configurar
- [ ] Testar API novamente

---

## 🆘 Se ainda não funcionar

### Opção Alternativa: Use connection string diferente

No MongoDB Atlas:
1. Database → Connect
2. Connect your application
3. Copie a NOVA connection string
4. Atualize no Vercel
5. Redeploy

---

**Faça isso AGORA no MongoDB Atlas:**

1. Vá em: https://cloud.mongodb.com/v2/YOUR_PROJECT/security/network/accessList
2. Adicione: `0.0.0.0/0`
3. Confirme
4. Aguarde 1-2 minutos para propagar
5. Teste a API novamente
