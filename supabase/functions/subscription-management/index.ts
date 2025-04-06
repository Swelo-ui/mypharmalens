
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const supabaseUrl = "https://vcshydrusnuxsxwctnod.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const razorpayKeyId = "rzp_test_ug7SgHTNLC73y9";
const razorpayKeySecret = "cwJvpYpThJ6McDkAEDBzzGpf";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    // Extract the JWT token from the authorization header
    let user = null;
    let token = null;
    
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
      
      // Get the user from the JWT token
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      
      if (!userError && userData?.user) {
        user = userData.user;
      }
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // Routes that don't require authentication
    const publicRoutes = ['subscription-plans'];
    
    // Check if authentication is required for this route - but allow public routes
    if (!publicRoutes.includes(path || '') && !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (req.method === 'POST') {
      const reqBody = await req.json();
      
      // Different operations based on the path
      switch (path) {
        case 'create-order':
          return await createOrder(reqBody, user, supabase);
        case 'verify-payment':
          return await verifyPayment(reqBody, user, supabase);
        case 'verify-subscription':
          return await verifySubscription(reqBody, user, supabase);
        case 'check-subscription-status':
          return await checkSubscriptionStatus(user.id, supabase);
        case 'redeem-coupon':
          return await redeemCoupon(reqBody, user, supabase);
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid endpoint' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    } else if (req.method === 'GET') {
      switch (path) {
        case 'subscription-plans':
          return await getSubscriptionPlans(supabase);
        case 'user-subscription':
          if (!user) {
            // For subscription plans, return default plans even if not authenticated
            if (path === 'subscription-plans') {
              return await getDefaultSubscriptionPlans();
            }
            return new Response(
              JSON.stringify({ error: 'Authentication required for user subscription' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return await getUserSubscription(user.id, supabase);
        case 'identification-usage':
          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Authentication required for identification usage' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return await getIdentificationUsage(user.id, supabase);
        case 'daily-free-identifications':
          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Authentication required for daily free identifications' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return await claimDailyFreeIdentifications(user.id, supabase);
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid endpoint' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in edge function:', error);
    // Return a fallback for subscription plans if that's the endpoint
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    if (path === 'subscription-plans') {
      return await getDefaultSubscriptionPlans();
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to return default plans when database access fails
async function getDefaultSubscriptionPlans() {
  const defaultPlans = [
    {
      id: "free-plan",
      name: 'Free',
      description: 'Basic features for getting started',
      price_inr: 0,
      monthly_identifications: 5,
      features: ['Basic drug identification', 'Limited history storage (10 items)', 'Standard response time']
    },
    {
      id: "advanced-plan",
      name: 'Advanced',
      description: 'Enhanced features for regular users',
      price_inr: 299,
      monthly_identifications: 30,
      features: ['Enhanced drug identification', 'Full history access (100 items)', 'Faster response time', 'Detailed medication reports'],
      razorpay_plan_id: 'plan_QF0j2DLuOBwNHE',
      subscription_button_id: 'pl_QF1itg7gdfQFbF'
    },
    {
      id: "elite-plan",
      name: 'Elite',
      description: 'Premium features for power users',
      price_inr: 599,
      monthly_identifications: 100,
      features: ['Premium drug identification', 'Unlimited history storage', 'Priority response time', 'Comprehensive medication reports'],
      razorpay_plan_id: 'plan_QF0jNqqpycThRR',
      subscription_button_id: 'pl_QFGGMMuM37x0Sp'
    }
  ];
  
  return new Response(
    JSON.stringify({ plans: defaultPlans }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get all subscription plans
async function getSubscriptionPlans(supabase) {
  try {
    // Check if plans exist in the database
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_inr', { ascending: true });
    
    if (error) {
      // If database error, return default plans
      return await getDefaultSubscriptionPlans();
    }
    
    // If no plans exist in the database, create default plans
    if (!data || data.length === 0) {
      const defaultPlans = [
        {
          name: 'Free',
          description: 'Basic features for getting started',
          price_inr: 0,
          monthly_identifications: 5,
          features: ['Basic drug identification', 'Limited history storage (10 items)', 'Standard response time']
        },
        {
          name: 'Advanced',
          description: 'Enhanced features for regular users',
          price_inr: 299,
          monthly_identifications: 30,
          features: ['Enhanced drug identification', 'Full history access (100 items)', 'Faster response time', 'Detailed medication reports'],
          razorpay_plan_id: 'plan_QF0j2DLuOBwNHE',
          subscription_button_id: 'pl_QF1itg7gdfQFbF'
        },
        {
          name: 'Elite',
          description: 'Premium features for power users',
          price_inr: 599,
          monthly_identifications: 100,
          features: ['Premium drug identification', 'Unlimited history storage', 'Priority response time', 'Comprehensive medication reports'],
          razorpay_plan_id: 'plan_QF0jNqqpycThRR',
          subscription_button_id: 'pl_QFGGMMuM37x0Sp'
        }
      ];
      
      const { data: insertedPlans, error: insertError } = await supabase
        .from('subscription_plans')
        .insert(defaultPlans)
        .select();
      
      if (insertError) {
        return await getDefaultSubscriptionPlans();
      }
      
      return new Response(
        JSON.stringify({ plans: insertedPlans }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Add subscription button IDs to plans
    const plansWithButtonIds = data.map(plan => {
      if (plan.name === 'Advanced') {
        return { ...plan, subscription_button_id: 'pl_QF1itg7gdfQFbF' };
      } else if (plan.name === 'Elite') {
        return { ...plan, subscription_button_id: 'pl_QFGGMMuM37x0Sp' };
      }
      return plan;
    });
    
    return new Response(
      JSON.stringify({ plans: plansWithButtonIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return await getDefaultSubscriptionPlans();
  }
}

// Get user's current subscription
async function getUserSubscription(userId, supabase) {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // If no subscription found, assign the free plan
    if (!data || error) {
      const { data: freePlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'Free')
        .single();
      
      if (planError || !freePlan) {
        throw new Error('Could not retrieve subscription information');
      }
      
      // Create a free subscription for this user if they don't have one
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: freePlan.id,
          status: 'active',
          subscription_start: new Date().toISOString(),
          subscription_end: oneMonthLater.toISOString(),
        })
        .select('*, subscription_plans(*)')
        .single();
      
      if (subscriptionError) {
        throw new Error('Could not create free subscription');
      }

      // Also create a daily free identifications record
      await createDailyFreeIdentificationsRecord(userId, supabase);
      
      return new Response(
        JSON.stringify({ subscription: newSubscription }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ subscription: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get user's identification usage
async function getIdentificationUsage(userId, supabase) {
  try {
    // Get user's normal subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Get bonus identifications from coupon redemptions
    const { data: redemptions, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .select('identifications_granted')
      .eq('user_id', userId);
    
    // Check daily free identifications
    const { data: dailyFree, error: dailyFreeError } = await supabase
      .from('daily_free_identifications')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (subError || !subscription) {
      throw new Error('No active subscription found');
    }
    
    // Count identifications for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count, error: countError } = await supabase
      .from('drug_identifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());
    
    if (countError) {
      throw new Error('Could not retrieve usage information');
    }
    
    // Calculate bonus identifications from coupons
    const bonusIdentifications = redemptions?.reduce(
      (total, redemption) => total + redemption.identifications_granted, 
      0
    ) || 0;
    
    // Add daily free identifications
    const dailyFreeRemaining = dailyFree?.remaining_identifications || 0;
    
    const { monthly_identifications } = subscription.subscription_plans;
    const totalAllowedIdentifications = monthly_identifications + bonusIdentifications + dailyFreeRemaining;
    
    return new Response(
      JSON.stringify({
        used: count || 0,
        total: totalAllowedIdentifications,
        remaining: totalAllowedIdentifications - (count || 0),
        percentage: Math.round(((count || 0) / totalAllowedIdentifications) * 100),
        base_monthly: monthly_identifications,
        bonus_from_coupons: bonusIdentifications,
        daily_free: dailyFreeRemaining,
        last_claimed: dailyFree?.last_claimed_at || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting identification usage:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Create a Razorpay order (mainly used for free plan activation now)
async function createOrder(data, user, supabase) {
  try {
    const { planId } = data;
    
    if (!planId) {
      throw new Error('Plan ID is required');
    }
    
    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError || !plan) {
      throw new Error('Plan not found');
    }
    
    // Skip payment for free plan
    if (plan.price_inr === 0) {
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      // Update existing subscriptions to cancelled
      await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      // Create a new subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'active',
          subscription_start: new Date().toISOString(),
          subscription_end: oneMonthLater.toISOString(),
        })
        .select('*, subscription_plans(*)')
        .single();
      
      if (subscriptionError) {
        throw new Error('Could not create free subscription');
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          subscription,
          message: 'Free plan activated successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For paid plans, we're now using the Razorpay subscription buttons
    // so we just return the plan information for now
    return new Response(
      JSON.stringify({ 
        plan: plan,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Endpoint to verify a Razorpay subscription that was completed through the button
async function verifySubscription(data, user, supabase) {
  try {
    const { 
      razorpay_subscription_id, 
      razorpay_payment_id, 
      plan_name 
    } = data;
    
    if (!razorpay_subscription_id || !razorpay_payment_id || !plan_name) {
      throw new Error('Missing subscription verification details');
    }
    
    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', plan_name)
      .single();
    
    if (planError || !plan) {
      throw new Error('Plan not found');
    }
    
    // Update existing subscriptions to cancelled
    await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    // Create a new subscription (1 month)
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        subscription_start: new Date().toISOString(),
        subscription_end: oneMonthLater.toISOString(),
        razorpay_subscription_id: razorpay_subscription_id,
        razorpay_payment_id: razorpay_payment_id,
      })
      .select('*, subscription_plans(*)')
      .single();
    
    if (subscriptionError) {
      throw new Error('Could not create subscription');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription,
        message: `${plan.name} plan activated successfully` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Legacy payment verification method - kept for backwards compatibility
async function verifyPayment(data, user, supabase) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan_id } = data;
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !plan_id) {
      throw new Error('Missing payment verification details');
    }
    
    // For a production app, you would verify the signature here
    // Since this is a demo with test keys, we'll assume the payment is valid
    
    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    
    if (planError || !plan) {
      throw new Error('Plan not found');
    }
    
    // Update existing subscriptions to cancelled
    await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    // Create a new subscription (1 month)
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        subscription_start: new Date().toISOString(),
        subscription_end: oneMonthLater.toISOString(),
        razorpay_subscription_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
      })
      .select('*, subscription_plans(*)')
      .single();
    
    if (subscriptionError) {
      throw new Error('Could not create subscription');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription,
        message: `${plan.name} plan activated successfully` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Check if user is within subscription limits
async function checkSubscriptionStatus(userId, supabase) {
  try {
    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Get bonus identifications from coupon redemptions
    const { data: redemptions, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .select('identifications_granted')
      .eq('user_id', userId);
    
    // Check daily free identifications
    const { data: dailyFree, error: dailyFreeError } = await supabase
      .from('daily_free_identifications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    const bonusIdentifications = redemptions?.reduce(
      (total, redemption) => total + redemption.identifications_granted, 
      0
    ) || 0;
    
    // Add daily free identifications
    const dailyFreeRemaining = dailyFree?.remaining_identifications || 0;
    
    if (subError || !subscription) {
      // If no subscription, check if they have a free plan
      const { data: freePlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'Free')
        .single();
      
      if (planError || !freePlan) {
        throw new Error('Could not retrieve subscription information');
      }
      
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: freePlan.id,
          status: 'active',
          subscription_start: new Date().toISOString(),
          subscription_end: oneMonthLater.toISOString(),
        })
        .select('*, subscription_plans(*)')
        .single();
      
      if (subscriptionError) {
        throw new Error('Could not create free subscription');
      }

      // Create or update daily free identifications
      if (!dailyFree) {
        await createDailyFreeIdentificationsRecord(userId, supabase);
      }
      
      const canIdentify = (bonusIdentifications > 0 || dailyFreeRemaining > 0 || true);
      
      return new Response(
        JSON.stringify({ 
          canIdentify: canIdentify, 
          message: 
            dailyFreeRemaining > 0 ? `You have ${dailyFreeRemaining} free daily identifications remaining` :
            bonusIdentifications > 0 ? `Free plan with ${bonusIdentifications} bonus identifications from coupons` : 
            'Free plan usage',
          subscription: newSubscription,
          bonus_identifications: bonusIdentifications,
          daily_free: dailyFreeRemaining
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if subscription is expired
    const now = new Date();
    const endDate = new Date(subscription.subscription_end);
    
    if (now > endDate) {
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);
      
      const canIdentify = (bonusIdentifications > 0 || dailyFreeRemaining > 0);
      let message = 'Your subscription has expired. Please renew.';
      
      if (dailyFreeRemaining > 0 && bonusIdentifications > 0) {
        message = `Your subscription has expired but you have ${dailyFreeRemaining} daily free identifications and ${bonusIdentifications} bonus identifications available.`;
      } else if (dailyFreeRemaining > 0) {
        message = `Your subscription has expired but you have ${dailyFreeRemaining} daily free identifications available.`;
      } else if (bonusIdentifications > 0) {
        message = `Your subscription has expired but you have ${bonusIdentifications} bonus identifications from coupons.`;
      }
      
      return new Response(
        JSON.stringify({ 
          canIdentify: canIdentify,
          message: message,
          subscription,
          bonus_identifications: bonusIdentifications,
          daily_free: dailyFreeRemaining
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user has exceeded monthly identifications
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count, error: countError } = await supabase
      .from('drug_identifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());
    
    if (countError) {
      throw new Error('Could not retrieve usage information');
    }
    
    const { monthly_identifications } = subscription.subscription_plans;
    const totalAllowedIdentifications = monthly_identifications + bonusIdentifications + dailyFreeRemaining;
    
    if (count >= totalAllowedIdentifications) {
      return new Response(
        JSON.stringify({ 
          canIdentify: false, 
          message: 'You have reached your monthly identification limit. Please upgrade your plan or redeem a coupon.',
          subscription,
          usage: {
            used: count,
            total: totalAllowedIdentifications,
            remaining: 0,
            percentage: 100,
            base_monthly: monthly_identifications,
            bonus_from_coupons: bonusIdentifications,
            daily_free: dailyFreeRemaining
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        canIdentify: true, 
        message: 'You can identify this medication',
        subscription,
        usage: {
          used: count || 0,
          total: totalAllowedIdentifications,
          remaining: totalAllowedIdentifications - (count || 0),
          percentage: Math.round(((count || 0) / totalAllowedIdentifications) * 100),
          base_monthly: monthly_identifications,
          bonus_from_coupons: bonusIdentifications,
          daily_free: dailyFreeRemaining
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to claim daily free identifications
async function claimDailyFreeIdentifications(userId, supabase) {
  try {
    console.log('Claiming daily free identifications for user:', userId);
    
    // Check if user has a daily_free_identifications record
    const { data: existingRecord, error: recordError } = await supabase
      .from('daily_free_identifications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (recordError) {
      console.error('Error checking daily free identifications:', recordError);
      throw new Error('Could not check daily free identifications');
    }
    
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // If no record exists, create one with 2 identifications
    if (!existingRecord) {
      const { data: newRecord, error: insertError } = await supabase
        .from('daily_free_identifications')
        .insert({
          user_id: userId,
          remaining_identifications: 2,
          last_claimed_at: now.toISOString(),
          claimed_date: todayDate
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating daily free identifications record:', insertError);
        throw new Error('Could not create daily free identifications');
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Claimed 2 free daily identifications',
          daily_free: newRecord
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const lastClaimedDate = existingRecord.claimed_date;
    
    // If already claimed today, return the existing record
    if (lastClaimedDate === todayDate) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'You have already claimed your daily free identifications today',
          daily_free: existingRecord
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If not claimed today, reset to 2 identifications
    const { data: updatedRecord, error: updateError } = await supabase
      .from('daily_free_identifications')
      .update({
        remaining_identifications: 2,
        last_claimed_at: now.toISOString(),
        claimed_date: todayDate
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating daily free identifications:', updateError);
      throw new Error('Could not update daily free identifications');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Claimed 2 free daily identifications',
        daily_free: updatedRecord
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error claiming daily free identifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to create daily free identifications record
async function createDailyFreeIdentificationsRecord(userId, supabase) {
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  try {
    const { error: insertError } = await supabase
      .from('daily_free_identifications')
      .insert({
        user_id: userId,
        remaining_identifications: 2,
        last_claimed_at: now.toISOString(),
        claimed_date: todayDate
      });
    
    if (insertError) {
      console.error('Error creating daily free identifications record:', insertError);
      throw new Error('Could not create daily free identifications record');
    }
    
    return true;
  } catch (error) {
    console.error('Error in createDailyFreeIdentificationsRecord:', error);
    return false;
  }
}

// New function to redeem coupon codes - improved with better error handling
async function redeemCoupon(data, user, supabase) {
  try {
    const { couponCode } = data;
    
    if (!couponCode) {
      throw new Error('Coupon code is required');
    }
    
    console.log(`Attempting to redeem coupon: ${couponCode}`);
    
    // Check if the coupon exists and is active - case insensitive search
    const { data: coupon, error: couponError } = await supabase
      .from('coupon_codes')
      .select('*')
      .ilike('code', couponCode)
      .eq('is_active', true)
      .single();
    
    console.log('Coupon lookup result:', { coupon, error: couponError });
    
    if (couponError || !coupon) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid or expired coupon code' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the coupon has expired
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'This coupon has expired' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the coupon has reached max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'This coupon has reached its maximum number of uses' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the user has already redeemed this coupon
    const { data: existingRedemption, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .select('*')
      .eq('coupon_id', coupon.id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('Existing redemption check:', { existingRedemption, error: redemptionError });
    
    if (existingRedemption) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'You have already redeemed this coupon' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a redemption record
    const { data: redemption, error: createError } = await supabase
      .from('coupon_redemptions')
      .insert({
        coupon_id: coupon.id,
        user_id: user.id,
        identifications_granted: coupon.identifications_granted
      })
      .select()
      .single();
    
    console.log('Redemption creation result:', { redemption, error: createError });
    
    if (createError) {
      console.error('Error creating redemption:', createError);
      throw new Error('Failed to redeem coupon: ' + createError.message);
    }
    
    // Update the coupon usage count
    await supabase
      .from('coupon_codes')
      .update({ current_uses: (coupon.current_uses || 0) + 1 })
      .eq('id', coupon.id);
    
    // Return success with the bonus identifications
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully redeemed coupon for ${coupon.identifications_granted} bonus identifications!`,
        identifications_granted: coupon.identifications_granted,
        redemption: redemption
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

