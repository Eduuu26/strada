# Añade api.strada.es -> IP del servidor x99 en OVH DNS
param(
    [string]$Domain = "strada.es",
    [string]$Subdomain = "api",
    [string]$TargetIp = "85.56.205.160",
    [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $EnvFile) { $EnvFile = Join-Path $root "deploy\x99\.ovh.env" }

$tokenUrl = 'https://api.ovh.com/createToken/?GET=/domain/zone/*&POST=/domain/zone/*&PUT=/domain/zone/*&DELETE=/domain/zone/*'
$zoneUrl = "https://www.ovh.com/manager/#/web/domain/$Domain/zone"

if (-not (Test-Path $EnvFile)) {
    @"
# Obtén tokens en la URL que se abre al ejecutar este script
OVH_ENDPOINT=ovh-eu
OVH_APP_KEY=
OVH_APP_SECRET=
OVH_CONSUMER_KEY=
"@ | Set-Content $EnvFile -Encoding UTF8
    Write-Host "Creado $EnvFile - rellena las 3 claves OVH y vuelve a ejecutar." -ForegroundColor Yellow
    Start-Process $tokenUrl
    Start-Process $zoneUrl
    exit 1
}

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Variable -Name $matches[1].Trim() -Value $matches[2].Trim() }
}

foreach ($k in @('OVH_APP_KEY','OVH_APP_SECRET','OVH_CONSUMER_KEY')) {
    $val = (Get-Variable -Name $k -ValueOnly -ErrorAction SilentlyContinue)
    if (-not $val) { Write-Host "Falta $k en $EnvFile" -ForegroundColor Red; exit 1 }
}

$endpoint = if ($OVH_ENDPOINT) { $OVH_ENDPOINT } else { 'ovh-eu' }
$base = switch ($endpoint) {
    'ovh-eu' { 'https://eu.api.ovh.com/1.0' }
    'ovh-ca' { 'https://ca.api.ovh.com/1.0' }
    default { 'https://api.ovh.com/1.0' }
}

function Invoke-OvhApi {
    param([string]$Method, [string]$Path, [string]$Body = '')
    $url = "$base$Path"
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
    $sha1 = [System.Security.Cryptography.SHA1]::Create()
    $sigSrc = "$OVH_APP_SECRET+$OVH_CONSUMER_KEY+$Method+$url+$Body+$ts"
    $hash = $sha1.ComputeHash([Text.Encoding]::UTF8.GetBytes($sigSrc))
    $sig = '$1$' + (-join ($hash | ForEach-Object { $_.ToString('x2') }))
    $headers = @{
        'X-Ovh-Application' = $OVH_APP_KEY
        'X-Ovh-Consumer'    = $OVH_CONSUMER_KEY
        'X-Ovh-Timestamp'   = $ts
        'X-Ovh-Signature'   = $sig
        'Content-Type'      = 'application/json'
    }
    if ($Method -eq 'GET') { return Invoke-RestMethod -Uri $url -Headers $headers -Method Get }
    return Invoke-RestMethod -Uri $url -Headers $headers -Method $Method -Body $Body
}

$fqdn = "${Subdomain}.${Domain}"
Write-Host "=== OVH DNS: $fqdn -> $TargetIp ===" -ForegroundColor Cyan

$listPath = "/domain/zone/$Domain/record?fieldType=A&subDomain=$Subdomain"
$existing = Invoke-OvhApi GET $listPath
if ($existing.Count -gt 0) {
    foreach ($rec in $existing) {
        Write-Host "Eliminando A antiguo id $($rec.id)" -ForegroundColor Gray
        Invoke-OvhApi DELETE "/domain/zone/$Domain/record/$($rec.id)"
    }
}

$payload = @{ fieldType = 'A'; subDomain = $Subdomain; target = $TargetIp; ttl = 300 } | ConvertTo-Json -Compress
Invoke-OvhApi POST "/domain/zone/$Domain/record" $payload | Out-Null
Invoke-OvhApi POST "/domain/zone/$Domain/refresh" '{}' | Out-Null

Write-Host "Registro A creado. Propagacion: 5-15 min." -ForegroundColor Green
Write-Host "Prueba: nslookup $fqdn" -ForegroundColor Gray
