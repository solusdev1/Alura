# Script para configurar o Dashboard Backend no Windows Server 2022
# IP do Servidor: 172.16.0.7
# Executar como Administrador

param(
    [string]$InstallPath = "C:\inetpub\dashboard-backend",
    [switch]$InstallPM2,
    [switch]$ConfigureFirewall,
    [switch]$CreateService
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALAÇÃO DASHBOARD BACKEND" -ForegroundColor Cyan
Write-Host "Windows Server 2022 - IP: 172.16.0.7" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERRO] ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    exit 1
}

# 1. Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   [OK] Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   [ERRO] Node.js NÃO encontrado!" -ForegroundColor Red
    Write-Host "    Baixe em: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

# 2. Criar diretório de instalação
Write-Host "`n2. Criando diretório de instalação..." -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "   [OK] Diretório criado: $InstallPath" -ForegroundColor Green
} else {
    Write-Host "   i  Diretório já existe: $InstallPath" -ForegroundColor Cyan
}

# 3. Verificar arquivos copiados
Write-Host "`n3. Verificando arquivos do projeto..." -ForegroundColor Yellow
$requiredFiles = @("package.json", "server\index.js")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $InstallPath $file
    if (-not (Test-Path $fullPath)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "   [AVISO]  Arquivos faltando:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "      - $file" -ForegroundColor Red
    }
    Write-Host "`n    AÇÃO NECESSÁRIA:" -ForegroundColor Cyan
    Write-Host "   Copie os arquivos do Dashboard-v2.0 para: $InstallPath" -ForegroundColor White
    Write-Host "   Após copiar, execute este script novamente.`n" -ForegroundColor White
    exit 1
} else {
    Write-Host "   [OK] Arquivos do projeto encontrados" -ForegroundColor Green
}

# 4. Verificar arquivo .env
Write-Host "`n4. Verificando configuração (.env)..." -ForegroundColor Yellow
$envPath = Join-Path $InstallPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "   [AVISO]  Arquivo .env NÃO encontrado!" -ForegroundColor Yellow
    
    # Verificar se existe .env.servidor
    $envServidorPath = Join-Path $InstallPath ".env.servidor"
    if (Test-Path $envServidorPath) {
        Write-Host "    Encontrado .env.servidor, copiando para .env..." -ForegroundColor Cyan
        Copy-Item $envServidorPath $envPath
        Write-Host "   [OK] Arquivo .env criado!" -ForegroundColor Green
        Write-Host "`n   [AVISO]  IMPORTANTE: Edite o arquivo .env e preencha:" -ForegroundColor Yellow
        Write-Host "      - MONGODB_URI" -ForegroundColor White
        Write-Host "      - ACTION1_CLIENT_ID" -ForegroundColor White
        Write-Host "      - ACTION1_CLIENT_SECRET`n" -ForegroundColor White
    } else {
        Write-Host "   [ERRO] Crie o arquivo .env em: $envPath" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   [OK] Arquivo .env encontrado" -ForegroundColor Green
}

# 5. Instalar dependências
Write-Host "`n5. Instalando dependências NPM..." -ForegroundColor Yellow
Push-Location $InstallPath
try {
    npm install --production 2>&1 | Out-Null
    Write-Host "   [OK] Dependências instaladas" -ForegroundColor Green
} catch {
    Write-Host "   [ERRO] Erro ao instalar dependências: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# 6. Configurar Firewall
if ($ConfigureFirewall) {
    Write-Host "`n6. Configurando Firewall do Windows..." -ForegroundColor Yellow
    
    # Porta 3002 (Backend)
    try {
        $existingRule = Get-NetFirewallRule -DisplayName "Dashboard Backend API" -ErrorAction SilentlyContinue
        if ($existingRule) {
            Remove-NetFirewallRule -DisplayName "Dashboard Backend API"
        }
        New-NetFirewallRule -DisplayName "Dashboard Backend API" -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow | Out-Null
        Write-Host "   [OK] Porta 3002 (Backend API) aberta" -ForegroundColor Green
    } catch {
        Write-Host "   [AVISO]  Erro ao configurar porta 3002: $_" -ForegroundColor Yellow
    }
    
    # Porta 27017 (MongoDB - opcional)
    Write-Host "   i  Para MongoDB local, abra a porta 27017 manualmente se necessário" -ForegroundColor Cyan
}

# 7. Instalar PM2
if ($InstallPM2) {
    Write-Host "`n7. Instalando PM2 (Gerenciador de Processos)..." -ForegroundColor Yellow
    try {
        npm install -g pm2 2>&1 | Out-Null
        npm install -g pm2-windows-service 2>&1 | Out-Null
        Write-Host "   [OK] PM2 instalado globalmente" -ForegroundColor Green
        
        # Configurar PM2 como serviço
        if ($CreateService) {
            Write-Host "    Configurando PM2 como serviço Windows..." -ForegroundColor Cyan
            pm2-service-install -n PM2
            Write-Host "   [OK] Serviço PM2 criado" -ForegroundColor Green
        }
    } catch {
        Write-Host "   [AVISO]  Erro ao instalar PM2: $_" -ForegroundColor Yellow
    }
}

# 8. Testar backend
Write-Host "`n8. Testando backend..." -ForegroundColor Yellow
Write-Host "   i  Iniciando servidor temporariamente..." -ForegroundColor Cyan

Push-Location $InstallPath
$job = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    node server/index.js
} -ArgumentList $InstallPath

Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/status" -Method GET -TimeoutSec 5
    Write-Host "   [OK] Backend funcionando!" -ForegroundColor Green
    Write-Host "      Versão: $($response.version)" -ForegroundColor White
    Write-Host "      Database: $($response.database)" -ForegroundColor White
} catch {
    Write-Host "   [AVISO]  Backend não respondeu (verifique .env e MongoDB)" -ForegroundColor Yellow
}

Stop-Job -Job $job
Remove-Job -Job $job
Pop-Location

# 9. Instruções finais
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[OK] INSTALAÇÃO CONCLUÍDA" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host " PRÓXIMOS PASSOS:`n" -ForegroundColor Yellow

if ($InstallPM2 -and $CreateService) {
    Write-Host "1. Iniciar o backend com PM2:" -ForegroundColor Cyan
    Write-Host "   cd $InstallPath" -ForegroundColor White
    Write-Host "   pm2 start server/index.js --name dashboard-backend" -ForegroundColor White
    Write-Host "   pm2 save`n" -ForegroundColor White
    
    Write-Host "2. Verificar status:" -ForegroundColor Cyan
    Write-Host "   pm2 status" -ForegroundColor White
    Write-Host "   pm2 logs dashboard-backend`n" -ForegroundColor White
} else {
    Write-Host "1. Instalar PM2 (recomendado):" -ForegroundColor Cyan
    Write-Host "   .\setup-servidor.ps1 -InstallPM2 -CreateService`n" -ForegroundColor White
}

Write-Host "3. Testar o backend:" -ForegroundColor Cyan
Write-Host "   Invoke-RestMethod -Uri 'http://172.16.0.7:3002/api/status'`n" -ForegroundColor White

Write-Host "4. Configurar sincronização automática (cron):" -ForegroundColor Cyan
Write-Host "   Edite server/index.js e descomente a linha do cron`n" -ForegroundColor White

Write-Host " Documentação completa:" -ForegroundColor Yellow
Write-Host "   $InstallPath\MIGRACAO_SERVIDOR.md`n" -ForegroundColor White

Write-Host "========================================`n" -ForegroundColor Cyan
