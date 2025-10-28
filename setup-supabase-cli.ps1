# Install Supabase CLI
Write-Host "Installing Supabase CLI..." -ForegroundColor Green
npm install -g supabase

# Login to Supabase (you'll need to authenticate)
Write-Host "Please login to Supabase..." -ForegroundColor Yellow
supabase login

# Set environment variables for Edge Functions
Write-Host "Setting up environment variables..." -ForegroundColor Green

# Your actual Razorpay credentials
$RAZORPAY_KEY_ID = "rzp_test_RYXWZHkoxc6ArF"
$RAZORPAY_KEY_SECRET = "CFFxw2eU0hTp1yGVbjPwjP5P"
$RAZORPAY_WEBHOOK_SECRET = "Gokuvegitatonystark@213Webhook"
$SUPABASE_URL = "https://your-project.supabase.co"  # Your Supabase URL
$SUPABASE_SERVICE_ROLE_KEY = "your_service_role_key"  # Your service role key
$APP_URL = "https://pharmalens.tech"  # Your app URL

# Set secrets using Supabase CLI
supabase secrets set RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
supabase secrets set RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET
supabase secrets set RAZORPAY_WEBHOOK_SECRET=$RAZORPAY_WEBHOOK_SECRET
supabase secrets set SUPABASE_URL=$SUPABASE_URL
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
supabase secrets set APP_URL=$APP_URL

Write-Host "Environment variables set successfully!" -ForegroundColor Green

# Deploy Edge Functions
Write-Host "Deploying Edge Functions..." -ForegroundColor Green
supabase functions deploy razorpay-order
supabase functions deploy razorpay-webhook

Write-Host "Setup complete!" -ForegroundColor Green