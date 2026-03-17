param()

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$logsDir = Join-Path $repoRoot "output\dev"
$outLog = Join-Path $logsDir "server.stdout.log"
$errLog = Join-Path $logsDir "server.stderr.log"
$pidFile = Join-Path $logsDir "server.pid"
$serverDir = Join-Path $repoRoot "packages\server"
$serverEntry = Join-Path $serverDir "dist\index.js"
$nodeExe = (Get-Command node).Source

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

if (-not (Test-Path $serverEntry)) {
  throw "Server build not found at $serverEntry. Run `pnpm --filter @actalk/inkos-server build` first."
}

$listener = Get-NetTCPConnection -LocalPort 7749 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $listener) {
  Stop-Process -Id $procId -Force
}

Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath $nodeExe -ArgumentList @($serverEntry) -WorkingDirectory $serverDir -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
$proc.Id | Set-Content -Path $pidFile
$proc.Id
