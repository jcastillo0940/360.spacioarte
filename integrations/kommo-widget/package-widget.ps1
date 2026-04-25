$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root 'spacioarte_widget'
$zipPath = Join-Path $root 'spacioarte_widget.zip'

if (-not (Test-Path $source)) {
    throw "Widget source folder not found: $source"
}

if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $source '*') -DestinationPath $zipPath -Force

Write-Output "Widget packaged successfully: $zipPath"
