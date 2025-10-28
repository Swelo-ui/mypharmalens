-- Add Razorpay-specific fields to payment_transactions
ALTER TABLE IF EXISTS payment_transactions
    ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_response JSONB;

-- Optional: add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order_id
    ON payment_transactions(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_payment_id
    ON payment_transactions(razorpay_payment_id);

-- Keep payment_method flexible; do not change default here.
-- Values used: 'razorpay', 'payu'

