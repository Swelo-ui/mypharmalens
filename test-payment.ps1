$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjc2h5ZHJ1c251eHN4d2N0bm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTEzNzIsImV4cCI6MjA1NzU4NzM3Mn0.eLmaLDHcy1yAu_eRpPsds6sab8MiU1wBopO20NJAzF4"
    "Content-Type" = "application/json"
}

$body = @{
    userId = "01cb4ceb-2048-4986-b6f4-be7fc9ed5d80"
    planId = "monthly-premium-plan"
    amount = 999
    billingCycle = "monthly"
    userEmail = "test@example.com"
    userName = "Test User"
} | ConvertTo-Json

$uri = "https://vcshydrusnuxsxwctnod.supabase.co/functions/v1/payu-payment"

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response: $responseBody"
    }
}