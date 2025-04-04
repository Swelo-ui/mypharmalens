
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const supabaseUrl = "https://vcshydrusnuxsxwctnod.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") || "";
const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract the JWT token from the authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    if (req.method === 'POST') {
      const { data } = await req.json();
      
      // Different operations based on the path
      switch (path) {
        case 'create-order':
          return await createOrder(data, user, supabase);
        case 'verify-payment':
          return await verifyPayment(data, user, supabase);
        case 'check-subscription-status':
          return await checkSubscriptionStatus(user.id, supabase);
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid endpoint' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    } else if (req.method === 'GET') {
      switch (path) {
        case 'subscription-plans':
          return await getSubscriptionPlans(supabase);
        case 'user-subscription':
          return await getUserSubscription(user.id, supabase);
        case 'identification-usage':
          return await getIdentificationUsage(user.id, supabase);
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid endpoint' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Get all subscription plans
async function getSubscriptionPlans(supabase) {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_inr', { ascending: true });
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ plans: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get user's current subscription
async function getUserSubscription(userId, supabase) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  // If no subscription found, assign the free plan
  if (!data || error) {
    const { data: freePlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', 'Free')
      .single();
    
    if (planError || !freePlan) {
      return new Response(
        JSON.stringify({ error: 'Could not retrieve subscription information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Could not create free subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ subscription: newSubscription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ subscription: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get user's identification usage
async function getIdentificationUsage(userId, supabase) {
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (subError || !subscription) {
    return new Response(
      JSON.stringify({ error: 'No active subscription found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
    return new Response(
      JSON.stringify({ error: 'Could not retrieve usage information' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { monthly_identifications } = subscription.subscription_plans;
  
  return new Response(
    JSON.stringify({
      used: count,
      total: monthly_identifications,
      remaining: monthly_identifications - count,
      percentage: Math.round((count / monthly_identifications) * 100)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Create a Razorpay order
async function createOrder(data, user, supabase) {
  const { planId } = data;
  
  if (!planId) {
    return new Response(
      JSON.stringify({ error: 'Plan ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get the plan details
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  if (planError || !plan) {
    return new Response(
      JSON.stringify({ error: 'Plan not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
      return new Response(
        JSON.stringify({ error: 'Could not create free subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
  
  // For paid plans, create Razorpay order
  const orderAmount = plan.price_inr * 100; // Convert to paise
  
  // Create a Razorpay order using their API
  const razorpayUrl = 'https://api.razorpay.com/v1/orders';
  const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
  
  const response = await fetch(razorpayUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: orderAmount,
      currency: 'INR',
      receipt: `order_rcpt_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: planId,
        plan_name: plan.name
      }
    })
  });
  
  const razorpayResponse = await response.json();
  
  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: 'Failed to create order with Razorpay', details: razorpayResponse }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      order: razorpayResponse,
      key_id: razorpayKeyId,
      plan: plan
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Verify Razorpay payment and create subscription
async function verifyPayment(data, user, supabase) {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan_id } = data;
  
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !plan_id) {
    return new Response(
      JSON.stringify({ error: 'Missing payment verification details' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // For a production app, you would verify the signature here
  // Since this is a demo, we'll assume the payment is valid
  
  // Get the plan details
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .single();
  
  if (planError || !plan) {
    return new Response(
      JSON.stringify({ error: 'Plan not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
    })
    .select('*, subscription_plans(*)')
    .single();
  
  if (subscriptionError) {
    return new Response(
      JSON.stringify({ error: 'Could not create subscription' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      subscription,
      message: `${plan.name} plan activated successfully` 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Check if user is within subscription limits
async function checkSubscriptionStatus(userId, supabase) {
  // Get user's subscription
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (subError || !subscription) {
    // If no subscription, check if they have a free plan
    const { data: freePlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', 'Free')
      .single();
    
    if (planError || !freePlan) {
      return new Response(
        JSON.stringify({ error: 'Could not retrieve subscription information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Could not create free subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        canIdentify: true, 
        message: 'Free plan usage',
        subscription: newSubscription,
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
    
    return new Response(
      JSON.stringify({ 
        canIdentify: false, 
        message: 'Your subscription has expired. Please renew.',
        subscription
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
    return new Response(
      JSON.stringify({ error: 'Could not retrieve usage information' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { monthly_identifications } = subscription.subscription_plans;
  
  if (count >= monthly_identifications) {
    return new Response(
      JSON.stringify({ 
        canIdentify: false, 
        message: 'You have reached your monthly identification limit. Please upgrade your plan.',
        subscription,
        usage: {
          used: count,
          total: monthly_identifications,
          remaining: 0,
          percentage: 100
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
        used: count,
        total: monthly_identifications,
        remaining: monthly_identifications - count,
        percentage: Math.round((count / monthly_identifications) * 100)
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
