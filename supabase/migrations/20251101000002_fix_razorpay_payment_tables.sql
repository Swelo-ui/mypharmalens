-- Fix payment_transactions table for Razorpay support
-- Add Razorpay-specific columns
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_response JSONB;

-- Update billing_cycle constraint to include 'weekly'
ALTER TABLE payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_billing_cycle_check;

ALTER TABLE payment_transactions 
ADD CONSTRAINT payment_transactions_billing_cycle_check 
CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly'));

-- Update subscription_history billing_cycle constraint
ALTER TABLE subscription_history 
DROP CONSTRAINT IF EXISTS subscription_history_billing_cycle_check;

ALTER TABLE subscription_history 
ADD CONSTRAINT subscription_history_billing_cycle_check 
CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly'));

-- Add indexes for Razorpay fields
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order_id 
ON payment_transactions(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_payment_id 
ON payment_transactions(razorpay_payment_id);

-- Update payment_method to support razorpay
ALTER TABLE payment_transactions 
ALTER COLUMN payment_method SET DEFAULT 'razorpay';

COMMENT ON COLUMN payment_transactions.razorpay_order_id IS 'Razorpay order ID from order creation';
COMMENT ON COLUMN payment_transactions.razorpay_payment_id IS 'Razorpay payment ID from successful payment';
COMMENT ON COLUMN payment_transactions.razorpay_signature IS 'Razorpay signature for verification';
COMMENT ON COLUMN payment_transactions.razorpay_response IS 'Full Razorpay webhook response payload';
