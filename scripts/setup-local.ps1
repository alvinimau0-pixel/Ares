$ErrorActionPreference = "Stop"
Write-Host "ARES Local Runtime preflight"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw "Node.js 20 or newer is required. Install it first." }
$version = (& node -p "process.versions.node").Trim()
$major = [int]($version.Split('.')[0])
if ($major -lt 20) { throw "Node.js 20+ required; found $version" }
if (-not (Get-Command hermes -ErrorAction SilentlyContinue)) {
  Write-Warning "Hermes Agent CLI not detected. Install Hermes Desktop or follow the official Hermes installation guide."
} else {
  Write-Host "Hermes CLI: detected"
}
Write-Host "Preflight complete. This script does not install software or write credentials."
Write-Host "Next: configure Hermes API server and local environment variables, then run npm run start:local."
