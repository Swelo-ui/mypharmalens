import { createClient } from "supabase";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

/**
 * Edge Function to check and handle expired subscriptions
 * This function:
 * 1. Finds all active subscriptions that have passed their end date
 * 2. Marks them as 'expired' in the database
 * 3. Resets user usage to 0
 * 4. Assigns free plan to users
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();
    console.log('🔍 Checking for expired subscriptions at:', now);

    // Find all active subscriptions that have expired (ends_at < now)
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, plan_id, ends_at')
      .eq('status', 'active')
      .neq('plan_id', 'free-plan') // Don't expire free plans
      .lt('ends_at', now);

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      throw fetchError;
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      console.log('✅ No expired subscriptions found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired subscriptions found',
          count: 0
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`⚠️ Found ${expiredSubs.length} expired subscriptions`);

    const results: Array<{
      subscriptionId: string;
      userId: string;
      success: boolean;
      error?: string;
      message?: string;
    }> = [];
    
    for (const sub of expiredSubs) {
      try {
        console.log(`Processing expired subscription: ${sub.id} for user ${sub.user_id}`);

        // 1. Mark the subscription as expired
        const { error: updateSubError } = await supabase
          .from('user_subscriptions')
          .update({ status: 'expired' })
          .eq('id', sub.id);

        if (updateSubError) {
          console.error(`Error updating subscription ${sub.id}:`, updateSubError);
          results.push({ subscriptionId: sub.id, userId: sub.user_id, success: false, error: updateSubError.message });
          continue;
        }

        // 2. Reset user's identification usage to 0
        const { error: resetUsageError } = await supabase
          .from('profiles')
          .update({ 
            identifications_used: 0,
            last_reset_date: now
          })
          .eq('id', sub.user_id);

        if (resetUsageError) {
          console.error(`Error resetting usage for user ${sub.user_id}:`, resetUsageError);
        }

        // 3. Check if user already has a free plan
        const { data: existingFreePlan } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', sub.user_id)
          .eq('plan_id', 'free-plan')
          .eq('status', 'active')
          .maybeSingle();

        // 4. If no active free plan exists, create one
        if (!existingFreePlan) {
          const { error: freePlanError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: sub.user_id,
              plan_id: 'free-plan',
              status: 'active',
              starts_at: now,
              ends_at: null // Free plan never expires
            });

          if (freePlanError) {
            console.error(`Error creating free plan for user ${sub.user_id}:`, freePlanError);
          } else {
            console.log(`✅ Assigned free plan to user ${sub.user_id}`);
          }
        }

        // 5. Update profile subscription status
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            monthly_identifications: 5
          })
          .eq('id', sub.user_id);

        if (profileError) {
          console.error(`Error updating profile for user ${sub.user_id}:`, profileError);
        }

        results.push({ 
          subscriptionId: sub.id, 
          userId: sub.user_id, 
          success: true,
          message: 'Subscription expired and user moved to free plan'
        });

        console.log(`✅ Successfully processed expired subscription ${sub.id}`);

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing subscription ${sub.id}:`, error);
        results.push({ subscriptionId: sub.id, userId: sub.user_id, success: false, error: message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ Processed ${successCount} expired subscriptions successfully`);
    if (failureCount > 0) {
      console.log(`❌ Failed to process ${failureCount} subscriptions`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${expiredSubs.length} expired subscriptions`,
        successCount,
        failureCount,
        results
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Check expired subscriptions error:', error);
    return new Response(
      JSON.stringify({ success: false, error: message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
