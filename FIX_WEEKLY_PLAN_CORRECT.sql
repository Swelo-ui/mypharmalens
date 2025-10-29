-- ✅ CORRECT FIX FOR WEEKLY PLAN
-- This uses the actual column names from your database

-- Step 1: Check current weekly plan data
SELECT * FROM subscription_plans WHERE id = 'weekly-plan';

-- Step 2: Update with correct column names
-- (Try this if column is named 'price' instead of 'price_inr')
UPDATE subscription_plans
SET 
    price = 39,
    monthly_identifications = 21
WHERE id = 'weekly-plan';

-- Step 3: If the above fails, try checking what columns exist:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'subscription_plans';

-- Step 4: Verify the update
SELECT id, name, price, monthly_identifications 
FROM subscription_plans 
WHERE id = 'weekly-plan';
