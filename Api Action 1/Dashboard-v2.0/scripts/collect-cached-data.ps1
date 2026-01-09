# Script para coletar dados em cache dos dispositivos
# Execute este script via Action1 quando o servidor voltar online
# Tenta AMBOS os servidores: Local (172.16.0.176) e Cloud (Vercel)

param(
    [string]$LocalApiUrl = "http://172.16.0.176:3002/api/save-display-name",
    [string]$CloudApiUrl = "https://inventario-two-gamma.vercel.app/api/save-remote",
    [int]$TimeoutSeconds = 15
)

$cacheFolder = Join-Path $env:TEMP "Action1Cache"
$cacheFile = Join-Path $cacheFolder "$env:COMPUTERNAME.json"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  COLETOR DE DADOS EM CACHE - Action1" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

if (-not (Test-Path $cacheFile)) {
    Write-Host "Nenhum dado em cache encontrado neste dispositivo." -ForegroundColor Yellow
    
    $result = @{
        success = $true
        deviceName = $env:COMPUTERNAME
        hasPendingData = $false
        message = "Sem dados pendentes"
    } | ConvertTo-Json
    
    Write-Output $result
    exit 0
}

try {
    Write-Host "Cache encontrado: $cacheFile" -ForegroundColor Green
    
    $cached = Get-Content $cacheFile | ConvertFrom-Json
    
    Write-Host "`nDados em cache:" -ForegroundColor Cyan
    Write-Host "   Dispositivo: $($cached.data.deviceName)" -ForegroundColor White
    Write-Host "   Display Name: $($cached.data.displayName)" -ForegroundColor White
    Write-Host "   Cidade: $($cached.data.city)" -ForegroundColor White
    Write-Host "   Salvo em: $($cached.timestamp)" -ForegroundColor White
    
    Write-Host "`nEnviando para servidor..." -ForegroundColor Cyan
    
    # Tentar servidor LOCAL primeiro
    Write-Host "   Tentativa 1: Servidor LOCAL" -ForegroundColor Gray
    Write-Host "   URL: $LocalApiUrl" -ForegroundColor Gray
    Write-Host "   Timeout: $TimeoutSeconds segundos" -ForegroundColor Gray
    
    $json = $cached.data | ConvertTo-Json -Depth 3
    $success = $false
    $lastError = $null
    
    try {
        $response = Invoke-RestMethod -Uri $LocalApiUrl -Method Post -Body $json -ContentType "application/json" -TimeoutSec $TimeoutSeconds
        
        if ($response.success) {
            Write-Host "   ✅ SUCESSO no servidor LOCAL!" -ForegroundColor Green
            $success = $true
        }
    } catch {
        Write-Host "   ❌ Servidor local falhou: $($_.Exception.Message)" -ForegroundColor Yellow
        $lastError = $_.Exception.Message
        
        # Tentar servidor CLOUD
        Write-Host "`n   Tentativa 2: Servidor CLOUD (Vercel)" -ForegroundColor Gray
        Write-Host "   URL: $CloudApiUrl" -ForegroundColor Gray
        
        try {
            $response = Invoke-RestMethod -Uri $CloudApiUrl -Method Post -Body $json -ContentType "application/json" -TimeoutSec $TimeoutSeconds
            
            if ($response.success) {
                Write-Host "   ✅ SUCESSO no servidor CLOUD!" -ForegroundColor Green
                $success = $true
            }
        } catch {
            Write-Host "   ❌ Servidor cloud também falhou: $($_.Exception.Message)" -ForegroundColor Red
            $lastError = "Local: timeout | Cloud: $($_.Exception.Message)"
        }
    }
    
    if ($success) {
        Write-Host "SUCESSO! Dados do cache enviados!" -ForegroundColor Green
        
        # Remover arquivo de cache
        Remove-Item $cacheFile -Force
        Write-Host "Cache limpo." -ForegroundColor Green
        
        $result = @{
            success = $true
            deviceName = $cached.data.deviceName
            displayName = $cached.data.displayName
            city = $cached.data.city
            hasPendingData = $true
            sent = $true
            cacheTimestamp = $cached.timestamp
        } | ConvertTo-Json -Depth 3
        
        Write-Output $result
        
    } else {
        Write-Host "Erro ao enviar para AMBOS os servidores" -ForegroundColor Red
        
        $result = @{
            success = $false
            deviceName = $cached.data.deviceName
            hasPendingData = $true
            sent = $false
            error = $lastError
        } | ConvertTo-Json
        
        Write-Output $result
    }
    
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    
    $result = @{
        success = $false
        deviceName = $env:COMPUTERNAME
        hasPendingData = $true
        sent = $false
        error = $_.Exception.Message
    } | ConvertTo-Json
    
    Write-Output $result
}
