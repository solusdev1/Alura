#!/bin/bash

echo ""
echo "===== SISTEMA DE VOUCHERS UNIFI ======"
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "[*] Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[!] Erro ao instalar dependencias"
        exit 1
    fi
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "[!] ERRO: Arquivo .env nao encontrado"
    echo "[*] Copie o arquivo .env.example para .env e configure"
    exit 1
fi

echo "[*] Iniciando servidor na porta 3000..."
echo "[*] Acesse: http://localhost:3000"
echo ""
node server.js
