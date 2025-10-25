import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import type { Tables } from '../../src/types/database.types.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Calculate subscription end date
const calculateEndDate = (billingCycle: 'monthly' | 'yearly'): string => {
  const now = new Date();
  if (billingCycle === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now.toISOString();
};

// Activate or update a subscription
async function activateSubscription(req: {
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  transactionId: string;
}) {
  const { userId, planId, billingCycle, transactionId } = req;

  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) throw new Error('Plan not found');

  const endDate = calculateEndDate(billingCycle);

  const { data: subscription, error: upsertError } = await supabase
    .from('user_subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: planId,
        billing_cycle: billingCycle,
        status: 'active',
        starts_at: new Date().toISOString(),
        ends_at: endDate,
        transaction_id: transactionId,
      }
    )
    .select()
    .single();

  if (upsertError) throw new Error(`Subscription activation failed: ${upsertError.message}`);

  return { success: true, subscription };
}

// Cancel a subscription
async function cancelSubscription(req: { subscriptionId: string }) {
  const { subscriptionId } = req;

  const { data: subscription, error: updateError } = await supabase
    .from('user_subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (updateError) throw new Error(`Subscription cancellation failed: ${updateError.message}`);

  return { success: true, subscription };
}

// Update identification usage
async function updateUsage(req: { userId: string }) {
  const { userId } = req;

  const { error } = await supabase.rpc('increment_identifications_used', { p_user_id: userId });

  if (error) throw new Error(`Usage update failed: ${error.message}`);

  return { success: true, message: 'Usage updated successfully' };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    let result;
    switch (action) {
      case 'activate':
        result = await activateSubscription(data);
        break;
      case 'cancel':
        result = await cancelSubscription(data);
        break;
      case 'updateUsage':
        result = await updateUsage(data);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});