# Script de Configuracao MongoDB Atlas
# Facilita a criacao do arquivo .env

Write-Host "Configuracao MongoDB Atlas" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor DarkGray
Write-Host ""

$envPath = "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0\.env"
$envExamplePath = "c:\Users\suporteti\Documents\Programação\Api Action 1\Dashboard-v2.0\.env.example"

# Verificar se .env ja existe
if (Test-Path $envPath) {
    Write-Host "[AVISO] Arquivo .env ja existe!" -ForegroundColor Yellow
    Write-Host ""
    $overwrite = Read-Host "Deseja sobrescrever? (s/n)"
    
    if ($overwrite -ne 's' -and $overwrite -ne 'S') {
        Write-Host "[CANCELADO] Operacao cancelada" -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "Instrucoes:" -ForegroundColor Green
Write-Host "1. No VS Code, abra a extensao MongoDB" -ForegroundColor White
Write-Host "2. Clique com botao direito na sua conexao Atlas" -ForegroundColor White
Write-Host "3. Selecione 'Copy Connection String'" -ForegroundColor White
Write-Host ""
Write-Host "===============================================" -ForegroundColor DarkGray
Write-Host ""

# Solicitar connection string
$mongoUri = Read-Host "Cole aqui sua Connection String do MongoDB Atlas"

# Validar se parece com uma connection string valida
if (-not ($mongoUri -match "mongodb(\+srv)?://")) {
    Write-Host ""
    Write-Host "[ERRO] Connection string invalida!" -ForegroundColor Red
    Write-Host "   Deve comecar com mongodb:// ou mongodb+srv://" -ForegroundColor Yellow
    exit
}

# Solicitar nome do database
Write-Host ""
Write-Host "Nome do banco de dados:" -ForegroundColor Cyan
$dbName = Read-Host "Pressione Enter para usar 'action1_inventory' ou digite outro nome"

if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "action1_inventory"
}

# Criar conteúdo do .env
$envContent = @"
# MongoDB Atlas Configuration
# Gerado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Connection String do MongoDB Atlas
MONGODB_URI=$mongoUri

# Nome do banco de dados
MONGODB_DATABASE=$dbName

# ═══════════════════════════════════════════════════
# ⚠️  NÃO COMPARTILHE ESTE ARQUIVO!
# ⚠️  NÃO FAÇA COMMIT DESTE ARQUIVO NO GIT!
# ═══════════════════════════════════════════════════
"@

# Salvar arquivo
try {
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Host ""
    Write-Host "[OK] Arquivo .env criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Localizacao: $envPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "1. Inicie o servidor: npm start" -ForegroundColor White
    Write-Host "2. Verifique a mensagem: 'Conectado ao MongoDB Atlas (Nuvem)'" -ForegroundColor White
    Write-Host "3. Execute a sincronizacao: POST /api/sync" -ForegroundColor White
    Write-Host ""
    Write-Host "Dica: Use http://localhost:3002/test para testar" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "[ERRO] Erro ao criar arquivo .env" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Yellow
}
