
# Script to fix Supabase Secrets for Edge Functions
# Usage: ./scripts/fix-supabase-secrets.ps1

$EnvFile = ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Read .env file
$env = @{}
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        $env[$key] = $value
    }
}

$SupabaseUrl = $env["VITE_SUPABASE_URL"]
$ServiceRoleKey = $env["SUPABASE_SERVICE_ROLE_KEY"]
# Cloudflare Turnstile Dummy Secret (Always Pass) - matches the default Site Key in AuthForm.tsx
$TurnstileSecret = "1x0000000000000000000000000000000AA"

if (-not $SupabaseUrl) {
    Write-Host "Error: VITE_SUPABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}
if (-not $ServiceRoleKey) {
    Write-Host "Error: SUPABASE_SERVICE_ROLE_KEY not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "Setting secrets for project..." -ForegroundColor Cyan
Write-Host "SUPABASE_URL: $SupabaseUrl"
Write-Host "TURNSTILE_SECRET_KEY: (Dummy Key for Testing)"

# Construct the command
# Note: We are using 'supabase secrets set' which requires the user to be logged in via CLI
# and linked to the project.

Write-Host "Running: supabase secrets set ..." -ForegroundColor Yellow

$secrets = "SUPABASE_URL=$SupabaseUrl", "SUPABASE_SERVICE_ROLE_KEY=$ServiceRoleKey", "TURNSTILE_SECRET_KEY=$TurnstileSecret"

try {
    supabase secrets set $secrets
    if ($?) {
        Write-Host "✅ Secrets set successfully!" -ForegroundColor Green
        Write-Host "Please try signing up again." -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set secrets. Make sure you are logged in (supabase login) and linked (supabase link)." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error executing supabase command: $_" -ForegroundColor Red
}
