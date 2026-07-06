# Configurar secretos EAS para producción
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando eas-cli..." -ForegroundColor Cyan
    npm install -g eas-cli
}

Write-Host "=== Comprobando sesión Expo ===" -ForegroundColor Cyan
eas whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ejecuta: eas login" -ForegroundColor Yellow
    exit 1
}

$apiUrl = Read-Host "URL del API en producción (ej. https://strada-api.onrender.com)"
if (-not $apiUrl) { Write-Host "URL requerida"; exit 1 }

$secrets = @{
    "EXPO_PUBLIC_BACKEND_PROVIDER" = "strada-api"
    "EXPO_PUBLIC_STRADA_API_URL" = $apiUrl
    "EXPO_PUBLIC_STRADA_EMAIL_API" = $apiUrl
    "EXPO_PUBLIC_PRIVACY_POLICY_URL" = "https://eduuu26.github.io/strada/privacy-policy.html"
    "EXPO_PUBLIC_TERMS_URL" = "https://eduuu26.github.io/strada/terms-of-service.html"
    "EXPO_PUBLIC_LEGAL_NOTICE_URL" = "https://eduuu26.github.io/strada/aviso-legal.html"
    "EXPO_PUBLIC_COOKIE_POLICY_URL" = "https://eduuu26.github.io/strada/cookie-policy.html"
    "EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL" = "https://eduuu26.github.io/strada/subscription-terms.html"
    "EXPO_PUBLIC_SUPABASE_URL" = ""
    "EXPO_PUBLIC_SUPABASE_ANON_KEY" = ""
}

foreach ($name in $secrets.Keys) {
    $val = $secrets[$name]
    Write-Host "Secret: $name" -ForegroundColor Gray
    eas secret:create --scope project --name $name --value $val --force 2>$null
    if ($LASTEXITCODE -ne 0) {
        eas secret:delete --scope project --name $name 2>$null
        eas secret:create --scope project --name $name --value $val
    }
}

Write-Host ""
Write-Host "Secretos configurados. Siguiente: eas build --platform all --profile production" -ForegroundColor Green
