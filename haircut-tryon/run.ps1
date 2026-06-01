$ErrorActionPreference = "Stop"

if (!(Test-Path ".venv")) {
  python -m venv .venv
}

.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if (!(Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example. The app will start in mock mode." -ForegroundColor Yellow
}

$port = 7860
$configuredPort = Select-String -Path ".env" -Pattern "^TRYON_PORT=(\d+)" | Select-Object -First 1
if ($configuredPort -and $configuredPort.Matches.Count -gt 0) {
  $port = [int]$configuredPort.Matches[0].Groups[1].Value
}

Write-Host "Starting HairMatch try-on at http://127.0.0.1:$port"
Write-Host "Press Ctrl+C in this terminal to stop it."
python app.py
