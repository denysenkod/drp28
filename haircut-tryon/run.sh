#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PYTHON_BIN="${PYTHON_BIN:-python3}"

if [ ! -d ".venv" ]; then
  "$PYTHON_BIN" -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example. The app will start in mock mode."
fi

port="$(grep -E '^TRYON_PORT=' .env 2>/dev/null | head -n 1 | cut -d '=' -f 2)"
port="${port:-7860}"

echo "Starting HairMatch try-on at http://127.0.0.1:${port}"
echo "Press Ctrl+C in this terminal to stop it."
python app.py
