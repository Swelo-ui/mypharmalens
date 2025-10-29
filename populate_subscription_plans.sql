-- Populate subscription plans table with PharmaLens subscription tiers
-- Clear existing plans first
DELETE FROM subscription_plans;

-- Insert Free Plan
INSERT INTO subscription_plans (
    id,
    name,
    description,
    price_inr,
    monthly_identifications,
    features,
    created_at
) VALUES (
    'free-plan',
    'Free Plan',
    'Basic users, occasional medication needs',
    0,
    5,
    '{
        "database_searches": 100,
        "ai_identifications": 5,
        "drug_information": true,
        "prescription_status": true,
        "mobile_access": true,
        "support": "standard",
        "history_feature": false,
        "layman_explanations": false,
        "ads": true
    }',
    NOW()
);

-- Insert Weekly Plan
INSERT INTO subscription_plans (
    id,
    name,
    description,
    price_inr,
    monthly_identifications,
    features,
    created_at
) VALUES (
    'weekly-plan',
    'Weekly Plan',
    'Regular users who need frequent identification',
    39,
    21,
    '{
        "database_searches": 500,
        "ai_identifications": 21,
        "drug_information": true,
        "prescription_status": true,
        "mobile_access": true,
        "support": "priority",
        "history_feature": true,
        "layman_explanations": false,
        "ads": false,
        "enhanced_info": true,
        "billing_cycle": "weekly",
        "billing_period": "weekly",
        "duration_days": 7
    }',
    NOW()
);

-- Insert Monthly Premium Plan
INSERT INTO subscription_plans (
    id,
    name,
    description,
    price_inr,
    monthly_identifications,
    features,
    created_at
) VALUES (
    'monthly-premium',
    'Monthly Premium Plan',
    'Power users, families, healthcare enthusiasts',
    199,
    -1,
    '{
        "database_searches": 1000,
        "ai_identifications": -1,
        "drug_information": true,
        "prescription_status": true,
        "mobile_access": true,
        "support": "direct_contact",
        "history_feature": true,
        "layman_explanations": true,
        "ads": false,
        "enhanced_info": true,
        "brand_generic_search": true,
        "advanced_filters": true,
        "offline_access": true,
        "billing_cycle": "monthly",
        "yearly_price": 1999,
        "yearly_savings": 16
    }',
    NOW()
);