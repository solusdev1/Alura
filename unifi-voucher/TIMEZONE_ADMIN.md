# 🌍 Timezone Brasil + Gerador Automático Admin

## ✨ Novas Funcionalidades

### 1. **Timezone Brasil (America/Sao_Paulo)**
- Todas as datas agora exibem no horário de Brasília
- Conversão automática de UTC para Brasil
- Formato: `20/02/2026 13:22:02`
- Aplicado em:
  - Response da criação de voucher
  - Listagem de vouchers
  - Dashboard exibição
  - Exportação (CSV)

### 2. **Gerador Automático (Admin)**
- Admin clica em **➕ Gerar Voucher**
- Sistema gera voucher **SEM pedir nome/CPF**
- Valores automáticos:
  - Nome: `Voucher Gerado`
  - CPF: `00000000000` (campo vazio)
  - Código: Gerado automaticamente
- Voucher salvo no banco e pronto para uso

### 3. **Validação Diferenciada por Role**
- **Recepção**: Obrigatório preencher nome e CPF
- **Admin**: Gera com valores padrão (sem validação de CPF)

---

## 🔧 Arquivos Modificados

### Backend
- **`utils/timezone.js`** (NOVO)
  - `formatarDataBrasil(date)` - Formata data para Brasil
  - `ajustarToBrasil(date)` - Converte para data Brasil
  - `agora()` - Retorna hora atual em Brasil

- **`routes/api.js`** (MODIFICADO)
  - Endpoint POST `/api/voucher` agora aceita nome e CPF vazios
  - Validação condicional por role (recepcao vs admin)
  - Retorna datas formatadas em Brasil
  - GET `/vouchers` formata datas ao retornar

### Frontend
- **`public/dashboard.html`** (MODIFICADO)
  - Admin vê botão **➕ Gerar Voucher** (simples, sem formulário)
  - Função `gerarAutomatico()` envia nome e CPF vazios
  - Tabela exibe datas em formato Brasil
  - Exportação usa datas Brasil

---

## 📊 Comparação Antes/Depois

### Antes
```
20/02/2026T13:22:02.123Z (ISO)
111.444.777-35 (CPF sempre obrigatório)
Admin sem resources para gerar rápido
```

### Depois
```
20/02/2026 13:22:02 (Brasil)
CPF vazio para Admin (00000000000)
Admin pode gerar com 1 clique
```

---

## 🧪 Testes Realizados

### Teste 1: Gerador Automático
```
✓ Admin clica "Gerar Voucher"
✓ Sistema gera com nome="Voucher Gerado", cpf="00000000000"
✓ Código retorna: 9069393882
✓ Data: 20/02/2026 13:22:02 (Brasil)
✓ Status: 200 OK
```

### Teste 2: Timezone
```
✓ Quando gera: 20/02/2026 13:22:02
✓ Quando lista: 20/02/2026 13:22:02
✓ Formato consistente
✓ Conversão UTC→Brasil funciona
```

### Teste 3: Validação por Role
```
✓ Recepção: Obriga nome+CPF validado
✓ Admin: Aceita vazio → usa padrão
✓ Admin: Pode preencher dados normais também
✓ Validação de CPF sempre acontece (recepção)
```

---

## 🎯 Como Usar (Admin)

1. Faça login como **admin**
2. Clique em **➕ Gerar Voucher**
3. Espere 1-2 segundos
4. Voucher aparece na tabela automaticamente
5. Código está pronto para usar

---

## 🔐 Segurança

- ✅ Validação CPF mantida para Recepção
- ✅ Timezone não expõe dados sensíveis
- ✅ Conversão de timezone no servidor (segura)
- ✅ CPF "00000000000" identificável como automático

---

## 📝 Estrutura de Dados

### Voucher Gerado por Admin
```json
{
  "success": true,
  "visitor": {
    "id": 4,
    "nome": "Voucher Gerado",
    "cpf": "00000000000",
    "voucher_code": "9069393882",
    "criado_em": "20/02/2026 13:22:02",
    "expira_em": "20/02/2026 21:22:02",
    "expire_minutes": 480
  }
}
```

---

## 🐛 Notas

- Horário do servidor: UTC±0 (ajustado para Brasil via `Intl.DateTimeFormat`)
- CPF "00000000000" não passa em validação (intencional para admin)
- Admin pode gerar quantos vouchers quiser, tão rápido quanto clicar
- Timezone funciona em Windows, macOS, Linux

---

## 📚 Referência

- Função timezone: `utils/timezone.js`
- Rotação API: `routes/api.js`
- Interface admin: `public/dashboard.html`

✅ **Pronto para produção!** 🚀
