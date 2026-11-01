param([string]$Label = 'verification', [string]$BaseUrl = 'http://127.0.0.1:8000', [int]$GoMaxProcs = 0, [switch]$Profile, [switch]$FreshConnections)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$stamp = Get-Date -Format 'yyyyMMddTHHmmssfff'
$runDirectory = Join-Path $projectRoot "docs\evidence\k6-$stamp"
New-Item -ItemType Directory -Path $runDirectory | Out-Null
$runner = Join-Path $projectRoot '.runtime\bin\k6-2.3.0\k6-v2.3.0-windows-amd64\k6.exe'
$workload = Join-Path $projectRoot 'tests\dds_load.js'
function Get-SHA256([string]$Path) {
    $stream = [System.IO.File]::OpenRead($Path)
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-','').ToLower() }
    finally { $stream.Dispose(); $algorithm.Dispose() }
}
Copy-Item -LiteralPath $workload -Destination (Join-Path $runDirectory 'workload.js')
$env:SSLKEYLOGFILE = $null
$env:NO_PROXY = 'localhost,127.0.0.1'
$env:BASE_URL = $BaseUrl
if ($GoMaxProcs -gt 0) { $env:GOMAXPROCS = [string]$GoMaxProcs }
$env:SUMMARY_PATH = (Join-Path $runDirectory 'summary.json').Replace('\','/')
foreach ($port in @(8001,8002,8000)) {
    $deadline = (Get-Date).AddSeconds(30)
    do {
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$port/api/health/ready" -TimeoutSec 3
            if ($health.ready -and $health.database -eq 'rqlite') { break }
        } catch { }
        if ((Get-Date) -ge $deadline) { throw "API on $port did not become ready; load test not started" }
        Start-Sleep -Milliseconds 200
    } while ($true)
}
$metadata = [ordered]@{
    label=$Label
    started_at=(Get-Date).ToString('o')
    runner_version=(& $runner version | Out-String).Trim()
    workload_sha256=(Get-SHA256 $workload)
    base_url=$BaseUrl
    gomaxprocs=$env:GOMAXPROCS
    anonymous_usage_report=$false
    connection_reuse=(-not $FreshConnections)
    acceptance_profile=($BaseUrl -eq 'http://127.0.0.1:8000' -and $GoMaxProcs -eq 0 -and -not $Profile -and -not $FreshConnections)
    source_hashes=@{}
}
foreach ($relative in @('backend\app\main.py','backend\app\api\routes_properties.py','backend\app\db\catalog.py','backend\app\db\rqlite.py','infra\Caddyfile','scripts\dds_services.ps1','scripts\dds_cluster.ps1','scripts\start_dds_process.py')) {
    $metadata.source_hashes[$relative] = Get-SHA256 (Join-Path $projectRoot $relative)
}
$metadata | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $runDirectory 'run.json')
$arguments = @('run','--quiet','--no-usage-report')
if ($Profile) { $arguments += @('--address','127.0.0.1:6565','--profiling-enabled') }
if ($FreshConnections) { $arguments += '--no-connection-reuse' }
$arguments += 'tests/dds_load.js'
$process = Start-Process -FilePath $runner -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -Wait -RedirectStandardOutput (Join-Path $runDirectory 'console.txt') -RedirectStandardError (Join-Path $runDirectory 'errors.txt')
$metadata.completed_at = (Get-Date).ToString('o')
$metadata.exit_code = $process.ExitCode
$metadata | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $runDirectory 'run.json')
Write-Output "k6 exit $($process.ExitCode); evidence: $runDirectory"
exit $process.ExitCode
