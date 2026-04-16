# 🔍 Validação de CPF

Sistema implementa validação robusta de CPF tanto no frontend quanto no backend.

## 📋 O Que é Validado

### Formato
- Aceita CPF com ou sem formatação: `123.456.789-10` ou `12345678910`
- Deve conter exatamente **11 dígitos**

### Rejeita
- ❌ CPF com menos de 11 dígitos
- ❌ CPF com mais de 11 dígitos
- ❌ CPF com todos os dígitos iguais (ex: 111.111.111-11)
- ❌ CPF com dígitos verificadores inválidos

### Valida
- ✅ Primeiro dígito verificador
- ✅ Segundo dígito verificador
- ✅ Algoritmo oficial da Receita Federal

## 🧮 Como Funciona

A validação usa o algoritmo oficial da Receita Federal Brasileira:

### Primeiro Dígito Verificador
1. Multiplica cada um dos 9 primeiros dígitos por 10, 9, 8, 7, 6, 5, 4, 3, 2 (em ordem)
2. Soma todos os resultados
3. Calcula `resto = soma % 11`
4. Se resto < 2, primeiro dígito = 0; senão = 11 - resto

### Segundo Dígito Verificador
1. Multiplica cada um dos 10 primeiros dígitos por 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 (em ordem)
2. Soma todos os resultados
3. Calcula `resto = soma % 11`
4. Se resto < 2, segundo dígito = 0; senão = 11 - resto

## 📍 Pontos de Validação

### Frontend (browser)
- **Arquivo:** `public/dashboard.html`
- **Função:** `validarCPF(cpf)`
- **Quando:** Ao clicar no botão "Gerar Voucher"
- **Ação:** Mostra mensagem de erro antes de enviar ao servidor

### Backend (Node.js)
- **Arquivo:** `routes/api.js`
- **Função:** `validarCPF(cpf)` importada de `utils/cpf.js`
- **Quando:** Ao receber POST `/api/voucher`
- **Ação:** Valida novamente e rejeita se inválido

## 🛡️ Por Que Validar Duas Vezes?

- **Frontend:** Experiência do usuário - feedback instantâneo
- **Backend:** Segurança - previne bypass da validação do cliente (tampering)

## ✅ Exemplos de CPF Válido

```
11144477735
111.444.777-35

Cálculo:
1×10 + 1×9 + 1×8 + 4×7 + 4×6 + 4×5 + 7×4 + 7×3 + 3×2 = 155
155 % 11 = 1 (< 2) → 1º dígito = 0... ❌ (exemplo inválido)
```

Você pode gerar CPF válido aqui (para teste):
https://www.geradorcpf.com/

## 🚀 Teste

1. Acesse o dashboard
2. Tente inserir um CPF inválido
3. Verá mensagem: "CPF inválido. Verifique os dígitos verificadores."
4. Insira um CPF válido
5. Funcionar normalmente

## 📚 Referência

- Algoritmo: [Receita Federal - CPF](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/faq-cpf)
- Código fonte: 
  - Backend: `utils/cpf.js`
  - Frontend: `public/dashboard.html`
  - Validação: `routes/api.js`
