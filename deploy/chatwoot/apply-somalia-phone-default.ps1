# Apply Somalia (+252) default on connect.omaya.io (Windows helper).
# Run the bash script on your Linux/Chatwoot server instead:
#   CHATWOOT_CONTAINER=chatwoot_app bash deploy/chatwoot/apply-somalia-phone-default.sh
#
# Manual edit (no rebuild): in Chatwoot repo, open app/views/widgets/show.html.erb
# and paste deploy/chatwoot/somalia-phone-default/timezone-inject.html.erb
# immediately BEFORE the line: <%= vite_client_tag %>

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$injectFile = Join-Path $PSScriptRoot "somalia-phone-default\timezone-inject.html.erb"
$helperFile = Join-Path $PSScriptRoot "somalia-phone-default\helper.js"

Write-Host "Somalia (+252) Chatwoot patch files:" -ForegroundColor Cyan
Write-Host "  Inject: $injectFile"
Write-Host "  Helper: $helperFile"
Write-Host ""
Write-Host "This must be applied on the connect.omaya.io Chatwoot server." -ForegroundColor Yellow
Write-Host "Example (SSH into server, from this repo):" 
Write-Host "  CHATWOOT_CONTAINER=chatwoot_app bash deploy/chatwoot/apply-somalia-phone-default.sh"
Write-Host ""
Get-Content $injectFile
