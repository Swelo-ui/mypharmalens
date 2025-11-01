import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, userId, planId, billingCycle, transactionId } = body;

    console.log('Subscription manager invoked:', { action, userId, planId, billingCycle, transactionId });

    if (action === 'activate') {
      // Calculate subscription end date
      const now = new Date();
      const endsAt = new Date();
      
      if (billingCycle === 'yearly') {
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      } else if (billingCycle === 'weekly') {
        endsAt.setDate(endsAt.getDate() + 7);
      } else {
        // Default to monthly
        endsAt.setMonth(endsAt.getMonth() + 1);
      }

      console.log('Activating subscription:', { userId, planId, startsAt: now.toISOString(), endsAt: endsAt.toISOString() });

      // Deactivate all existing active subscriptions for this user
      const { error: deactivateError } = await supabase
        .from('user_subscriptions')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (deactivateError) {
        console.error('Error deactivating old subscriptions:', deactivateError);
      }

      // Create new active subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString()
        })
        .select('*')
        .single();

      if (subError) {
        console.error('Subscription creation error:', subError);
        return new Response(
          JSON.stringify({ success: false, error: subError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get plan details for monthly identifications limit
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      const monthlyLimit = plan?.monthly_identifications || 100;

      // Update user profile with subscription status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'premium',
          subscription_plan: planId,
          monthly_identifications: monthlyLimit,
          identifications_used: 0,
          last_reset_date: now.toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Log subscription history
      const { error: historyError } = await supabase
        .from('subscription_history')
        .insert({
          user_id: userId,
          subscription_id: subscription.id,
          plan_id: planId,
          action: 'activated',
          transaction_id: transactionId,
          billing_cycle: billingCycle,
          amount: plan?.price || 0
        });

      if (historyError) {
        console.error('History logging error:', historyError);
      }

      console.log('Subscription activated successfully:', { subscriptionId: subscription.id, userId, planId });

      return new Response(
        JSON.stringify({ 
          success: true, 
          subscription,
          message: 'Subscription activated successfully'
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Subscription manager error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});