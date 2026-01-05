#!/bin/bash

# Script para iniciar o servidor backend com suporte a voz

echo "🚀 Iniciando servidor SousChef Backend com IA de Voz..."
echo ""

# Ativar ambiente virtual
source venv/bin/activate

# Verificar se Ollama está rodando
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama não está rodando. Inicie com: ollama serve"
    echo ""
fi

# Baixar modelo Whisper base (se necessário)
echo "📥 Verificando modelo Whisper..."
python3 -c "import whisper; whisper.load_model('base')" 2>/dev/null && echo "✓ Modelo Whisper carregado"

echo ""
echo "🌐 Servidor rodando em: http://localhost:8000"
echo "📚 Documentação: http://localhost:8000/docs"
echo ""
echo "Endpoints de IA disponíveis:"
echo "  POST /api/ai/transcribe - Transcrever áudio para texto"
echo "  POST /api/ai/chat - Chat com assistente IA"
echo "  POST /api/ai/generate - Geração de texto"
echo ""

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
