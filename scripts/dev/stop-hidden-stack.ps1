param()

$ErrorActionPreference = "SilentlyContinue"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$logsDir = Join-Path $repoRoot "output\dev"

foreach ($pidPath in @("server.pid", "web.pid")) {
  $fullPath = Join-Path $logsDir $pidPath
  if (Test-Path $fullPath) {
    $savedPid = Get-Content $fullPath
    if ($savedPid) {
      Stop-Process -Id ([int]$savedPid) -Force
    }
    Remove-Item $fullPath -Force
  }
}

$ports = @(3000, 7749)
foreach ($port in $ports) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $listener) {
    Stop-Process -Id $procId -Force
  }
}
