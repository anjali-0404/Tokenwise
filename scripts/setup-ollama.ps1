# ─── TokenWise: Ollama setup script ────────────────────────────────────────────
# Run this once after Ollama is installed:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-ollama.ps1

$model = "qwen2.5-coder:3b"

Write-Host ""
Write-Host "TokenWise Ollama Setup" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Ollama is installed
$ollamaExe = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaExe) {
    # Try common install paths on Windows
    $paths = @(
        "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
        "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe"
    )
    $found = $paths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($found) {
        $env:PATH += ";$(Split-Path $found)"
        Write-Host "Found Ollama at: $found" -ForegroundColor Green
    } else {
        Write-Host "Ollama not found. Install from https://ollama.com/download" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Ollama version: $(ollama --version 2>&1)" -ForegroundColor Green

# 2. Start Ollama server in background if not already running
$running = $false
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
    $running = $true
    Write-Host "Ollama server already running." -ForegroundColor Green
} catch {
    Write-Host "Starting Ollama server..." -ForegroundColor Yellow
    Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 4
}

# 3. Pull qwen2.5-coder:3b
Write-Host ""
Write-Host "Pulling model: $model (~2 GB)" -ForegroundColor Cyan
Write-Host "This is the best coding model at this size." -ForegroundColor Gray
Write-Host ""
ollama pull $model

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: $model is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test it:" -ForegroundColor Cyan
    Write-Host "  ollama run $model" -ForegroundColor White
    Write-Host ""
    Write-Host "The model is configured in .env.local as:" -ForegroundColor Cyan
    Write-Host "  MODEL_LOCAL=ollama/$model" -ForegroundColor White
    Write-Host ""
    Write-Host "Start TokenWise:  npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "Pull failed. Try manually: ollama pull $model" -ForegroundColor Red
    exit 1
}
