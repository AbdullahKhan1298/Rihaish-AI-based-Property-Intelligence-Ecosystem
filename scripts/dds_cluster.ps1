param(
    [ValidateSet('start','stop','status')][string]$Action = 'status',
    [ValidateRange(0,3)][int]$Node = 0
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtimeRoot = Join-Path $projectRoot '.runtime\dds'
$binary = Join-Path $projectRoot '.runtime\bin\rqlite-10.6.5\rqlited.exe'
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
$nodes = if ($Node -eq 0) { 1..3 } else { @($Node) }
foreach ($number in $nodes) {
    $httpPort = 3999 + 2 * $number
    $raftPort = $httpPort + 1
    $nodeRoot = Join-Path $runtimeRoot "node$number"
    $pidFile = Join-Path $runtimeRoot "node$number.pid"
    $nodeProcess = $null
    if (Test-Path $pidFile) {
        $nodeProcess = Get-Process -Id ([int](Get-Content $pidFile)) -ErrorAction SilentlyContinue
        if ($nodeProcess -and $nodeProcess.Path -ne $binary) {
            Write-Output "node$number PID file is stale; unrelated process left untouched"
            $nodeProcess = $null
        }
        if ($nodeProcess) {
            $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($nodeProcess.Id)").CommandLine
            if ($commandLine -notlike "*rihaish-dds-$number*" -or $commandLine -notlike "*$nodeRoot*") { throw 'Node command ownership mismatch' }
        }
    }
    if ($Action -eq 'start') {
        if ($nodeProcess) { Write-Output "node$number already running PID $($nodeProcess.Id)"; continue }
        if (Get-NetTCPConnection -LocalPort $httpPort,$raftPort -State Listen -ErrorAction SilentlyContinue) { throw "Node $number ports already occupied" }
        $arguments = @('-node-id', "rihaish-dds-$number", '-http-addr', "127.0.0.1:$httpPort", '-raft-addr', "127.0.0.1:$raftPort", '-fk')
        if ($number -ne 1) {
            $joinAddresses = (1..3 | Where-Object { $_ -ne $number } | ForEach-Object { '127.0.0.1:' + (4000 + 2 * $_) }) -join ','
            $arguments += @('-join', $joinAddresses)
        }
        $arguments += $nodeRoot
        $nodeProcessId = & python (Join-Path $PSScriptRoot 'start_dds_process.py') --cwd $projectRoot --stdout (Join-Path $runtimeRoot "node$number.stdout.log") --stderr (Join-Path $runtimeRoot "node$number.stderr.log") -- $binary @arguments
        if ($LASTEXITCODE -ne 0) { throw "Failed to start node $number" }
        [int]$nodeProcessId | Set-Content $pidFile
        Write-Output "node$number started PID $nodeProcessId HTTP $httpPort Raft $raftPort"
    } elseif ($Action -eq 'stop') {
        if ($nodeProcess) { Stop-Process -Id $nodeProcess.Id; Write-Output "node$number stopped; data retained" }
    } else {
        try {
            $state = Invoke-RestMethod "http://127.0.0.1:$httpPort/status" -TimeoutSec 2
            [pscustomobject]@{Node=$number; PID=$nodeProcess.Id; Role=$state.store.raft.state; Leader=$state.store.leader.node_id; URL="http://127.0.0.1:$httpPort"}
        } catch { Write-Output "node$number unreachable" }
    }
}

