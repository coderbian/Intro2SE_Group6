# Deploy Email Invitation Function
# This script deploys the send-invitation-email Edge Function to Supabase

Write-Host "🚀 Deploying Email Invitation Function..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✓ Supabase CLI installed: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI not installed!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
Write-Host ""
Write-Host "Checking Supabase authentication..." -ForegroundColor Cyan
$status = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Not logged in to Supabase!" -ForegroundColor Red
    Write-Host "Run: supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Authenticated" -ForegroundColor Green

# Check required secrets
Write-Host ""
Write-Host "Checking required secrets..." -ForegroundColor Cyan
$secrets = supabase secrets list 2>&1

$hasResendKey = $secrets -match "RESEND_API_KEY"
$hasAppUrl = $secrets -match "APP_URL"

if (-not $hasResendKey) {
    Write-Host "⚠ RESEND_API_KEY not set!" -ForegroundColor Yellow
    Write-Host "Set it with: supabase secrets set RESEND_API_KEY=re_xxxxx" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") { exit 1 }
} else {
    Write-Host "✓ RESEND_API_KEY configured" -ForegroundColor Green
}

if (-not $hasAppUrl) {
    Write-Host "⚠ APP_URL not set!" -ForegroundColor Yellow
    Write-Host "Set it with: supabase secrets set APP_URL=http://localhost:5173" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") { exit 1 }
} else {
    Write-Host "✓ APP_URL configured" -ForegroundColor Green
}

# Deploy function
Write-Host ""
Write-Host "Deploying send-invitation-email function..." -ForegroundColor Cyan
supabase functions deploy send-invitation-email

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test the function with: npm run test:email" -ForegroundColor White
    Write-Host "2. Check logs with: supabase functions logs send-invitation-email" -ForegroundColor White
    Write-Host "3. Send a test invitation from the app" -ForegroundColor White
    Write-Host ""
    Write-Host "📧 Email template preview: EMAIL_INVITATION_SETUP.md" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    Write-Host "Check errors above and try again" -ForegroundColor Yellow
    exit 1
}
