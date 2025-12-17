#!/bin/bash

echo "🚀 Iniciando configuração do SousChef Digital..."

# Frontend
echo "📱 Configurando frontend..."
cd frontend
npm install
cp .env .env.local
cd ..

# Backend
echo "🔧 Configurando backend..."
cd backend
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
cd ..

echo "✅ Projeto configurado com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis de ambiente nos arquivos .env"
echo "2. Execute 'cd frontend && npm start' para iniciar o frontend"
echo "3. Execute 'cd backend && uvicorn app.main:app --reload' para o backend"
echo "4. Ou use 'docker-compose up' para subir tudo com Docker"
