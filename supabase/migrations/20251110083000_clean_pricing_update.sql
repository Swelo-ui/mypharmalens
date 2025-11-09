-- =====================================================
-- CLEAN PRICING UPDATE - Works with existing schema
-- =====================================================

-- 1. Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add columns to subscription_plans
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='original_price') THEN
        ALTER TABLE subscription_plans ADD COLUMN original_price DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='discounted_price') THEN
        ALTER TABLE subscription_plans ADD COLUMN discounted_price DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='advanced_search_limit') THEN
        ALTER TABLE subscription_plans ADD COLUMN advanced_search_limit INTEGER DEFAULT 50;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='monthly_identifications') THEN
        ALTER TABLE subscription_plans ADD COLUMN monthly_identifications INTEGER DEFAULT 0;
    END IF;
    
    -- Add extra_identifications to profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='extra_identifications') THEN
        ALTER TABLE profiles ADD COLUMN extra_identifications INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Create identification_packs table
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

-- 3. Create user_identification_purchases table
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

-- 4. Create search_usage_tracking table
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

-- 5. Update Free Plan (use existing id or create new)
INSERT INTO subscription_plans (
    id, name, description, price, price_inr, original_price, discounted_price,
    billing_period, monthly_identifications, advanced_search_limit, features
) VALUES (
    'free-plan'::uuid,
    'Free',
    'Basic users, occasional medication needs',
    0.00, 0.00, NULL, NULL, 'monthly', 5, 50,
    '["5 AI identifications/month", "Advanced search (50 results)", "100 drugs database", "Basic drug information", "Drug interaction checker", "Symptom checker"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    price_inr = EXCLUDED.price_inr,
    original_price = EXCLUDED.original_price,
    discounted_price = EXCLUDED.discounted_price,
    billing_period = EXCLUDED.billing_period,
    monthly_identifications = EXCLUDED.monthly_identifications,
    advanced_search_limit = EXCLUDED.advanced_search_limit,
    features = EXCLUDED.features;

-- 6. Insert Lite Plan
INSERT INTO subscription_plans (
    id, name, description, price, price_inr, original_price, discounted_price,
    billing_period, monthly_identifications, advanced_search_limit, features
) VALUES (
    'lite-plan'::uuid,
    'Lite',
    'Regular users who need frequent identification',
    49.00, 49.00, 79.00, 49.00, 'monthly', 39, 249,
    '["39 AI identifications/month", "All Free Plan features", "Priority support", "Advanced search (249 results)", "Layman explanations", "1200+ medicines database", "Drug interaction checker", "Symptom checker", "PWA offline access"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    price_inr = EXCLUDED.price_inr,
    original_price = EXCLUDED.original_price,
    discounted_price = EXCLUDED.discounted_price,
    billing_period = EXCLUDED.billing_period,
    monthly_identifications = EXCLUDED.monthly_identifications,
    advanced_search_limit = EXCLUDED.advanced_search_limit,
    features = EXCLUDED.features;

-- 7. Insert Pro Plan
INSERT INTO subscription_plans (
    id, name, description, price, price_inr, original_price, discounted_price,
    billing_period, monthly_identifications, advanced_search_limit, features
) VALUES (
    'pro-plan'::uuid,
    'Pro',
    'Power users, families, healthcare enthusiasts',
    99.00, 99.00, 199.00, 99.00, 'monthly', 101, 500,
    '["101 AI identifications/month", "All Free Plan features", "Priority support", "Advanced search (500 results)", "Layman explanations", "1200+ medicines database", "Drug interaction checker", "Symptom checker", "PWA offline access", "History feature"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    price_inr = EXCLUDED.price_inr,
    original_price = EXCLUDED.original_price,
    discounted_price = EXCLUDED.discounted_price,
    billing_period = EXCLUDED.billing_period,
    monthly_identifications = EXCLUDED.monthly_identifications,
    advanced_search_limit = EXCLUDED.advanced_search_limit,
    features = EXCLUDED.features;

-- 8. Insert Identification Top-up Packs
INSERT INTO identification_packs (name, description, identifications_count, price_inr) VALUES
    ('Starter Pack', '5 extra AI identifications', 5, 10.00),
    ('Basic Pack', '10 extra AI identifications', 10, 20.00),
    ('Value Pack', '20 extra AI identifications', 20, 30.00)
ON CONFLICT DO NOTHING;

-- 9. Enable RLS
ALTER TABLE identification_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identification_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_usage_tracking ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies
DROP POLICY IF EXISTS "Anyone can view active packs" ON identification_packs;
CREATE POLICY "Anyone can view active packs" ON identification_packs
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own purchases" ON user_identification_purchases;
CREATE POLICY "Users can view own purchases" ON user_identification_purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own purchases" ON user_identification_purchases;
CREATE POLICY "Users can insert own purchases" ON user_identification_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own search usage" ON search_usage_tracking;
CREATE POLICY "Users can view own search usage" ON search_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own search usage" ON search_usage_tracking;
CREATE POLICY "Users can update own search usage" ON search_usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own search usage" ON search_usage_tracking;
CREATE POLICY "Users can insert own search usage" ON search_usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_identification_purchases_user_id ON user_identification_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_search_usage_tracking_user_id ON search_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_identification_packs_active ON identification_packs(is_active) WHERE is_active = true;
