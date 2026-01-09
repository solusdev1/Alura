# Correção de Caracteres Especiais na Coluna Localização

## Problema Identificado
Caracteres especiais (acentos) em nomes de cidades brasileiras estavam causando bugs ao:
- Salvar dados via scripts PowerShell
- Transmitir dados via JSON
- Exibir dados no Dashboard

## Soluções Aplicadas

### 1. **Scripts PowerShell** ✅

Adicionado encoding UTF-8 em **todos** os scripts:

#### Arquivos Corrigidos:
- `scripts/collect-cached-data.ps1`
- `scripts/set-ad-display-name.ps1`
- `scripts/set-ad-display-name-remote.ps1`

#### Mudanças Aplicadas:

```powershell
# Configurar encoding UTF-8 para suportar caracteres especiais em nomes de cidades
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
```

**Funções Atualizadas:**

```powershell
# Send-ToServer - Envio com UTF-8
function Send-ToServer {
    param($data, $url, $timeout)
    try {
        $json = $data | ConvertTo-Json -Depth 3
        # Converter para bytes UTF-8 para preservar caracteres especiais
        $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $jsonBytes -ContentType "application/json; charset=utf-8" -TimeoutSec $timeout
        return @{ success = $true; response = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Save-ToCache - Salvar cache com UTF-8
function Save-ToCache {
    param($data)
    try {
        $cacheData = @{
            timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            data = $data
        }
        $cacheData | ConvertTo-Json -Depth 5 | Set-Content -Path $cacheFile -Force -Encoding UTF8
        Write-Host "   Dados salvos em cache local: $cacheFile" -ForegroundColor Yellow
        return $true
    } catch {
        Write-Host "   Erro ao salvar cache: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}
```

### 2. **Backend (APIs)** ✅

O Node.js já processa JSON com UTF-8 por padrão, mas os seguintes pontos foram verificados:

- ✅ `api/save-remote.js` - Processa UTF-8 corretamente
- ✅ `server/routes/save-display-name.js` - Processa UTF-8 corretamente
- ✅ `server/index.js` - Express configurado com `express.json()`

### 3. **Frontend** ✅

- ✅ `index.html` - Já possui `<meta charset="UTF-8" />`
- ✅ `src/components/App.jsx` - React renderiza UTF-8 nativamente

## Cidades Suportadas

Agora o sistema suporta corretamente cidades com acentos:

- ✅ São Paulo
- ✅ Brasília
- ✅ Goiânia
- ✅ Vitória
- ✅ Florianópolis
- ✅ Belém
- ✅ Macapá
- ✅ João Pessoa
- ✅ Cuiabá
- E todas as outras cidades brasileiras!

## Teste de Validação

Para testar se as correções estão funcionando:

### 1. Executar script de coleta:
```powershell
.\scripts\set-ad-display-name.ps1
```

### 2. Verificar no console se exibe corretamente:
```
Cidade detectada: São Paulo
```

### 3. Verificar no Dashboard:
- Abrir o Dashboard
- Verificar coluna "Localização"
- Cidades com acento devem aparecer corretamente

## Backup dos Arquivos Antigos

Caso necessário reverter, os arquivos antigos estão no histórico do Git.

## Status

🟢 **RESOLVIDO** - Todos os scripts e APIs agora suportam UTF-8 corretamente.

---

**Data da Correção:** 09/01/2026  
**Arquivos Modificados:** 3  
**Prioridade:** Alta  
**Impacto:** Todo o sistema de localização
