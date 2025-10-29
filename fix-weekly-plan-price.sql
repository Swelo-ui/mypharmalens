-- Fix Weekly Plan Price and Configuration
-- This fixes the payment gateway error for weekly plans

UPDATE subscription_plans
SET 
    price_inr = 39,
    monthly_identifications = 21,
    features = jsonb_set(
        jsonb_set(
            jsonb_set(
                features,
                '{ai_identifications}',
                '21'
            ),
            '{billing_period}',
            '"weekly"'
        ),
        '{duration_days}',
        '7'
    )
WHERE id = 'weekly-plan';

-- Verify the update
SELECT 
    id,
    name,
    price_inr,
    monthly_identifications,
    features->>'billing_period' as billing_period,
    features->>'ai_identifications' as ai_identifications,
    features->>'duration_days' as duration_days
FROM subscription_plans
WHERE id = 'weekly-plan';
