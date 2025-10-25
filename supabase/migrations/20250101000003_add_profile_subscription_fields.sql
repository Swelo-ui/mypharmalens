-- Add subscription-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(255) DEFAULT 'free-plan',
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Update existing profiles with default subscription plan
UPDATE profiles 
SET subscription_plan = 'free-plan'
WHERE subscription_plan IS NULL;