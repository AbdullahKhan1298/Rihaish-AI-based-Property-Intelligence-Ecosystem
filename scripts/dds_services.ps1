param(
    [ValidateSet('start','stop','status')][string]$Action = 'status',
    [ValidateRange(1,128)][int]$MaxInflight = 8,
    [Alias('Service')][ValidateSet('all','api1','api2','proxy')][string]$ServiceName = 'all'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtimeRoot = Join-Path $projectRoot '.runtime\services'
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
$pythonBinary = (Get-Command python).Source
$caddyBinary = Join-Path $projectRoot '.runtime\bin\caddy-2.11.7\caddy.exe'
$services = @(
    @{Name='api1'; Port=8001; Binary=$pythonBinary; Arguments=@('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8001'); Workdir=(Join-Path $projectRoot 'backend')},
    @{Name='api2'; Port=8002; Binary=$pythonBinary; Arguments=@('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8002'); Workdir=(Join-Path $projectRoot 'backend')},
    @{Name='proxy'; Port=8000; Binary=$caddyBinary; Arguments=@('run','--config',(Join-Path $projectRoot 'infra\Caddyfile')); Workdir=$projectRoot}
)
if ($ServiceName -ne 'all') { $services = @($services | Where-Object { $_.Name -eq $ServiceName }) }
$env:RIHAISH_DB_BACKEND = 'rqlite'
$env:RIHAISH_MAX_INFLIGHT = [string]$MaxInflight
$env:PYTHONIOENCODING = 'utf-8'
$env:SSLKEYLOGFILE = $null
foreach ($service in $services) {
    $pidFile = Join-Path $runtimeRoot ($service.Name + '.pid')
    $ownedProcess = $null
    if (Test-Path $pidFile) {
        $ownedProcess = Get-Process -Id ([int](Get-Content $pidFile)) -ErrorAction SilentlyContinue
        if ($ownedProcess -and $ownedProcess.Path -ne $service.Binary) {
            Write-Output "$($service.Name) PID file is stale; unrelated process left untouched"
            $ownedProcess = $null
        }
        if ($ownedProcess) {
            $line = (Get-CimInstance Win32_Process -Filter "ProcessId=$($ownedProcess.Id)").CommandLine
            if ($service.Name -eq 'proxy') {
                if ($line -notlike '*infra\Caddyfile*') { throw 'Proxy process ownership mismatch' }
            } elseif ($line -notlike "*app.main:app*--port $($service.Port)*") { throw 'API process ownership mismatch' }
        }
    }
    if ($Action -eq 'start') {
        if ($ownedProcess) { Write-Output "$($service.Name) already running"; continue }
        if (Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue) { throw "Port $($service.Port) occupied; refusing to stop another service" }
        $env:RIHAISH_INSTANCE_ID = $service.Name
        $serviceArguments = $service.Arguments
        $ownedProcessId = & $pythonBinary (Join-Path $PSScriptRoot 'start_dds_process.py') --cwd $service.Workdir --stdout (Join-Path $runtimeRoot ($service.Name + '.stdout.log')) --stderr (Join-Path $runtimeRoot ($service.Name + '.stderr.log')) -- $service.Binary @serviceArguments
        if ($LASTEXITCODE -ne 0) { throw "Failed to start $($service.Name)" }
        [int]$ownedProcessId | Set-Content $pidFile
        Write-Output "$($service.Name) started PID $ownedProcessId port $($service.Port)"
    } elseif ($Action -eq 'stop') {
        if ($ownedProcess) { Stop-Process -Id $ownedProcess.Id; Write-Output "$($service.Name) stopped" }
    } else {
        [pscustomobject]@{Service=$service.Name; PID=$ownedProcess.Id; Port=$service.Port}
    }
}

