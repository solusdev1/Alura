@echo off
REM ===========================================================================
REM Setup Script - Configure o sistema rapidamente
REM Use este script na primeira vez para preparar o sistema
REM ===========================================================================

REM Permite que o código analise variáveis ​​durante a própria execução (laços/loops)
setlocal enabledelayedexpansion

echo.
echo ===== SETUP INICIAL - UNIFI VOUCHER SYSTEM =====
echo.

REM Verifica se o instalador mestre do "Node.js" está no computador
REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [!] ERRO: Node.js nao foi encontrado!
    echo [*] Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

echo [v] Node.js detectado: 
node --version

REM O "npm" é a loja de aplicativos do Node. É ele que lê o arquivo package.json
REM Verificar se npm existe
npm --version >nul 2>&1
if errorlevel 1 (
    echo [!] ERRO: npm nao foi encontrado!
    pause
    exit /b 1
)

echo [v] npm detectado:
npm --version
echo.

REM Comando CMD 'rmdir /s /q' = Remove todos os diretórios silenciosamente.
REM Muito comum limpar o 'node_modules' velho antes de tentar instalar de novo
REM Limpar instalações anteriores
if exist "node_modules" (
    echo [*] Removendo node_modules antigo...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    echo [*] Removendo package-lock.json antigo...
    del /q package-lock.json
)

REM Puxa da Internet todas as bibliotecas usadas (Express, Node-Fetch, etc)
REM Instalar dependências
echo [*] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo [!] Erro ao instalar dependencias
    pause
    exit /b 1
)

echo [v] Dependencias instaladas com sucesso!
echo.

REM Usa o utilitário nativo de 'copy' do Windows para fazer um clone do 
REM arquivo de exemplos e transformá-lo num banco .env funcional.
REM Verificar .env
if exist ".env" (
    echo [v] Arquivo .env encontrado
) else (
    echo [!] Arquivo .env nao encontrado
    echo [*] Criando .env a partir de .env.example...
    copy ".env.example" ".env"
    echo [v] Arquivo .env criado
    echo [!] IMPORTANTE: Edite o arquivo .env com suas configuracoes
)

echo.
echo ===== SETUP COMPLETO! =====
echo.
echo Proximos passos:
echo 1. Edite o arquivo .env com suas configuracoes
echo 2. Execute: start.bat
echo 3. Acesse: http://localhost:3000
echo.
pause
