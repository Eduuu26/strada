# Publicar en GitHub (ejecutar tras `gh auth login`)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "=== Verificando GitHub CLI ===" -ForegroundColor Cyan
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ejecuta primero: gh auth login" -ForegroundColor Yellow
    exit 1
}

$repo = "strada"
$user = "Eduuu26"
$remote = "https://github.com/$user/$repo.git"

Write-Host "=== Repositorio: $user/$repo ===" -ForegroundColor Cyan

if (-not (git remote get-url origin 2>$null)) {
    gh repo create $repo --private --source=. --remote=origin --description "Strada - comunidad de rutas en coche y moto"
} else {
    Write-Host "Remote origin ya existe"
}

Write-Host "=== Push main + tags ===" -ForegroundColor Cyan
git push -u origin main
git push --tags

$version = (node -p "require('./package.json').version")
$tag = "v$version"

if (git tag -l $tag) {
    Write-Host "=== Creando release $tag ===" -ForegroundColor Cyan
    gh release create $tag --title $tag --notes "Ver CHANGELOG.md para detalles de esta versión."
}

Write-Host ""
Write-Host "Listo: https://github.com/$user/$repo" -ForegroundColor Green
Write-Host "Releases: https://github.com/$user/$repo/releases" -ForegroundColor Green
