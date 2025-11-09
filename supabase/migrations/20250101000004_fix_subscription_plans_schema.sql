-- Add missing columns to subscription_plans table for TypeScript interface compatibility
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS identifications_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Update existing plans with proper values (safely check if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='price_monthly') THEN
        UPDATE subscription_plans 
        SET 
            monthly_price = price_monthly,
            yearly_price = price_yearly,
            identifications_limit = CASE 
                WHEN monthly_identifications = -1 THEN 999999 
                ELSE monthly_identifications 
            END,
            is_popular = CASE 
                WHEN name = 'Monthly Premium' THEN true 
                ELSE false 
            END
        WHERE monthly_price IS NULL OR yearly_price IS NULL OR identifications_limit IS NULL;
    END IF;
END $$;