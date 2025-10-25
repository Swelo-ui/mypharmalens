# Complete Subscription Flow Test
# Flow: fetch PayU config -> activate subscription

$ErrorActionPreference = 'Stop'

# Configuration
$baseUrl = 'https://vcshydrusnuxsxwctnod.supabase.co/functions/v1'
$headers = @{
  'Content-Type' = 'application/json'
  'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjc2h5ZHJ1c251eHN4d2N0bm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTEzNzIsImV4cCI6MjA1NzU4NzM3Mn0.eLmaLDHcy1yAu_eRpPsds6sab8MiU1wBopO20NJAzF4'
  'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjc2h5ZHJ1c251eHN4d2N0bm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTEzNzIsImV4cCI6MjA1NzU4NzM3Mn0.eLmaLDHcy1yAu_eRpPsds6sab8MiU1wBopO20NJAzF4'
}

# Static test values (choose consistent IDs so we can verify later)
$userId = '9c8a86dd-f1ff-44f0-806a-8ddeefb795e7'
$planId = 'monthly-premium-plan'
$billingCycle = 'monthly'
$transactionId = "txn-$(Get-Date -Format 'yyyyMMddHHmmss')-" + ([guid]::NewGuid().ToString().Substring(0,8))

function Write-Step($msg) {
  Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

function Invoke-JsonPost($url, $body) {
  $json = $body | ConvertTo-Json -Depth 8
  try {
    return Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $json
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.GetResponseStream()) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $text = $reader.ReadToEnd()
      Write-Host "HTTP error body:" $text -ForegroundColor Yellow
    }
    throw
  }
}

try {
  Write-Step 'PayU config: requesting'
  $payu = Invoke-JsonPost "$baseUrl/payu-config" @{}
  Write-Host "Environment:" ($payu.environment) -ForegroundColor Gray
  if ($payu.endpoints) { Write-Host "Base URL:" ($payu.endpoints.base) -ForegroundColor Gray }

  Write-Step 'Subscription activation: posting'
  $activateBody = @{
    action = 'activate'
    userId = $userId
    planId = $planId
    billingCycle = $billingCycle
    transactionId = $transactionId
  }
  $activate = Invoke-JsonPost "$baseUrl/subscription-manager" $activateBody
  Write-Host "Response success:" $activate.success -ForegroundColor Green

  if ($activate.success -ne $true) {
    Write-Host "Activation failed:" ($activate.error) -ForegroundColor Red
    if ($activate.details) { Write-Host ($activate.details | ConvertTo-Json -Depth 8) }
    exit 1
  }

  Write-Step 'Activated subscription summary'
  $sub = $activate.subscription
  if ($null -ne $sub) {
    Write-Host ("user_id={0} plan_id={1} status={2}" -f $sub.user_id, $sub.plan_id, $sub.status)
    Write-Host ("starts_at={0} ends_at={1} billing_cycle={2}" -f $sub.starts_at, $sub.ends_at, $sub.billing_cycle)
    Write-Host ("transaction_id={0}" -f $sub.transaction_id)
    Write-Host ("created_at={0} updated_at={1}" -f $sub.created_at, $sub.updated_at)
  } else {
    Write-Host "No subscription object returned" -ForegroundColor Yellow
  }

  Write-Step 'Test complete'
  Write-Host ("UserId={0} TransactionId={1}" -f $userId, $transactionId) -ForegroundColor Cyan

} catch {
  Write-Host "Script error:" $_.Exception.Message -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  exit 1
}
