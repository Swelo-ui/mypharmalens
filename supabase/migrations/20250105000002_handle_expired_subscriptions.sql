-- Migration: Handle Expired Subscriptions Automatically
-- This migration creates:
-- 1. A function to check and handle expired subscriptions
-- 2. A trigger that runs on subscription reads
-- 3. Proper status management for expired subscriptions

-- Function to handle expired subscriptions
CREATE OR REPLACE FUNCTION handle_expired_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Only process if subscription is currently active and has an end date
  IF NEW.status = 'active' AND NEW.ends_at IS NOT NULL AND NEW.plan_id != 'free-plan' THEN
    -- Check if subscription has expired
    IF NEW.ends_at < v_now THEN
      -- Mark subscription as expired
      NEW.status := 'expired';
      
      -- Reset user's identification usage
      UPDATE profiles
      SET 
        identifications_used = 0,
        last_reset_date = v_now,
        monthly_identifications = 5
      WHERE id = NEW.user_id;
      
      -- Ensure user has a free plan
      INSERT INTO user_subscriptions (user_id, plan_id, status, starts_at, ends_at)
      VALUES (NEW.user_id, 'free-plan', 'active', v_now, NULL)
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Subscription % expired for user %', NEW.id, NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that checks expiration on every read/update
DROP TRIGGER IF EXISTS check_subscription_expiry ON user_subscriptions;
CREATE TRIGGER check_subscription_expiry
  BEFORE INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_expired_subscription();

-- Function to batch update all expired subscriptions (for manual/scheduled runs)
CREATE OR REPLACE FUNCTION batch_expire_subscriptions()
RETURNS TABLE (
  expired_count INTEGER,
  user_ids TEXT[]
) AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_expired_count INTEGER;
  v_user_ids TEXT[];
BEGIN
  -- Get all expired subscription user IDs
  SELECT ARRAY_AGG(DISTINCT user_id::TEXT)
  INTO v_user_ids
  FROM user_subscriptions
  WHERE status = 'active'
    AND plan_id != 'free-plan'
    AND ends_at IS NOT NULL
    AND ends_at < v_now;
  
  -- Update expired subscriptions
  UPDATE user_subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND plan_id != 'free-plan'
    AND ends_at IS NOT NULL
    AND ends_at < v_now;
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Reset usage for affected users
  IF v_user_ids IS NOT NULL THEN
    UPDATE profiles
    SET 
      identifications_used = 0,
      last_reset_date = v_now,
      monthly_identifications = 5
    WHERE id = ANY(v_user_ids::UUID[]);
    
    -- Ensure all affected users have free plans
    INSERT INTO user_subscriptions (user_id, plan_id, status, starts_at, ends_at)
    SELECT 
      unnest(v_user_ids::UUID[]),
      'free-plan',
      'active',
      v_now,
      NULL
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN QUERY SELECT v_expired_count, v_user_ids;
END;
$$ LANGUAGE plpgsql;

-- Create an index to speed up expiry checks
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_expiry 
ON user_subscriptions(status, ends_at) 
WHERE status = 'active' AND ends_at IS NOT NULL;

-- Run the batch expiration immediately to fix existing expired subscriptions
SELECT * FROM batch_expire_subscriptions();

COMMENT ON FUNCTION handle_expired_subscription() IS 'Automatically marks subscriptions as expired and moves users to free plan';
COMMENT ON FUNCTION batch_expire_subscriptions() IS 'Batch process to expire all active subscriptions past their end date';
