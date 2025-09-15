param(
  [string]$TaskName = "Laravel Schedule Runner",
  [string]$PhpPath = "C:\xampp\php\php.exe",
  [string]$ProjectDir = "C:\xampp\htdocs\nsa-office",
  [switch]$AsSystem,
  [switch]$VerboseLog
)

$ErrorActionPreference = "Stop"

function Ensure-FileExists([string]$path) {
  if (-not (Test-Path $path)) {
    throw "Path not found: $path"
  }
}

Ensure-FileExists $PhpPath
Ensure-FileExists $ProjectDir
Ensure-FileExists (Join-Path $ProjectDir "artisan")

$arguments = "artisan schedule:run --no-ansi --quiet"
if ($VerboseLog) {
  $arguments = "artisan schedule:run --no-ansi >> `"$ProjectDir\storage\logs\scheduler.log`" 2>>&1"
}

$action = New-ScheduledTaskAction -Execute $PhpPath -Argument $arguments -WorkingDirectory $ProjectDir
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration ([TimeSpan]::MaxValue)

if ($AsSystem) {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Description "Run Laravel scheduler every minute" -User "NT AUTHORITY\SYSTEM" -RunLevel Highest -Force | Out-Null
} else {
  $currentUser = "$env:USERDOMAIN\$env:USERNAME"
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Description "Run Laravel scheduler every minute" -User $currentUser -RunLevel Highest -Force | Out-Null
}

Write-Host "Scheduled Task '$TaskName' registered to run every minute." -ForegroundColor Green
