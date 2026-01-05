#!/bin/bash

# Script de teste rápido do frontend SousChef Digital

echo "========================================="
echo "  SousChef Digital - Frontend Test"
echo "========================================="
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado"
    exit 1
fi

echo "✅ Node.js: $(node -v)"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado"
    exit 1
fi

echo "✅ npm: $(npm -v)"

# Verificar se Expo está instalado globalmente
if ! command -v expo &> /dev/null; then
    echo "⚠️  Expo CLI não está instalado globalmente"
    echo "   Executando com npx..."
    EXPO_CMD="npx expo"
else
    echo "✅ Expo CLI instalado"
    EXPO_CMD="expo"
fi

echo ""
echo "Verificando dependências do frontend..."

# Entrar no diretório frontend
cd frontend || exit

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Instalando dependências..."
    npm install
fi

echo ""
echo "✅ Dependências verificadas"

echo ""
echo "========================================="
echo "  Opções:"
echo "========================================="
echo "1. Iniciar com Expo (Expo Go)"
echo "2. Iniciar emulador Android"
echo "3. Iniciar emulador iOS (apenas macOS)"
echo "4. Iniciar web"
echo "5. Limpar e recomeçar"
echo ""
read -p "Escolha uma opção (1-5): " option

case $option in
    1)
        echo ""
        echo "🚀 Iniciando Expo..."
        $EXPO_CMD start
        ;;
    2)
        echo ""
        echo "🚀 Iniciando emulador Android..."
        npm run android
        ;;
    3)
        echo ""
        echo "🚀 Iniciando emulador iOS..."
        npm run ios
        ;;
    4)
        echo ""
        echo "🚀 Iniciando web..."
        npm run web
        ;;
    5)
        echo ""
        echo "🧹 Limpando cache..."
        npm start -- --clear
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac
