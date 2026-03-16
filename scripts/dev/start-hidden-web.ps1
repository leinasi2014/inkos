param()

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$logsDir = Join-Path $repoRoot "output\dev"
$outLog = Join-Path $logsDir "web.stdout.log"
$errLog = Join-Path $logsDir "web.stderr.log"
$pidFile = Join-Path $logsDir "web.pid"
$webDir = Join-Path $repoRoot "packages\web"
$buildId = Join-Path $webDir ".next\BUILD_ID"
$nextCli = Join-Path $webDir "node_modules\next\dist\bin\next"
$nodeExe = (Get-Command node).Source

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

if (-not (Test-Path $buildId)) {
  throw "Web build not found at $buildId. Run `pnpm --filter @actalk/inkos-web build` first."
}

if (-not (Test-Path $nextCli)) {
  throw "Next CLI not found at $nextCli."
}

$listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $listener) {
  Stop-Process -Id $procId -Force
}

Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath $nodeExe -ArgumentList @($nextCli, "start", "-p", "3000") -WorkingDirectory $webDir -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
$proc.Id | Set-Content -Path $pidFile
$proc.Id
