-- ============================================================================
-- Fix: get_daily_claim_count - Reset at midnight IST (Asia/Kolkata)
-- The previous version used CURRENT_DATE AT TIME ZONE which could cause
-- comparison type mismatches. This fix properly computes the IST midnight
-- boundary and resets daily claim counts at 12:00 AM IST each day.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_daily_claim_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claim_count INTEGER;
  ist_midnight TIMESTAMPTZ;
BEGIN
  -- Compute the start of today (midnight) in IST (Asia/Kolkata = UTC+5:30)
  -- date_trunc gives the truncated date in IST, then we convert back to UTC for storage comparison
  ist_midnight := date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';

  SELECT COUNT(*)::INTEGER INTO claim_count
  FROM public.free_claim_tokens
  WHERE user_id = p_user_id
    AND status = 'claimed'
    AND claimed_at >= ist_midnight;

  RETURN COALESCE(claim_count, 0);
END;
$$;

-- Refresh grants
GRANT EXECUTE ON FUNCTION public.get_daily_claim_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_claim_count(UUID) TO service_role;

COMMENT ON FUNCTION public.get_daily_claim_count IS 
  'Returns the number of free claims a user has made since midnight IST (Asia/Kolkata). Resets at 12:00 AM IST every day.';
