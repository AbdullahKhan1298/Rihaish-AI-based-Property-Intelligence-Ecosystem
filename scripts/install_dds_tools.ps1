$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$downloads = Join-Path $projectRoot '.runtime\downloads'
$binaries = Join-Path $projectRoot '.runtime\bin'
New-Item -ItemType Directory -Force -Path $downloads,$binaries | Out-Null
$packages = @(
    @{Name='rqlite-10.6.5'; Asset='rqlite-v10.6.5-win64.zip'; URL='https://github.com/rqlite/rqlite/releases/download/v10.6.5/rqlite-v10.6.5-win64.zip'; Hash='d77a453c71d5544c89ae8a66a425339bd7a64e8e05f3366e9069f820457101b2'},
    @{Name='caddy-2.11.7'; Asset='caddy.zip'; URL='https://github.com/caddyserver/caddy/releases/download/v2.11.7/caddy_2.11.7_windows_amd64.zip'; Hash='0a1edc0b799512051c57071ce0e798d3f2cf67dc98171366f1d2b326072e3b06'},
    @{Name='k6-2.3.0'; Asset='k6.zip'; URL='https://github.com/grafana/k6/releases/download/v2.3.0/k6-v2.3.0-windows-amd64.zip'; Hash='112276d495e5741c968e2bc09ea6196099c1275bd6db9ee0875d173c7148ce43'}
)
foreach ($package in $packages) {
    $archive = Join-Path $downloads $package.Asset
    if (-not (Test-Path $archive)) { Invoke-WebRequest $package.URL -OutFile $archive }
    if ((Get-FileHash $archive -Algorithm SHA256).Hash.ToLower() -ne $package.Hash) { throw "$($package.Name) checksum mismatch" }
    $destination = Join-Path $binaries $package.Name
    if (-not (Test-Path $destination)) { Expand-Archive $archive -DestinationPath $destination }
    Write-Output "$($package.Name) archive checksum verified; runtime available in $destination"
}

