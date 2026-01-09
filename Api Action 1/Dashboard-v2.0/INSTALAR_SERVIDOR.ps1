# INSTALAÇÃO RÁPIDA - Dashboard Backend
# Windows Server 2022 - IP: 172.16.0.7
# Executar como Administrador no PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALAÇÃO DASHBOARD BACKEND - SERVIDOR" -ForegroundColor Cyan
Write-Host "IP: 172.16.0.7" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar permissões de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Execute este script como Administrador!" -ForegroundColor Red
    Write-Host "   Clique com botão direito > Executar como Administrador`n" -ForegroundColor Yellow
    pause
    exit 1
}

$InstallPath = "C:\inetpub\dashboard-backend"

# PASSO 1: Verificar Node.js
Write-Host "1️⃣ Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js: $nodeVersion`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js não instalado!" -ForegroundColor Red
    Write-Host "   📥 Baixe em: https://nodejs.org/`n" -ForegroundColor Cyan
    pause
    exit 1
}

# PASSO 2: Criar diretório
Write-Host "2️⃣ Criando diretório..." -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "   ✅ Criado: $InstallPath`n" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Diretório existe: $InstallPath`n" -ForegroundColor Cyan
}

Write-Host "📋 COPIAR ARQUIVOS MANUALMENTE:" -ForegroundColor Yellow
Write-Host "   Copie TODO o conteúdo de Dashboard-v2.0 para:" -ForegroundColor White
Write-Host "   $InstallPath`n" -ForegroundColor Cyan

Write-Host "   Arquivos essenciais:" -ForegroundColor White
Write-Host "   - server/" -ForegroundColor Gray
Write-Host "   - scripts/" -ForegroundColor Gray
Write-Host "   - package.json" -ForegroundColor Gray
Write-Host "   - .env.servidor (renomear para .env)`n" -ForegroundColor Gray

$continuar = Read-Host "Arquivos copiados? (S/N)"
if ($continuar -ne 'S' -and $continuar -ne 's') {
    Write-Host "   ⚠️  Copie os arquivos e execute novamente.`n" -ForegroundColor Yellow
    pause
    exit 0
}

# PASSO 3: Verificar arquivos
Write-Host "`n3️⃣ Verificando arquivos..." -ForegroundColor Yellow
if (-not (Test-Path (Join-Path $InstallPath "package.json"))) {
    Write-Host "   ❌ package.json não encontrado!`n" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "   ✅ Arquivos encontrados`n" -ForegroundColor Green

# PASSO 4: Configurar .env
Write-Host "4️⃣ Configurando .env..." -ForegroundColor Yellow
$envPath = Join-Path $InstallPath ".env"
$envServidorPath = Join-Path $InstallPath ".env.servidor"

if (-not (Test-Path $envPath)) {
    if (Test-Path $envServidorPath) {
        Copy-Item $envServidorPath $envPath
        Write-Host "   ✅ Arquivo .env criado`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Crie o arquivo .env manualmente`n" -ForegroundColor Yellow
    }
}

Write-Host "⚠️  EDITE O ARQUIVO .ENV AGORA:" -ForegroundColor Yellow
Write-Host "   Preencha as credenciais:" -ForegroundColor White
Write-Host "   - MONGODB_URI" -ForegroundColor Cyan
Write-Host "   - ACTION1_CLIENT_ID" -ForegroundColor Cyan
Write-Host "   - ACTION1_CLIENT_SECRET`n" -ForegroundColor Cyan

$editarEnv = Read-Host "Deseja editar .env agora? (S/N)"
if ($editarEnv -eq 'S' -or $editarEnv -eq 's') {
    notepad $envPath
    Write-Host "   ℹ️  Salve e feche o Notepad para continuar...`n" -ForegroundColor Cyan
    pause
}

# PASSO 5: Instalar dependências
Write-Host "`n5️⃣ Instalando dependências..." -ForegroundColor Yellow
Push-Location $InstallPath
npm install --production
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Dependências instaladas`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao instalar dependências`n" -ForegroundColor Red
    Pop-Location
    pause
    exit 1
}
Pop-Location

# PASSO 6: Configurar Firewall
Write-Host "6️⃣ Configurando Firewall..." -ForegroundColor Yellow
try {
    $rule = Get-NetFirewallRule -DisplayName "Dashboard Backend API" -ErrorAction SilentlyContinue
    if ($rule) {
        Remove-NetFirewallRule -DisplayName "Dashboard Backend API"
    }
    New-NetFirewallRule -DisplayName "Dashboard Backend API" -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow | Out-Null
    Write-Host "   ✅ Porta 3002 aberta no Firewall`n" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Erro ao configurar Firewall: $_`n" -ForegroundColor Yellow
}

# PASSO 7: Instalar PM2
Write-Host "7️⃣ Instalando PM2..." -ForegroundColor Yellow
try {
    npm install -g pm2
    npm install -g pm2-windows-service
    Write-Host "   ✅ PM2 instalado`n" -ForegroundColor Green
    
    Write-Host "   🔧 Configurando PM2 como serviço Windows..." -ForegroundColor Cyan
    pm2-service-install -n PM2
    Write-Host "   ✅ Serviço PM2 configurado`n" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Erro ao instalar PM2: $_`n" -ForegroundColor Yellow
}

# PASSO 8: Testar backend
Write-Host "8️⃣ Testando backend..." -ForegroundColor Yellow
Write-Host "   Iniciando servidor temporariamente...`n" -ForegroundColor Cyan

Push-Location $InstallPath
$job = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    node server/index.js
} -ArgumentList $InstallPath

Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/status" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Backend funcionando!" -ForegroundColor Green
    Write-Host "      Versão: $($response.version)" -ForegroundColor White
    Write-Host "      Database: $($response.database)`n" -ForegroundColor White
} catch {
    Write-Host "   ⚠️  Backend não respondeu" -ForegroundColor Yellow
    Write-Host "      Verifique .env e credenciais MongoDB`n" -ForegroundColor Cyan
}

Stop-Job -Job $job
Remove-Job -Job $job
Pop-Location

# INSTRUÇÕES FINAIS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ INSTALAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 INICIAR O BACKEND:`n" -ForegroundColor Yellow
Write-Host "cd $InstallPath" -ForegroundColor White
Write-Host "pm2 start server/index.js --name dashboard-backend" -ForegroundColor Cyan
Write-Host "pm2 save`n" -ForegroundColor Cyan

Write-Host "📊 VERIFICAR STATUS:`n" -ForegroundColor Yellow
Write-Host "pm2 status" -ForegroundColor Cyan
Write-Host "pm2 logs dashboard-backend`n" -ForegroundColor Cyan

Write-Host "🧪 TESTAR API:`n" -ForegroundColor Yellow
Write-Host "Invoke-RestMethod -Uri 'http://172.16.0.7:3002/api/status'`n" -ForegroundColor Cyan

Write-Host "🔄 REINICIAR:`n" -ForegroundColor Yellow
Write-Host "pm2 restart dashboard-backend`n" -ForegroundColor Cyan

Write-Host "🛑 PARAR:`n" -ForegroundColor Yellow
Write-Host "pm2 stop dashboard-backend`n" -ForegroundColor Cyan

Write-Host "========================================`n" -ForegroundColor Cyan
pause
