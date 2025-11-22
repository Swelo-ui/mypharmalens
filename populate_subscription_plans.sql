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

-- Insert Lite Plan
INSERT INTO subscription_plans (
    id,
    name,
    description,
    price_inr,
    monthly_identifications,
    features,
    created_at
) VALUES (
    'lite',
    'Lite Plan',
    'Regular users who need frequent identification',
    49,
    39,
    '{
        "database_searches": 249,
        "ai_identifications": 39,
        "drug_information": true,
        "prescription_status": true,
        "mobile_access": true,
        "support": "priority",
        "history_feature": false,
        "layman_explanations": false,
        "ads": false,
        "enhanced_info": true,
        "billing_cycle": "monthly",
        "billing_period": "monthly",
        "duration_days": 30,
        "original_price": 79,
        "savings": 30
    }',
    NOW()
);

-- Insert Pro Plan
INSERT INTO subscription_plans (
    id,
    name,
    description,
    price_inr,
    monthly_identifications,
    features,
    created_at
) VALUES (
    'pro',
    'Pro Plan',
    'Power users, families, healthcare enthusiasts',
    99,
    101,
    '{
        "database_searches": 500,
        "ai_identifications": 101,
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
        "original_price": 199,
        "savings": 100
    }',
    NOW()
);