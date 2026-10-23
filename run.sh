#!/usr/bin/env bash
# ==============================================================================
# Wordle Infinite: One-Touch Production Launcher Script
# Starts FastAPI Backend (Port 8000) & Vite Frontend (Port 5173)
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

echo "================================================================================"
echo " 🟩 WORDLE INFINITE: MULTI-GRID SUITE & SHANNON ENTROPY ENGINE"
echo "================================================================================"

# 1. Verify Prerequisites
command -v python3 >/dev/null 2>&1 || { echo "❌ Error: python3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Error: node is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ Error: npm is required but not installed."; exit 1; }

echo "✓ Python: $(python3 --version)"
echo "✓ Node.js: $(node --version)"
echo "✓ npm: v$(npm --version)"

# 2. Check & Install Python Dependencies
echo ""
echo "📦 Checking Python backend dependencies..."
export PYTHONPATH="${BACKEND_DIR}"
python3 -c "import fastapi, uvicorn, pydantic, numpy, pytest, httpx" 2>/dev/null || {
  echo "Installing Python dependencies from ${BACKEND_DIR}/requirements.txt..."
  python3 -m pip install -r "${BACKEND_DIR}/requirements.txt"
}
echo "✓ Python dependencies verified."

# 3. Check & Install Frontend Dependencies
echo ""
echo "📦 Checking Frontend node_modules..."
if [ ! -d "${FRONTEND_DIR}/node_modules" ]; then
  echo "Installing Frontend dependencies..."
  (cd "${FRONTEND_DIR}" && npm install)
fi
echo "✓ Frontend dependencies verified."

# 4. Build Frontend Distribution Bundle
echo ""
echo "🔨 Building production frontend bundle..."
(cd "${FRONTEND_DIR}" && npm run build)
echo "✓ Frontend build complete (${FRONTEND_DIR}/dist)."

# 5. Trap Exit Signals to Kill Child Processes Cleanly
cleanup() {
  echo ""
  echo "🛑 Shutting down Wordle Infinite servers..."
  if [ -n "${BACKEND_PID}" ]; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID}" ]; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  echo "✓ Cleanup complete. Goodbye!"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 6. Launch Backend & Frontend Services
echo ""
echo "🚀 Launching FastAPI Backend on http://127.0.0.1:8000..."
(cd "${BACKEND_DIR}" && PYTHONPATH="${BACKEND_DIR}" python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level warning) &
BACKEND_PID=$!

echo "🚀 Launching Vite Frontend on http://127.0.0.1:5173..."
(cd "${FRONTEND_DIR}" && npm run dev -- --host 127.0.0.1 --port 5173) &
FRONTEND_PID=$!

sleep 2

echo ""
echo "================================================================================"
echo " 🎉 WORDLE INFINITE IS LIVE & READY"
echo "================================================================================"
echo " 🌐 Web Application (Vite Dev Server) : http://127.0.0.1:5173"
echo " 🔌 Backend Server & SPA Fallback     : http://127.0.0.1:8000"
echo " 📖 Interactive OpenAPI Swagger Docs  : http://127.0.0.1:8000/docs"
echo " 🔍 Health Diagnostics                : http://127.0.0.1:8000/api/v1/health"
echo "================================================================================"
echo " Press Ctrl+C at any time to shut down both servers."
echo ""

# Wait for background processes
wait
