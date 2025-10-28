# Razorpay Test Integration Guide for PharmaLens

## 🚀 Quick Setup Steps

### 1. Get Razorpay Test API Keys

1. **Login to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Switch to Test Mode**: Toggle the "Test Mode" switch in the top-right corner
3. **Generate API Keys**:
   - Go to Settings → API Keys
   - Click "Generate Test Key"
   - Copy both `Key ID` and `Key Secret`

### 2. Set Environment Variables in Supabase

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Edge Functions → Settings
3. Add these environment variables:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=https://pharmalens.tech
```

#### Option B: Using CLI (Run setup-supabase-cli.ps1)
```powershell
# Install Supabase CLI first
npm install -g supabase

# Run the setup script
.\setup-supabase-cli.ps1
```

### 3. Test Cards for Payment Testing

Use these test cards in Test Mode:

| Card Network | Card Number | Type |
|-------------|-------------|------|
| Visa | 4111 1111 1111 1111 | Success |
| Visa | 4012 8888 8888 1881 | Success |
| Mastercard | 5555 5555 5555 4444 | Success |
| Mastercard | 5267 3181 8797 5449 | Domestic |

**CVV**: Any 3-digit number  
**Expiry**: Any future date  
**Name**: Any name

### 4. Test UPI IDs

- `success@razorpay` - For successful payments
- `failure@razorpay` - For failed payments

### 5. Webhook Configuration

1. In Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/razorpay-webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Set webhook secret and update `RAZORPAY_WEBHOOK_SECRET`

## 🧪 Testing Flow

### Test Payment Process:
1. **Create Order**: Frontend calls `/razorpay-order` Edge Function
2. **Payment UI**: Razorpay Checkout opens with test keys
3. **Test Payment**: Use test cards or UPI IDs above
4. **Webhook**: Razorpay sends webhook to `/razorpay-webhook`
5. **Database Update**: Payment status updated in Supabase

### Verification Checklist:
- [ ] Test Mode enabled in Razorpay Dashboard
- [ ] All environment variables set in Supabase
- [ ] Edge Functions deployed successfully
- [ ] Webhook URL configured in Razorpay
- [ ] Test payment completes successfully
- [ ] Database records updated correctly

## 🔧 Troubleshooting

### Common Issues:

1. **"Edge Function returned a non-2xx status code"**
   - Check environment variables are set
   - Verify API keys are for Test Mode
   - Check Edge Function logs in Supabase

2. **Payment fails immediately**
   - Ensure using test cards/UPI IDs
   - Verify Test Mode is enabled
   - Check amount is above minimum (₹1)

3. **Webhook not received**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Ensure events are selected in Razorpay

### Debug Commands:
```bash
# Check Edge Function logs
supabase functions logs razorpay-order

# Test webhook locally
curl -X POST https://your-project.supabase.co/functions/v1/razorpay-webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test_signature" \
  -d '{"event": "payment.captured"}'
```

## 📝 Important Notes

- **No Real Money**: Test Mode uses simulated transactions
- **Separate Keys**: Test and Live modes have different API keys
- **Webhook Testing**: Use Razorpay's webhook simulator for testing
- **Amount Limits**: Minimum ₹1 for test transactions
- **Card Validation**: Test cards skip 3DS/OTP flows

## 🌐 Production Deployment

When ready for production:
1. Switch to Live Mode in Razorpay Dashboard
2. Generate Live API keys
3. Update environment variables with Live keys
4. Test with small real transactions
5. Update webhook URL if domain changes

---

**Need Help?** Check Razorpay docs: https://razorpay.com/docs/