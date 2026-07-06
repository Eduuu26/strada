# Publicar en GitHub vía SSH (sin gh auth)
# Requisitos:
#   1. Clave SSH añadida en https://github.com/settings/ssh/new
#   2. Repo vacío creado en https://github.com/new?name=strada&private=true

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "=== Comprobando SSH con GitHub ===" -ForegroundColor Cyan
$sshTest = ssh -o BatchMode=yes -o ConnectTimeout=10 -T git@github.com 2>&1 | Out-String
if ($sshTest -notmatch 'successfully authenticated|Hi ') {
    Write-Host "SSH no configurado. Añade tu clave pública:" -ForegroundColor Yellow
    Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
    Write-Host "En: https://github.com/settings/ssh/new" -ForegroundColor Yellow
    exit 1
}
Write-Host $sshTest.Trim()

$user = Read-Host "Tu usuario de GitHub (ej. stefansebastean)"
$repo = "strada"
$remote = "git@github.com:${user}/${repo}.git"

if (-not (git remote get-url origin 2>$null)) {
    git remote add origin $remote
} else {
    git remote set-url origin $remote
}

Write-Host "=== Push main + tags ===" -ForegroundColor Cyan
git push -u origin main
git push --tags

Write-Host ""
Write-Host "Listo: https://github.com/$user/$repo" -ForegroundColor Green
Write-Host "Crea la release v1.0.0 en: https://github.com/$user/$repo/releases/new?tag=v1.0.0" -ForegroundColor Green
