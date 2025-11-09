-- Add UPDATE policy for topup_transactions so users can update their own transactions
-- This is needed for updating razorpay_order_id and payment details from frontend

-- Users can update their own topup transactions (for adding payment details)
CREATE POLICY "Users can update own topup transactions"
  ON public.topup_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also add a comment explaining this
COMMENT ON POLICY "Users can update own topup transactions" ON public.topup_transactions IS 
'Allows users to update their own topup transactions with Razorpay payment details after order creation';
