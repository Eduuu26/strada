# Conectar API de x99 a la app (eas.json, .env.production, secretos EAS)
param(
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl
)

$ErrorActionPreference = "Stop"
$ApiUrl = $ApiUrl.TrimEnd('/')
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "=== Probando API: $ApiUrl ===" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/api/v1/health" -TimeoutSec 60
    Write-Host "Health OK: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: No responde $ApiUrl/api/v1/health" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

$body = '{"email":"carlos@strada.es","password":"StradaDemo1!"}'
try {
    $login = Invoke-RestMethod -Uri "$ApiUrl/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    if ($login.ok) { Write-Host "Login demo OK" -ForegroundColor Green }
} catch {
    Write-Host "Login demo: primera vez sin seed (normal)" -ForegroundColor Yellow
}

$eas = Get-Content eas.json -Raw | ConvertFrom-Json
$eas.build.production.env.EXPO_PUBLIC_STRADA_API_URL = $ApiUrl
$eas.build.production.env.EXPO_PUBLIC_STRADA_EMAIL_API = $ApiUrl
$eas.build.production.env.EXPO_PUBLIC_BACKEND_PROVIDER = "strada-api"
$eas | ConvertTo-Json -Depth 10 | Set-Content eas.json -Encoding UTF8

@(
    "EXPO_PUBLIC_BACKEND_PROVIDER=strada-api",
    "EXPO_PUBLIC_STRADA_API_URL=$ApiUrl",
    "EXPO_PUBLIC_STRADA_EMAIL_API=$ApiUrl",
    "EXPO_PUBLIC_PRIVACY_POLICY_URL=https://eduuu26.github.io/strada/privacy-policy.html",
    "EXPO_PUBLIC_TERMS_URL=https://eduuu26.github.io/strada/terms-of-service.html",
    "EXPO_PUBLIC_LEGAL_NOTICE_URL=https://eduuu26.github.io/strada/aviso-legal.html",
    "EXPO_PUBLIC_COOKIE_POLICY_URL=https://eduuu26.github.io/strada/cookie-policy.html",
    "EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL=https://eduuu26.github.io/strada/subscription-terms.html",
    "APP_ENV=production"
) | Set-Content .env.production

Write-Host ""
Write-Host "eas.json y .env.production actualizados con $ApiUrl" -ForegroundColor Green

$easUser = eas whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "=== Configurando secretos EAS ===" -ForegroundColor Cyan
    $secrets = @{
        EXPO_PUBLIC_BACKEND_PROVIDER = "strada-api"
        EXPO_PUBLIC_STRADA_API_URL = $ApiUrl
        EXPO_PUBLIC_STRADA_EMAIL_API = $ApiUrl
        EXPO_PUBLIC_PRIVACY_POLICY_URL = "https://eduuu26.github.io/strada/privacy-policy.html"
        EXPO_PUBLIC_TERMS_URL = "https://eduuu26.github.io/strada/terms-of-service.html"
        EXPO_PUBLIC_LEGAL_NOTICE_URL = "https://eduuu26.github.io/strada/aviso-legal.html"
        EXPO_PUBLIC_COOKIE_POLICY_URL = "https://eduuu26.github.io/strada/cookie-policy.html"
        EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL = "https://eduuu26.github.io/strada/subscription-terms.html"
    }
    foreach ($name in $secrets.Keys) {
        eas secret:create --scope project --name $name --value $secrets[$name] --force 2>$null
    }
    Write-Host "Secretos EAS listos." -ForegroundColor Green
} else {
    Write-Host "Ejecuta 'eas login' y vuelve a lanzar este script." -ForegroundColor Yellow
}
