# Script para iniciar MongoDB instalado localmente no Windows
# Certifique-se de que o MongoDB está instalado em C:\Program Files\MongoDB\Server\

Write-Host " Iniciando MongoDB local..." -ForegroundColor Green
Write-Host ""

# Verificar se MongoDB está instalado
$mongoPath = "C:\Program Files\MongoDB\Server"

if (Test-Path $mongoPath) {
    Write-Host "[OK] MongoDB encontrado em $mongoPath" -ForegroundColor Green
    
    # Tentar encontrar a versão instalada
    $versions = Get-ChildItem $mongoPath -Directory | Sort-Object Name -Descending
    
    if ($versions.Count -gt 0) {
        $latestVersion = $versions[0].FullName
        $mongodPath = Join-Path $latestVersion "bin\mongod.exe"
        
        if (Test-Path $mongodPath) {
            Write-Host " Versão encontrada: $($versions[0].Name)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Para iniciar o MongoDB manualmente:" -ForegroundColor Yellow
            Write-Host "1. Abra um PowerShell como Administrador" -ForegroundColor White
            Write-Host "2. Execute: net start MongoDB" -ForegroundColor White
            Write-Host ""
            Write-Host "OU se não estiver como serviço:" -ForegroundColor Yellow
            Write-Host "& '$mongodPath' --dbpath 'C:\data\db'" -ForegroundColor White
            Write-Host ""
            
            # Verificar se está rodando
            $mongoProcess = Get-Process -Name mongod -ErrorAction SilentlyContinue
            if ($mongoProcess) {
                Write-Host "[OK] MongoDB já está rodando!" -ForegroundColor Green
                Write-Host " Conecte em: mongodb://127.0.0.1:27017" -ForegroundColor Cyan
            } else {
                Write-Host "[AVISO]  MongoDB não está rodando" -ForegroundColor Yellow
                Write-Host "Execute: net start MongoDB" -ForegroundColor White
            }
        }
    }
} else {
    Write-Host "[ERRO] MongoDB não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale o MongoDB Community Server:" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Durante a instalação, marque:" -ForegroundColor White
    Write-Host "  - Install MongoDB as a Service" -ForegroundColor Green
    Write-Host "  - Run service as Network Service user" -ForegroundColor Green
}

Write-Host ""
Write-Host "--------------------------------------------" -ForegroundColor DarkGray
Write-Host "Após iniciar o MongoDB, execute:" -ForegroundColor Cyan
Write-Host "  npm run server" -ForegroundColor White
Write-Host "--------------------------------------------" -ForegroundColor DarkGray
