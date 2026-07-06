# Strada — arranque desarrollo local (2 ventanas)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "=== Strada dev ===" -ForegroundColor Cyan
Write-Host "1. API:  http://127.0.0.1:8788"
Write-Host "2. Web:  http://localhost:8084"
Write-Host "Demo:    carlos@strada.es / StradaDemo1!"
Write-Host ""

# API en esta ventana
npm run email-server
