-- Check the actual structure of subscription_plans table
-- Run this first to see what columns exist

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;
