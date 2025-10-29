-- ========================================
-- COMPREHENSIVE FIX FOR ALL SUBSCRIPTION ISSUES
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Allow 'weekly' billing cycle in payment_transactions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_transactions_billing_cycle_check'
  ) THEN
    ALTER TABLE payment_transactions
      DROP CONSTRAINT payment_transactions_billing_cycle_check;
  END IF;
END$$;

ALTER TABLE payment_transactions
  ADD CONSTRAINT payment_transactions_billing_cycle_check
  CHECK (billing_cycle IN ('weekly','monthly','yearly'));

-- 2. Allow 'weekly' billing cycle in subscription_history
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscription_history_billing_cycle_check'
  ) THEN
    ALTER TABLE subscription_history
      DROP CONSTRAINT subscription_history_billing_cycle_check;
  END IF;
END$$;

ALTER TABLE subscription_history
  ADD CONSTRAINT subscription_history_billing_cycle_check
  CHECK (billing_cycle IN ('weekly','monthly','yearly'));

-- 3. Verify the constraints were updated
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN (
  'payment_transactions_billing_cycle_check',
  'subscription_history_billing_cycle_check'
);

-- 4. Check subscription_plans table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 5. If weekly plan exists, ensure correct pricing
-- (Adjust the WHERE clause based on your actual plan ID)
UPDATE subscription_plans
SET 
  price = 39,
  monthly_identifications = 21
WHERE 
  (id = 'weekly-plan' OR name ILIKE '%weekly%')
  AND price != 39;

-- 6. Verify plan data
SELECT 
  id,
  name,
  price,
  billing_period,
  monthly_identifications,
  is_active
FROM subscription_plans
ORDER BY price;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if weekly payments exist and their status
SELECT 
  pt.transaction_id,
  pt.plan_id,
  pt.billing_cycle,
  pt.amount,
  pt.status,
  pt.created_at
FROM payment_transactions pt
WHERE pt.billing_cycle = 'weekly'
ORDER BY pt.created_at DESC
LIMIT 5;

-- Check active subscriptions by billing cycle
SELECT 
  us.user_id,
  us.plan_id,
  us.status,
  sp.name,
  sp.billing_period,
  us.starts_at,
  us.ends_at
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active'
ORDER BY us.created_at DESC
LIMIT 10;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ All constraints updated successfully! Weekly plan payments should now work.' AS status;
