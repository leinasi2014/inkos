param()

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

& (Join-Path $PSScriptRoot "stop-hidden-stack.ps1")
Start-Sleep -Seconds 1

$serverPid = & (Join-Path $PSScriptRoot "start-hidden-server.ps1")
Start-Sleep -Seconds 2
$webPid = & (Join-Path $PSScriptRoot "start-hidden-web.ps1")

[PSCustomObject]@{
  serverPid = $serverPid
  webPid = $webPid
  logsDir = Join-Path $repoRoot "output\dev"
}
