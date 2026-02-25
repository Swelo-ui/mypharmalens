-- ============================================================================
-- Free Claim Tokens table for GPLinks ad-based free identification system
-- Users earn +1 extra_identification by clicking ad-supported short links
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.free_claim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  short_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(45)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_free_claim_tokens_user_id ON public.free_claim_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_free_claim_tokens_token ON public.free_claim_tokens(token);
CREATE INDEX IF NOT EXISTS idx_free_claim_tokens_status ON public.free_claim_tokens(status);
CREATE INDEX IF NOT EXISTS idx_free_claim_tokens_created_at ON public.free_claim_tokens(created_at DESC);

-- Auto-update trigger (not needed here since we don't have updated_at, but keeping pattern consistent)

-- Enable RLS
ALTER TABLE public.free_claim_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own claim tokens (for UI tracking)
CREATE POLICY "Users can view own claim tokens"
  ON public.free_claim_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service_role (edge function) can insert/update claim tokens
CREATE POLICY "Service role has full access to claim tokens"
  ON public.free_claim_tokens
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.free_claim_tokens IS 'Tracks GPLinks ad-based free identification claims';
COMMENT ON COLUMN public.free_claim_tokens.token IS 'Random secure token for verifying claim completion';
COMMENT ON COLUMN public.free_claim_tokens.status IS 'pending = waiting for ad click, claimed = bonus credited, expired = timed out';
COMMENT ON COLUMN public.free_claim_tokens.short_url IS 'GPLinks shortened URL the user clicks';
COMMENT ON COLUMN public.free_claim_tokens.expires_at IS 'Token expires 10 minutes after creation';

-- ============================================================================
-- Function: get_daily_claim_count
-- Returns how many claims a user has successfully made today
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_daily_claim_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claim_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO claim_count
  FROM public.free_claim_tokens
  WHERE user_id = p_user_id
    AND status = 'claimed'
    AND claimed_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata');
  
  RETURN COALESCE(claim_count, 0);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_daily_claim_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_claim_count(UUID) TO service_role;

COMMENT ON FUNCTION public.get_daily_claim_count IS 'Returns the number of free claims a user has made today (IST timezone)';

-- ============================================================================
-- Function: cleanup_expired_claim_tokens
-- Marks expired pending tokens as 'expired' (can be called periodically)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_claim_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.free_claim_tokens
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_claim_tokens() TO service_role;

COMMENT ON FUNCTION public.cleanup_expired_claim_tokens IS 'Cleans up expired pending claim tokens';
