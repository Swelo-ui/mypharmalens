-- Create topup_transactions table for identification pack purchases
-- This is separate from payment_transactions which is for subscriptions only

CREATE TABLE IF NOT EXISTS public.topup_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id VARCHAR(255) NOT NULL,
  pack_name VARCHAR(255),
  identifications_count INTEGER NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled')),
  payment_method VARCHAR(50) DEFAULT 'razorpay',
  payment_gateway VARCHAR(50) DEFAULT 'razorpay',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  razorpay_response JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_topup_transactions_user_id ON public.topup_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_topup_transactions_transaction_id ON public.topup_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_topup_transactions_razorpay_order_id ON public.topup_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_topup_transactions_razorpay_payment_id ON public.topup_transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_topup_transactions_status ON public.topup_transactions(status);
CREATE INDEX IF NOT EXISTS idx_topup_transactions_created_at ON public.topup_transactions(created_at DESC);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_topup_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_topup_transactions_updated_at
  BEFORE UPDATE ON public.topup_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_topup_transactions_updated_at();

-- Enable RLS
ALTER TABLE public.topup_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topup_transactions
-- Users can view their own topup transactions
CREATE POLICY "Users can view own topup transactions"
  ON public.topup_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own topup transactions
CREATE POLICY "Users can create own topup transactions"
  ON public.topup_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for webhook updates)
CREATE POLICY "Service role has full access to topup transactions"
  ON public.topup_transactions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE public.topup_transactions IS 'Stores top-up identification pack purchase transactions';
COMMENT ON COLUMN public.topup_transactions.transaction_id IS 'Unique transaction identifier';
COMMENT ON COLUMN public.topup_transactions.pack_id IS 'Identification pack ID purchased';
COMMENT ON COLUMN public.topup_transactions.identifications_count IS 'Number of identifications in the pack';
COMMENT ON COLUMN public.topup_transactions.razorpay_order_id IS 'Razorpay order ID';
COMMENT ON COLUMN public.topup_transactions.razorpay_payment_id IS 'Razorpay payment ID';
COMMENT ON COLUMN public.topup_transactions.razorpay_signature IS 'Razorpay signature for verification';
COMMENT ON COLUMN public.topup_transactions.razorpay_response IS 'Full Razorpay webhook response';

-- Create table for tracking user identification pack purchases (history)
CREATE TABLE IF NOT EXISTS public.user_identification_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id VARCHAR(255) NOT NULL,
  pack_name VARCHAR(255),
  identifications_added INTEGER NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_identification_purchases_user_id 
  ON public.user_identification_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_identification_purchases_created_at 
  ON public.user_identification_purchases(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_identification_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own purchase history"
  ON public.user_identification_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchase history"
  ON public.user_identification_purchases
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add extra_identifications column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'extra_identifications'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN extra_identifications INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create or replace function to increment extra identifications
CREATE OR REPLACE FUNCTION public.increment_extra_identifications(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET extra_identifications = COALESCE(extra_identifications, 0) + p_amount
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_extra_identifications(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_extra_identifications(UUID, INTEGER) TO service_role;

COMMENT ON FUNCTION public.increment_extra_identifications IS 'Increments the extra_identifications count for a user';
