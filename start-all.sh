#!/bin/bash
set -euo pipefail

# Inicia backend (FastAPI) e frontend (Expo) em paralelo.
# Uso: ./start-all.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Verificações básicas
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python3 não encontrado" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado" >&2
  exit 1
fi

# Porta padrão do backend
BACKEND_PORT=8000
if lsof -iTCP:${BACKEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Porta ${BACKEND_PORT} já está em uso. Libere a porta ou ajuste a API_URL no frontend." >&2
  exit 1
fi

# Função para encerrar subprocessos
cleanup() {
  echo "\nEncerrando serviços..."
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# Backend
(
  cd "$BACKEND_DIR"
  if [ ! -d "venv" ]; then
    python3 -m venv venv
  fi
  source venv/bin/activate
  # Instalamos dependências apenas se o cache do pip estiver vazio para agilizar.
  if [ ! -d "venv/lib" ] || ! python3 -c "import fastapi" >/dev/null 2>&1; then
    pip install -r requirements.txt
  fi
  echo "Backend: iniciando em http://localhost:${BACKEND_PORT}"
  exec uvicorn app.main:app --reload --host 0.0.0.0 --port ${BACKEND_PORT}
) &
BACKEND_PID=$!

# Frontend
(
  cd "$FRONTEND_DIR"
  if [ ! -d "node_modules" ]; then
    npm install
  fi
  echo "Frontend: iniciando Expo (pressione 'w', 'a', 'i' conforme necessidade)"
  exec npm run start
) &
FRONTEND_PID=$!

# Aguardar ambos
wait
