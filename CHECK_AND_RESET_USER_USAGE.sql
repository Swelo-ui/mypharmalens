-- ================================================
-- CHECK AND RESET USER USAGE FOR TESTING
-- Use this if free plan user has >5 identifications
-- ================================================

-- Step 1: Find your test user
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email LIKE '%test%'
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check user's profile usage
-- Replace 'USER_ID_HERE' with actual user ID from Step 1
SELECT 
  id,
  identifications_used,
  last_reset_date,
  monthly_identifications,
  created_at
FROM profiles
WHERE id = 'USER_ID_HERE';

-- Step 3: Check user's active subscription
SELECT 
  us.id,
  us.user_id,
  us.plan_id,
  us.status,
  us.starts_at,
  us.ends_at,
  sp.name AS plan_name,
  sp.monthly_identifications
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = 'USER_ID_HERE'
AND us.status = 'active'
ORDER BY us.created_at DESC;

-- Step 4: Reset usage to 0 for testing (if needed)
-- Replace 'USER_ID_HERE' with actual user ID
UPDATE profiles
SET 
  identifications_used = 0,
  last_reset_date = NOW()
WHERE id = 'USER_ID_HERE';

-- Step 5: Verify reset
SELECT 
  id,
  identifications_used,
  last_reset_date
FROM profiles
WHERE id = 'USER_ID_HERE';

-- ================================================
-- DEBUGGING: Check if limits are enforced
-- ================================================

-- Check all free plan users with high usage
SELECT 
  p.id,
  u.email,
  p.identifications_used,
  p.monthly_identifications,
  us.plan_id,
  sp.name AS plan_name
FROM profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN user_subscriptions us ON p.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE 
  (us.plan_id = 'free-plan' OR us.plan_id IS NULL)
  AND p.identifications_used > 5
ORDER BY p.identifications_used DESC;

-- ================================================
-- VERIFICATION: Check drug identifications history
-- ================================================

-- See recent identifications for a user
-- Replace 'USER_ID_HERE' with actual user ID
SELECT 
  id,
  user_id,
  drug_name,
  created_at,
  confidence_score
FROM drug_identifications
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC
LIMIT 20;

-- Count identifications per user this month
SELECT 
  user_id,
  COUNT(*) AS total_identifications,
  MAX(created_at) AS last_identification
FROM drug_identifications
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY user_id
HAVING COUNT(*) > 5
ORDER BY total_identifications DESC;

-- ================================================
-- FIX: Ensure all free users have correct limits
-- ================================================

-- Update all profiles on free plan to have correct monthly limit
UPDATE profiles p
SET monthly_identifications = 5
FROM user_subscriptions us
WHERE p.id = us.user_id
AND us.plan_id = 'free-plan'
AND us.status = 'active'
AND (p.monthly_identifications IS NULL OR p.monthly_identifications != 5);

-- Verify
SELECT 
  p.id,
  p.identifications_used,
  p.monthly_identifications,
  us.plan_id
FROM profiles p
JOIN user_subscriptions us ON p.id = us.user_id
WHERE us.plan_id = 'free-plan'
AND us.status = 'active'
LIMIT 10;

-- ================================================
-- TESTING HELPER: Create test user with specific usage
-- ================================================

-- Set a test user to exactly 4/5 identifications
-- Replace 'USER_ID_HERE' with actual user ID
UPDATE profiles
SET 
  identifications_used = 4,
  monthly_identifications = 5,
  last_reset_date = NOW()
WHERE id = 'USER_ID_HERE';

-- Then test: should allow 1 more, block at 5

-- ================================================
-- SUCCESS MESSAGE
-- ================================================
SELECT '✅ Run queries above to check and fix user usage data' AS status;
