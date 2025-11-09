import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Starting pricing migration...')

    // 1. Add columns to subscription_plans
    console.log('📝 Adding columns to subscription_plans...')
    await supabaseAdmin.rpc('exec', {
      sql: `
        ALTER TABLE subscription_plans 
        ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS advanced_search_limit INTEGER DEFAULT 50;
        
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS extra_identifications INTEGER DEFAULT 0;
      `
    })

    // 2. Create identification_packs table
    console.log('📦 Creating identification_packs table...')
    await supabaseAdmin.rpc('exec', {
      sql: `
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
      `
    })

    // 3. Create other tables
    console.log('🔍 Creating search_usage_tracking table...')
    await supabaseAdmin.rpc('exec', {
      sql: `
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
      `
    })

    // 4. Update subscription plans
    console.log('💰 Updating subscription plans...')
    await supabaseAdmin.rpc('exec', {
      sql: `
        UPDATE subscription_plans 
        SET 
          original_price = CASE 
            WHEN name IN ('Weekly', 'Lite') THEN 79.00
            WHEN name IN ('Monthly Premium', 'Pro') THEN 199.00
            ELSE NULL
          END,
          discounted_price = CASE 
            WHEN name IN ('Weekly', 'Lite') THEN 49.00
            WHEN name IN ('Monthly Premium', 'Pro') THEN 99.00
            ELSE NULL
          END,
          advanced_search_limit = CASE 
            WHEN name = 'Free' THEN 50
            WHEN name IN ('Weekly', 'Lite') THEN 249  
            WHEN name IN ('Monthly Premium', 'Pro') THEN 500
            ELSE 50
          END,
          name = CASE 
            WHEN name = 'Weekly' THEN 'Lite'
            WHEN name = 'Monthly Premium' THEN 'Pro'
            ELSE name
          END,
          price = CASE 
            WHEN name IN ('Weekly', 'Lite') THEN 49.00
            WHEN name IN ('Monthly Premium', 'Pro') THEN 99.00
            ELSE price
          END,
          price_inr = CASE 
            WHEN name IN ('Weekly', 'Lite') THEN 49.00
            WHEN name IN ('Monthly Premium', 'Pro') THEN 99.00
            ELSE price_inr
          END;
      `
    })

    // 5. Insert identification packs
    console.log('🛍️ Adding identification packs...')
    await supabaseAdmin.rpc('exec', {
      sql: `
        INSERT INTO identification_packs (name, description, identifications_count, price_inr) VALUES
          ('Starter Pack', '5 extra AI identifications', 5, 10.00),
          ('Basic Pack', '10 extra AI identifications', 10, 20.00),
          ('Value Pack', '20 extra AI identifications', 20, 30.00)
        ON CONFLICT DO NOTHING;
      `
    })

    // 6. Set up RLS
    console.log('🔐 Setting up Row Level Security...')
    await supabaseAdmin.rpc('exec', {
      sql: `
        ALTER TABLE identification_packs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE search_usage_tracking ENABLE ROW LEVEL SECURITY; 
        ALTER TABLE user_identification_purchases ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "packs_public_read" ON identification_packs;
        CREATE POLICY "packs_public_read" ON identification_packs FOR SELECT USING (is_active = true);
        
        DROP POLICY IF EXISTS "search_user_access" ON search_usage_tracking;
        CREATE POLICY "search_user_access" ON search_usage_tracking FOR ALL USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "purchases_user_access" ON user_identification_purchases;
        CREATE POLICY "purchases_user_access" ON user_identification_purchases FOR ALL USING (auth.uid() = user_id);
      `
    })

    console.log('✅ Pricing migration completed successfully!')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Pricing migration completed successfully!' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Migration error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
