-- Add missing columns to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS monthly_identifications INTEGER DEFAULT 0;

-- Delete existing plans to avoid conflicts
DELETE FROM subscription_plans WHERE name IN ('Free', 'Weekly', 'Monthly Premium');

-- Insert PharmaLens subscription plans with correct pricing
INSERT INTO subscription_plans (id, name, description, price_inr, price_monthly, price_yearly, features, max_users, max_storage_gb, monthly_identifications) 
VALUES
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Free', 'Basic users, occasional medication needs', 0.00, 0.00, 0.00, '["100 drugs database search", "5 AI identifications per month", "Drug information access", "Prescription status", "Mobile web app", "Standard support"]'::jsonb, 1, 1, 5),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Weekly', 'Regular users who need frequent identification', 39.00, 156.00, 1872.00, '["All Free Plan features", "3 AI identifications per day", "500+ medicines database", "Enhanced drug information", "Priority support", "No ads"]'::jsonb, 1, 5, 90),
    ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Monthly Premium', 'Power users, families, healthcare enthusiasts', 199.00, 199.00, 1999.00, '["All Weekly Plan features", "1000+ database drugs", "Search by brand/generic name", "Layman explanations", "Unlimited AI identifications", "Direct contact support", "History feature", "Advanced search filters", "Offline access"]'::jsonb, 1, 10, -1);