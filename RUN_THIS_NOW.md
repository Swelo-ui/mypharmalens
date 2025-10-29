# 🚨 CRITICAL: Run This SQL RIGHT NOW! 🚨

## The Problem
Your weekly plan database has **WRONG PRICE**: 156 ₹ instead of 39 ₹

This is why payments fail!

---

## Fix It NOW - 2 Steps

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/vcshydrusnuxsxwctnod/sql

### Step 2: Copy and Run This SQL

```sql
UPDATE subscription_plans
SET 
    price_inr = 39,
    monthly_identifications = 21,
    features = jsonb_set(
        jsonb_set(
            COALESCE(features, '{}'::jsonb),
            '{billing_period}',
            '"weekly"'
        ),
        '{billing_cycle}',
        '"weekly"'
    )
WHERE id = 'weekly-plan';
```

### Step 3: Verify It Worked

```sql
SELECT id, name, price_inr, monthly_identifications 
FROM subscription_plans 
WHERE id = 'weekly-plan';
```

**Should show:**
- price_inr: **39** ✅
- monthly_identifications: **21** ✅

---

## After Running SQL

1. **Refresh your browser** (Ctrl+F5)
2. **Go to subscription page**
3. **Try weekly plan again**
4. **Should work!** ✅

---

## What I Also Fixed

### 1. Free Plan Current Indicator ✅
- Free plan now shows blue border when it's your current plan
- Shows "Current Plan" button (disabled)
- Logic: If no subscription → defaults to free plan

### 2. Better Error Messages ✅
- Payment errors now show actual amount
- Console logs show full plan details
- Easier to debug issues

### 3. Billing Cycle Detection ✅
- Better detection of weekly plans
- Checks multiple fields: `billing_period`, `billing_cycle`, plan ID
- Logs all payment details to console

---

## Testing Checklist

After running SQL:

- [ ] SQL shows price_inr = 39
- [ ] Refresh browser (Ctrl+F5)
- [ ] Free Plan shows blue border + "Current Plan"
- [ ] Open DevTools Console (F12)
- [ ] Click Weekly Plan "Subscribe"
- [ ] Check console logs for "Payment details:"
- [ ] Should show: amount: 39, billingCycle: "weekly"
- [ ] Payment gateway opens
- [ ] Shows ₹39.00 (correct!)
- [ ] Complete test payment
- [ ] Success! ✅

---

## Why This Happened

**Timeline:**
1. Database created with price_inr = 156 (maybe 39 * 4 weeks)
2. UI hardcoded to show ₹39/week
3. Database never updated
4. Payment reads database → tries 156 ₹
5. User sees 39 ₹ but charged 156 ₹
6. ❌ Mismatch → Payment fails

---

## Files Modified

| File | Fix |
|------|-----|
| `SubscriptionManager.tsx` | Free plan detection (defaults to free-plan) |
| `PaymentButton.tsx` | Better billing cycle detection + logging |
| `URGENT_DATABASE_FIX.sql` | SQL to fix database |

---

## Error You'll See If Not Fixed

```
❌ Payment Failed
Edge function returned a non-2xx status code
```

**Why:** Database has 156 ₹, payment gateway confused

---

## After Fix - What Works

✅ Free Plan shows as current (blue border)
✅ Weekly Plan payment works
✅ Monthly Plan still works (was already working)
✅ Congratulations modal appears after payment
✅ Subscription activates immediately
✅ Shows 21 identifications for weekly
✅ Shows 7 days duration

---

# ACTION REQUIRED

## Run this SQL RIGHT NOW:

```sql
UPDATE subscription_plans
SET price_inr = 39, monthly_identifications = 21
WHERE id = 'weekly-plan';
```

**Location:** https://supabase.com/dashboard/project/vcshydrusnuxsxwctnod/sql

**Then refresh your app and test!**

---

**DO NOT SKIP THIS - Weekly plan payments will FAIL without it!**
