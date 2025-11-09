-- Final Pricing Update - Safe Migration
-- Only adds new columns and updates existing data

-- 1. Add new columns safely
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advanced_search_limit INTEGER DEFAULT 50;

-- 2. Add extra identifications to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS extra_identifications INTEGER DEFAULT 0;

-- 3. Create identification packs table
CREATE TABLE IF NOT EXISTS identification_packs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    identifications_count INTEGER NOT NULL,
    price_inr DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create search usage tracking
CREATE TABLE IF NOT EXISTS search_usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    searches_used INTEGER DEFAULT 0,
    searches_limit INTEGER DEFAULT 50,
    last_reset_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. Create user identification purchases
CREATE TABLE IF NOT EXISTS user_identification_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pack_id UUID REFERENCES identification_packs(id),
    identifications_added INTEGER NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending',
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year')
);

-- 6. Update existing plans with new pricing structure
UPDATE subscription_plans 
SET 
    original_price = CASE 
        WHEN name = 'Weekly' THEN 79.00
        WHEN name = 'Monthly Premium' THEN 199.00
        ELSE NULL
    END,
    discounted_price = CASE 
        WHEN name = 'Weekly' THEN 49.00
        WHEN name = 'Monthly Premium' THEN 99.00
        ELSE NULL
    END,
    advanced_search_limit = CASE 
        WHEN name = 'Free' THEN 50
        WHEN name = 'Weekly' THEN 249  
        WHEN name = 'Monthly Premium' THEN 500
        ELSE 50
    END,
    name = CASE 
        WHEN name = 'Weekly' THEN 'Lite'
        WHEN name = 'Monthly Premium' THEN 'Pro'
        ELSE name
    END,
    price = CASE 
        WHEN name = 'Weekly' THEN 49.00
        WHEN name = 'Monthly Premium' THEN 99.00
        ELSE price
    END,
    price_inr = CASE 
        WHEN name = 'Weekly' THEN 49.00
        WHEN name = 'Monthly Premium' THEN 99.00
        ELSE price_inr
    END,
    features = CASE 
        WHEN name = 'Free' THEN '["5 AI identifications/month", "Advanced search (50 results)", "100 drugs database", "Basic drug information", "Drug interaction checker", "Symptom checker"]'::jsonb
        WHEN name = 'Weekly' THEN '["39 AI identifications/month", "All Free Plan features", "Priority support", "Advanced search (249 results)", "Layman explanations", "1200+ medicines database", "Drug interaction checker", "Symptom checker", "PWA offline access"]'::jsonb
        WHEN name = 'Monthly Premium' THEN '["101 AI identifications/month", "All Free Plan features", "Priority support", "Advanced search (500 results)", "Layman explanations", "1200+ medicines database", "Drug interaction checker", "Symptom checker", "PWA offline access", "History feature"]'::jsonb
        ELSE features
    END;

-- 7. Insert identification packs
INSERT INTO identification_packs (name, description, identifications_count, price_inr) VALUES
    ('Starter Pack', '5 extra AI identifications', 5, 10.00),
    ('Basic Pack', '10 extra AI identifications', 10, 20.00),
    ('Value Pack', '20 extra AI identifications', 20, 30.00)
ON CONFLICT DO NOTHING;

-- 8. Enable RLS on new tables
ALTER TABLE identification_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_usage_tracking ENABLE ROW LEVEL SECURITY; 
ALTER TABLE user_identification_purchases ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
CREATE POLICY IF NOT EXISTS "packs_public_read" ON identification_packs FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "search_user_access" ON search_usage_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "purchases_user_access" ON user_identification_purchases FOR ALL USING (auth.uid() = user_id);

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_identification_packs_active ON identification_packs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_search_usage_user_id ON search_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON user_identification_purchases(user_id);
