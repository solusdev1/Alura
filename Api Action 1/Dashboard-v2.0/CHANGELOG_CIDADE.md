# 🌍 NOVA FUNCIONALIDADE: Detecção Automática de Cidade

**Data:** 9 de Janeiro de 2026  
**Versão:** 2.1.0

---

## ✨ O QUE FOI ADICIONADO

### **Script PowerShell Atualizado**
📄 **Arquivo:** `scripts/set-ad-display-name.ps1`

Agora o script captura **automaticamente**:
- ✅ **Display Name do AD** (já existia)
- ✅ **Cidade** baseada no IP público (NOVO)
- ✅ **IP Público** do dispositivo (NOVO)

### **Backend API Atualizado**
📄 **Arquivo:** `server/routes/save-display-name.js`

A API agora salva no MongoDB:
- ✅ `adDisplayName` - Nome do usuário do AD
- ✅ `city` - Cidade detectada automaticamente
- ✅ `lastPublicIP` - Último IP público registrado
- ✅ `updatedAt` - Data/hora da atualização

---

## 🔧 COMO FUNCIONA

### **1. Detecção de IP Público**
```powershell
function Get-PublicIP {
    Invoke-RestMethod "https://api.ipify.org?format=json"
}
```
Usa a API **ipify.org** (gratuita e confiável) para obter o IP público.

### **2. Geolocalização por IP**
```powershell
function Get-CityFromIP {
    Invoke-RestMethod "https://ipinfo.io/$ip/json"
}
```
Usa a API **ipinfo.io** (1000 requisições/dia grátis) para detectar a cidade.

### **3. Exemplo de Execução**

```
Iniciando captura de informacoes do dispositivo...
Dispositivo: SJPCRONOT001.CARRAROLOGISTICA.COM.BR
Usuario atual: carrarolog\suporteti

Buscando Display Name no AD via ADSI...
DisplayName encontrado: David - Suporte Ti CARRARO LOGISTICA

Detectando localizacao...
   IP Publico: 200.233.177.29
   Cidade detectada: Curitiba

Informacoes coletadas!
   Dispositivo: SJPCRONOT001.CARRAROLOGISTICA.COM.BR
   Display Name: David - Suporte Ti CARRARO LOGISTICA
   Username: suporteti
   Cidade: Curitiba

Salvando no servidor local...
SUCESSO! Informacoes salvas no servidor!
```

---

## 📋 RETORNO JSON

### **Formato do Retorno**
```json
{
    "success": true,
    "deviceName": "SJPCRONOT001.CARRAROLOGISTICA.COM.BR",
    "displayName": "David - Suporte Ti CARRARO LOGISTICA",
    "city": "Curitiba",
    "saved": true,
    "customAttributes": [
        {
            "name": "AD Display Name",
            "value": "David - Suporte Ti CARRARO LOGISTICA"
        },
        {
            "name": "City",
            "value": "Curitiba"
        }
    ]
}
```

### **Custom Attributes para Action1**
O retorno inclui `customAttributes` no formato Action1, permitindo usar o script como **Custom Field** no Action1.

---

## 🎯 CASOS DE USO

### **1. Inventário Geográfico**
- Saber em qual cidade cada dispositivo está localizado
- Filtrar dispositivos por localização
- Relatórios de distribuição geográfica

### **2. Suporte Remoto**
- Identificar rapidamente a localização do usuário
- Direcionar tickets para equipe local
- Análise de latência por região

### **3. Compliance**
- Validar se dispositivos estão nas localizações esperadas
- Detectar acessos remotos não autorizados
- Auditoria de localização de ativos

---

## 🔒 SEGURANÇA E PRIVACIDADE

### **APIs Utilizadas**
| API | Limite Gratuito | Dados Coletados |
|-----|----------------|-----------------|
| **ipify.org** | Ilimitado | Apenas IP público |
| **ipinfo.io** | 1000 req/dia | IP, Cidade, País, Coordenadas |

