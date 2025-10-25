-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    payment_method VARCHAR(50) DEFAULT 'payu',
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
    payu_payment_id VARCHAR(255),
    payu_response JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('activated', 'renewed', 'cancelled', 'expired', 'upgraded', 'downgraded')),
    transaction_id VARCHAR(255) REFERENCES payment_transactions(transaction_id),
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
    amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);

-- Add RLS policies for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payment transactions" ON payment_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Add RLS policies for subscription_history
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription history" ON subscription_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription history" ON subscription_history
    FOR ALL USING (auth.role() = 'service_role');

-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
    -- Add identifications_used column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'identifications_used') THEN
        ALTER TABLE profiles ADD COLUMN identifications_used INTEGER DEFAULT 0;
    END IF;
    
    -- Add last_reset_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_reset_date') THEN
        ALTER TABLE profiles ADD COLUMN last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add monthly_identifications column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'monthly_identifications') THEN
        ALTER TABLE profiles ADD COLUMN monthly_identifications INTEGER DEFAULT 5;
    END IF;
END $$;

-- Update existing profiles with default values
UPDATE profiles 
SET 
    identifications_used = COALESCE(identifications_used, 0),
    last_reset_date = COALESCE(last_reset_date, NOW()),
    monthly_identifications = COALESCE(monthly_identifications, 5)
WHERE 
    identifications_used IS NULL 
    OR last_reset_date IS NULL 
    OR monthly_identifications IS NULL;