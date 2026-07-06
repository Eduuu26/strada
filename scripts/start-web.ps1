# Strada — app web Expo
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root
npx expo start --web --port 8084
