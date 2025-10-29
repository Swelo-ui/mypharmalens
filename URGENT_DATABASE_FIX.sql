-- ⚠️ CRITICAL FIX FOR WEEKLY PLAN PAYMENT ISSUE ⚠️
-- Run this IMMEDIATELY in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vcshydrusnuxsxwctnod/sql

-- Step 1: Check current weekly plan configuration
SELECT 
    id,
    name,
    price_inr AS current_price,
    monthly_identifications,
    features->>'billing_period' as billing_period,
    features->>'billing_cycle' as billing_cycle
FROM subscription_plans
WHERE id = 'weekly-plan';

-- Step 2: Update weekly plan with correct values
UPDATE subscription_plans
SET 
    price_inr = 39,
    monthly_identifications = 21,
    features = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    COALESCE(features, '{}'::jsonb),
                    '{billing_period}',
                    '"weekly"'
                ),
                '{billing_cycle}',
                '"weekly"'
            ),
            '{duration_days}',
            '7'
        ),
        '{ai_identifications}',
        '21'
    )
WHERE id = 'weekly-plan';

-- Step 3: Verify the fix
SELECT 
    id,
    name,
    price_inr AS updated_price,
    monthly_identifications,
    features->>'billing_period' as billing_period,
    features->>'billing_cycle' as billing_cycle,
    features->>'duration_days' as duration_days,
    features->>'ai_identifications' as ai_identifications
FROM subscription_plans
WHERE id = 'weekly-plan';

-- Expected output:
-- id: weekly-plan
-- updated_price: 39
-- monthly_identifications: 21
-- billing_period: weekly
-- billing_cycle: weekly
-- duration_days: 7
-- ai_identifications: 21

-- Step 4: Check if any users tried to pay with wrong price
SELECT 
    user_id,
    plan_id,
    amount,
    status,
    created_at
FROM payment_transactions
WHERE plan_id = 'weekly-plan'
AND amount > 50
ORDER BY created_at DESC
LIMIT 10;

-- If any found, contact those users!
