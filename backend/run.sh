#!/bin/bash

# Script de inicialização do SousChef Digital com Assistente de Voz

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🍽️ SOUSCHEF DIGITAL - ASSISTENTE DE VOZ 🎙️         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "requirements.txt" ]; then
    print_error "Este script deve ser executado no diretório 'backend'"
    exit 1
fi

echo ""
echo "🔧 INICIANDO COMPONENTES..."
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    print_error "Python3 não encontrado"
    exit 1
fi
print_status "Python3 disponível: $(python3 --version)"

# Verificar ffmpeg (necessário para Whisper)
if ! command -v ffmpeg &> /dev/null; then
    print_error "ffmpeg não encontrado (necessário para transcrever áudio)"
    print_info "Instale com: sudo apt-get install ffmpeg"
    exit 1
fi
print_status "ffmpeg disponível: $(ffmpeg -version | head -n 1)"

# Criar venv se não existir
if [ ! -d "venv" ]; then
    print_info "Criando ambiente virtual..."
    python3 -m venv venv
    print_status "Ambiente virtual criado"
fi

# Ativar venv
source venv/bin/activate
print_status "Ambiente virtual ativado"

# Instalar dependências
if [ ! -f "venv/lib/python3.*/site-packages/whisper" ]; then
    print_info "Instalando dependências (primeira execução)..."
    pip install -q -r requirements.txt
    print_status "Dependências instaladas"
fi

# Verificar Whisper
print_info "Carregando modelo Whisper..."
python3 -c "import whisper; whisper.load_model('base')" 2>&1 | grep -q "Whisper" && print_status "Modelo Whisper pronto" || print_status "Modelo Whisper carregado"

echo ""
echo "🚀 INICIANDO SERVIDOR..."
echo ""

# Iniciar servidor
print_info "Backend rodando em: http://localhost:8000"
print_info "Documentação em: http://localhost:8000/docs"
print_info "Swagger UI: http://localhost:8000/redoc"
echo ""
print_warning "Pressione CTRL+C para parar o servidor"
echo ""

# Iniciar uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Cleanup
echo ""
print_info "Encerrando servidor..."
deactivate
print_status "Aplicação encerrada"
