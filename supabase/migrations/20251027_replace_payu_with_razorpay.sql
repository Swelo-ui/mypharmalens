-- Switch payment_transactions to Razorpay and remove PayU-specific columns
ALTER TABLE IF EXISTS payment_transactions
    ALTER COLUMN payment_method SET DEFAULT 'razorpay';

-- Drop PayU columns
ALTER TABLE IF EXISTS payment_transactions
    DROP COLUMN IF EXISTS payu_payment_id,
    DROP COLUMN IF EXISTS payu_response;

-- Ensure Razorpay columns exist
ALTER TABLE IF EXISTS payment_transactions
    ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_response JSONB;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order_id
    ON payment_transactions(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_payment_id
    ON payment_transactions(razorpay_payment_id);

-- Migrate existing rows: set payment_method to razorpay where PayU used previously
UPDATE payment_transactions SET payment_method = 'razorpay' WHERE payment_method = 'payu';

