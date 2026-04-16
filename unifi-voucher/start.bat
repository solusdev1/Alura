@echo off
title Unifi Voucher System
echo.
echo ===== SISTEMA DE VOUCHERS UNIFI ======
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [*] Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo [!] Erro ao instalar dependencias
        pause
        exit /b 1
    )
)

REM Verificar se .env existe
if not exist ".env" (
    echo [!] ERRO: Arquivo .env nao encontrado
    echo [*] Copie o arquivo .env.example para .env e configure
    pause
    exit /b 1
)

echo [*] Iniciando servidor na porta 3000...
echo [*] Acesse: http://localhost:3000
echo.
node server.js
