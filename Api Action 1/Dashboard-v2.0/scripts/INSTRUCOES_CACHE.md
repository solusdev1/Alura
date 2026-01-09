# Sistema de Cache - Instruções

## Problema Encontrado

Dispositivo **SJPCRONOT145** tem dados em cache mas não conseguiu enviar:
- **Cidade:** Londrina
- **Display Name:** operacao.londrina
- **Erro:** Timeout ao conectar com servidor `172.16.0.176:3002`

## Causas Possíveis

1. ✅ **Servidor backend não está rodando**
   - Verificar se o backend está ativo em `172.16.0.176:3002`
   - Comando: `Invoke-RestMethod http://172.16.0.176:3002/api/status`

2. ✅ **Firewall bloqueando porta 3002**
   - Verificar regras de firewall do Windows Server
   - Liberar porta TCP 3002 para rede interna

3. ✅ **Dispositivo em rede/filial diferente**
   - SJPCRONOT145 pode estar em Londrina (não em São José dos Pinhais)
   - Não consegue acessar IP interno 172.16.0.176

## Soluções Implementadas

### 1. Timeout Aumentado
- **Antes:** 10 segundos
- **Depois:** 30 segundos
- Script testa conectividade antes de enviar

### 2. Dados Preservados
- Cache permanece salvo em: `C:\WINDOWS\TEMP\Action1Cache\SJPCRONOT145.json`
- Próxima execução tenta enviar novamente
- Dados não são perdidos

### 3. Script Principal com Retry
O script `set-ad-display-name.ps1` já tem retry automático:
- Toda vez que executa, verifica se há cache pendente
- Tenta enviar antes de coletar novos dados

## Como Resolver

### Opção 1: Aguardar Dispositivo Voltar à Rede Principal
```powershell
# Quando SJPCRONOT145 estiver na rede de São José dos Pinhais
# Execute o script collect-cached-data.ps1 via Action1
```

### Opção 2: Salvar Dados Manualmente
```powershell
# No servidor 172.16.0.176, execute:
Invoke-RestMethod -Method Post -Uri "http://localhost:3002/api/save-display-name" `
  -Body (@{
    deviceName = "SJPCRONOT145.carrarologistica.com.br"
    hostname = "SJPCRONOT145"
    displayName = "operacao.londrina"
    city = "Londrina"
    publicIP = ""
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

### Opção 3: Servidor em Múltiplos Locais
Se houver filiais, considerar:
- Backend replicado em cada filial
- Ou servidor acessível via VPN/túnel
- Ou usar IP público com VPN

## Verificar Dados em Cache

Para ver todos os dispositivos com dados pendentes, execute via Action1:

```powershell
# Listar arquivos de cache
$cacheFolder = Join-Path $env:TEMP "Action1Cache"
if (Test-Path $cacheFolder) {
    Get-ChildItem $cacheFolder -Filter "*.json" | ForEach-Object {
        $data = Get-Content $_.FullName | ConvertFrom-Json
        [PSCustomObject]@{
            Dispositivo = $_.BaseName
            DisplayName = $data.data.displayName
            Cidade = $data.data.city
            DataCache = $data.timestamp
        }
    }
} else {
    Write-Host "Nenhum cache encontrado"
}
```

## Monitoramento

Execute periodicamente para coletar caches pendentes:
1. Via Action1 App (agendado semanalmente)
2. Ou manualmente quando servidor voltar online
3. Logs ficam visíveis no Action1 Console

## Resumo

| Item | Status |
|------|--------|
| Cache funcionando | ✅ OK |
| Dados preservados | ✅ OK (Londrina salvo) |
| Retry automático | ✅ OK |
| Timeout aumentado | ✅ OK (30s) |
| Servidor acessível | ❌ VERIFICAR |

**Próximo passo:** Garantir que `172.16.0.176:3002` esteja acessível de todas as redes/filiais.
