#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PYTHON_BIN="${PYTHON_BIN:-python3}"

if [ ! -d ".venv" ]; then
  "$PYTHON_BIN" -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip

case "$(uname -s)" in
  Darwin)
    # macOS does not use CUDA. This installs regular PyTorch wheels; Apple
    # Silicon users can try DIFFUSERS_DEVICE=mps, but CUDA-only settings should
    # be changed in .env.
    python -m pip install torch torchvision torchaudio
    ;;
  Linux)
    # CUDA 12.8 wheels work for recent NVIDIA drivers. If your machine uses a
    # different CUDA/PyTorch combo, use https://pytorch.org/get-started/locally/
    # and replace this line with the recommended command.
    python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
    ;;
  *)
    python -m pip install torch torchvision torchaudio
    ;;
esac

python -m pip install -r requirements.txt
python -m pip install -r requirements-diffusers.txt

python - <<'PY'
import torch
print("torch:", torch.__version__)
print("cuda available:", torch.cuda.is_available())
print("mps available:", getattr(torch.backends, "mps", None) is not None and torch.backends.mps.is_available())
if torch.cuda.is_available():
    print("gpu:", torch.cuda.get_device_name(0))
PY