### **Fallback**
- Se o IP público não for detectado → Cidade = "Desconhecida"
- Se a API ipinfo.io falhar → Cidade = "Desconhecida"
- Script **sempre retorna sucesso**, mesmo sem internet

### **Dados Armazenados no MongoDB**
```javascript
{
    "nome": "SJPCRONOT001",
    "adDisplayName": "David - Suporte Ti CARRARO LOGISTICA",
    "city": "Curitiba",
    "lastPublicIP": "200.233.177.29",
    "updatedAt": "2026-01-09T13:45:00.000Z"
}
```

---

## 📊 CAMPOS NO MONGODB

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `adDisplayName` | String | Nome completo do usuário (AD) |
| `city` | String | Cidade detectada automaticamente |
| `lastPublicIP` | String | Último IP público registrado |
| `updatedAt` | Date | Data/hora da última atualização |

---

## 🧪 COMO TESTAR

### **1. Executar Script Manualmente**
```powershell
cd "C:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0\scripts"
.\set-ad-display-name.ps1
```

### **2. Verificar no MongoDB**
Acesse o dashboard e veja a coluna "Cidade" preenchida automaticamente.

### **3. Verificar Logs do Backend**
```
🔄 ========================================
   SALVANDO INFORMAÇÕES NO MONGODB
   ========================================

📥 Dados recebidos:
   • Device: SJPCRONOT001.CARRAROLOGISTICA.COM.BR
   • Display Name: David - Suporte Ti CARRARO LOGISTICA
   • Username: suporteti
   • Cidade: Curitiba
   • IP Público: 200.233.177.29

✅ Dispositivo encontrado: SJPCRONOT001
✅ Informações salvas com sucesso no MongoDB!
   • SJPCRONOT001 → Display Name: David - Suporte Ti CARRARO LOGISTICA
   • Cidade: Curitiba
```

---

## 🚀 DEPLOY

### **Local**
- ✅ Script atualizado: `set-ad-display-name.ps1`
- ✅ Backend atualizado: `save-display-name.js`
- ✅ IP configurado: `172.16.2.176:3002`

### **GitHub**
- ✅ Commit: "Feature: Adicionada detecção automática de cidade"
- ✅ Branch: `main`

### **Vercel**
- ⏳ Pendente (executar `vercel --prod` quando backend local estiver online)

---

## ⚙️ CONFIGURAÇÃO NO ACTION1

### **Criar Custom Field "City"**

1. **Action1 Console** → Settings → Custom Fields
2. **Add Custom Field**
   - Name: `City`
   - Type: `Text`
   - Script: Fazer upload de `set-ad-display-name.ps1`
3. **Run on Schedule** (Diário)

### **Executar via GPO**
Distribuir o script via Group Policy para rodar no logon do usuário.

---

## 📝 LIMITAÇÕES

### **API ipinfo.io**
- ❌ Limite de 1000 requisições/dia (versão grátis)
- ⚠️ Pode retornar cidade errada se usar VPN
- ⚠️ Não funciona em redes totalmente privadas

### **Alternativas**
Se atingir o limite, considerar:
- **IP-API.com** (45 req/min grátis)
- **BigDataCloud** (10k req/mês grátis)
- **GeoPlugin** (Ilimitado grátis, menos preciso)

---

## 🔄 PRÓXIMOS PASSOS

### **Melhorias Futuras**
- [ ] Adicionar cache de IP → Cidade (evitar chamadas repetidas)
- [ ] Salvar histórico de IPs públicos
- [ ] Detectar mudanças de localização
- [ ] Alertas quando dispositivo muda de cidade
- [ ] Dashboard com mapa geográfico dos dispositivos

---

## 📞 SUPORTE

**Desenvolvedor:** David - Suporte TI  
**Data:** Janeiro 2026  
**Versão:** 2.1.0  

**Status:** ✅ Funcionando e testado  
**Próximo Deploy:** Vercel (aguardando backend online)
