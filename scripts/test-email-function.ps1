# Test Email Invitation Function
# This script sends a test email to verify the Edge Function is working

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [string]$Name = "Test User",
    [string]$InviterName = "Admin",
    [string]$ProjectName = "Test Project"
)

Write-Host "📧 Testing Email Invitation Function..." -ForegroundColor Cyan
Write-Host ""

# Get Supabase URL and Anon Key
$supabaseUrl = Read-Host "Enter your Supabase URL (e.g., https://xxx.supabase.co)"
$anonKey = Read-Host "Enter your Supabase Anon Key"

if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($anonKey)) {
    Write-Host "✗ Supabase URL and Anon Key are required!" -ForegroundColor Red
    exit 1
}

# Prepare test data
$testData = @{
    inviteeEmail = $Email
    inviteeName = $Name
    inviterName = $InviterName
    projectName = $ProjectName
    projectId = "00000000-0000-0000-0000-000000000000"
    invitationId = "00000000-0000-0000-0000-000000000000"
} | ConvertTo-Json

$functionUrl = "$supabaseUrl/functions/v1/send-invitation-email"

Write-Host "Sending test email to: $Email" -ForegroundColor Yellow
Write-Host "Function URL: $functionUrl" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $functionUrl -Method Post `
        -Headers @{
            "Authorization" = "Bearer $anonKey"
            "Content-Type" = "application/json"
        } `
        -Body $testData

    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5 | Write-Host
    Write-Host ""
    Write-Host "📬 Check the inbox of: $Email" -ForegroundColor Yellow
    Write-Host "Don't forget to check spam folder!" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Error sending email!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Cyan
    Write-Host "1. RESEND_API_KEY not configured" -ForegroundColor White
    Write-Host "2. Edge Function not deployed" -ForegroundColor White
    Write-Host "3. Invalid Supabase credentials" -ForegroundColor White
    Write-Host ""
    Write-Host "Check logs with: supabase functions logs send-invitation-email" -ForegroundColor Gray
    exit 1
}
