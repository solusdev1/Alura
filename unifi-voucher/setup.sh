#!/bin/bash

# Setup Script - Configure o sistema rapidamente
# Use este script na primeira vez para preparar o sistema

echo ""
echo "===== SETUP INICIAL - UNIFI VOUCHER SYSTEM ====="
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[!] ERRO: Node.js nao foi encontrado!"
    echo "[*] Baixe em: https://nodejs.org/"
    exit 1
fi

echo "[v] Node.js detectado:"
node --version

# Verificar se npm existe
if ! command -v npm &> /dev/null; then
    echo "[!] ERRO: npm nao foi encontrado!"
    exit 1
fi

echo "[v] npm detectado:"
npm --version
echo ""

# Limpar instalações anteriores
if [ -d "node_modules" ]; then
    echo "[*] Removendo node_modules antigo..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "[*] Removendo package-lock.json antigo..."
    rm -f package-lock.json
fi

# Instalar dependências
echo "[*] Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo "[!] Erro ao instalar dependencias"
    exit 1
fi

echo "[v] Dependencias instaladas com sucesso!"
echo ""

# Verificar .env
if [ -f ".env" ]; then
    echo "[v] Arquivo .env encontrado"
else
    echo "[!] Arquivo .env nao encontrado"
    echo "[*] Criando .env a partir de .env.example..."
    cp ".env.example" ".env"
    echo "[v] Arquivo .env criado"
    echo "[!] IMPORTANTE: Edite o arquivo .env com suas configuracoes"
fi

echo ""
echo "===== SETUP COMPLETO! ====="
echo ""
echo "Proximos passos:"
echo "1. Edite o arquivo .env com suas configuracoes"
echo "2. Execute: ./start.sh"
echo "3. Acesse: http://localhost:3000"
echo ""
