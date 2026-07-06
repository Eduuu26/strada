# Despliega Strada API en el servidor x99 (Docker + Caddy + datos en /mnt/M5)
param(
    [string]$SshHost = "x99",
    [switch]$SkipFunnel
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$deployDir = Join-Path $root "deploy\x99"
$remoteRoot = "~/strada-api"

Write-Host "=== Desplegando Strada API en $SshHost ===" -ForegroundColor Cyan

ssh $SshHost "mkdir -p $remoteRoot/server /mnt/M5/strada-api/data"

Write-Host "Subiendo archivos..." -ForegroundColor Gray
scp -r (Join-Path $root "server\*") "${SshHost}:${remoteRoot}/server/"
scp (Join-Path $deployDir "docker-compose.yml") "${SshHost}:${remoteRoot}/"
scp (Join-Path $deployDir "Caddyfile") "${SshHost}:${remoteRoot}/"
scp (Join-Path $deployDir ".env.example") "${SshHost}:${remoteRoot}/.env.example"
scp (Join-Path $deployDir "strada-funnel.service") "${SshHost}:${remoteRoot}/"

$remoteSetup = @(
    'set -e'
    'cd ~/strada-api'
    'if [ ! -f .env ]; then cp .env.example .env; JWT=$(openssl rand -hex 32); KEY=$(openssl rand -hex 32); sed -i "s/CHANGE_ME_JWT/$JWT/" .env; sed -i "s/CHANGE_ME_KEY/$KEY/" .env; echo ".env creado"; fi'
    'docker compose build --pull'
    'docker compose up -d'
    'docker compose ps'
) -join '; '

ssh $SshHost $remoteSetup

if (-not $SkipFunnel) {
    Write-Host "=== Tailscale Funnel (opcional, si no usas api.strada.es) ===" -ForegroundColor Cyan
    $funnel = ssh $SshHost "tailscale funnel --bg 8788 2>&1; tailscale funnel status 2>&1"
    Write-Host $funnel
}

Write-Host ""
Write-Host "=== Health local ===" -ForegroundColor Cyan
ssh $SshHost "curl -sf http://127.0.0.1/api/v1/health 2>/dev/null || curl -sf http://strada-api:8788/api/v1/health 2>/dev/null || docker exec strada-api wget -qO- http://127.0.0.1:8788/api/v1/health; echo"

Write-Host ""
Write-Host "Siguiente: .\scripts\connect-x99-api.ps1 -ApiUrl 'https://TU-URL'" -ForegroundColor Green
