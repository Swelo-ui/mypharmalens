import { createClient } from '@supabase/supabase-js';

interface DenoEnv {
  get(key: string): string | undefined;
}

declare const Deno: {
  env: DenoEnv;
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

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

    const { razorpay_order_id, razorpay_payment_id } = await req.json();

    if (!razorpay_order_id) {
      return new Response(JSON.stringify({ error: 'Missing razorpay_order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Starting payment verification for order:', razorpay_order_id);

    // Check top-up transactions first
    const { data: topupTx, error: topupErr } = await supabase
      .from('topup_transactions')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (topupErr) {
      console.error('❌ Error querying topup_transactions:', topupErr);
    }

    if (topupTx) {
      console.log('✅ Found top-up transaction:', {
        transaction_id: topupTx.transaction_id,
        user_id: topupTx.user_id,
        pack_name: topupTx.pack_name,
        identifications: topupTx.identifications_count,
        current_status: topupTx.status
      });
      
      // Check if already processed
      if (topupTx.status === 'success') {
        console.log('⚠️ Transaction already processed');
        return new Response(JSON.stringify({
          success: true,
          message: 'Transaction was already processed',
          identifications_added: topupTx.identifications_count
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update to success
      const { error: updateErr } = await supabase
        .from('topup_transactions')
        .update({
          status: 'success',
          razorpay_payment_id: razorpay_payment_id || topupTx.razorpay_payment_id,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', topupTx.id);

      if (updateErr) {
        throw new Error(`Failed to update transaction: ${updateErr.message}`);
      }

      // Add identifications to user profile
      const { error: profileErr } = await supabase.rpc('increment_extra_identifications', {
        p_user_id: topupTx.user_id,
        p_amount: topupTx.identifications_count
      });

      if (profileErr) {
        // Fallback: direct profile update
        const { data: profile } = await supabase
          .from('profiles')
          .select('extra_identifications')
          .eq('id', topupTx.user_id)
          .single();

        const currentExtra = profile?.extra_identifications || 0;
        
        const { error: directUpdateErr } = await supabase
          .from('profiles')
          .update({ extra_identifications: currentExtra + topupTx.identifications_count })
          .eq('id', topupTx.user_id);

        if (directUpdateErr) {
          console.error('Failed to update profile directly:', directUpdateErr);
        } else {
          console.log(`Added ${topupTx.identifications_count} identifications to user ${topupTx.user_id}`);
        }
      } else {
        console.log(`RPC success: Added ${topupTx.identifications_count} identifications to user ${topupTx.user_id}`);
      }

      // Record purchase history
      const { error: historyErr } = await supabase
        .from('user_identification_purchases')
        .insert({
          user_id: topupTx.user_id,
          pack_id: topupTx.pack_id,
          pack_name: topupTx.pack_name,
          identifications_added: topupTx.identifications_count,
          amount_paid: topupTx.amount,
          transaction_id: topupTx.transaction_id,
          payment_status: 'completed'
        });

      if (historyErr) {
        console.error('Failed to record purchase history:', historyErr);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Top-up processed successfully',
        identifications_added: topupTx.identifications_count
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check subscription transactions
    const { data: subTx, error: _subErr } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (subTx) {
      console.log('Found subscription transaction:', subTx);

      // Update to success
      const { error: updateErr } = await supabase
        .from('payment_transactions')
        .update({
          status: 'success',
          razorpay_payment_id: razorpay_payment_id || subTx.razorpay_payment_id,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subTx.id);

      if (updateErr) {
        throw new Error(`Failed to update subscription: ${updateErr.message}`);
      }

      const startsAt = new Date().toISOString();
      const endsAt = (() => {
        const d = new Date();
        const cycle = String(subTx.billing_cycle || 'monthly');
        if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
        else if (cycle === 'weekly') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);
        return d.toISOString();
      })();
      const { error: deactivateErr } = await supabase
        .from('user_subscriptions')
        .update({ status: 'inactive' })
        .eq('user_id', String(subTx.user_id))
        .eq('status', 'active');
      if (deactivateErr) {
        console.error('Error deactivating old subscriptions:', deactivateErr);
      }
      const { data: newSub, error: insertSubErr } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: String(subTx.user_id),
          plan_id: String(subTx.plan_id),
          status: 'active',
          starts_at: startsAt,
          ends_at: endsAt
        })
        .select('*')
        .single();
      if (insertSubErr) {
        console.error('Subscription activation failed:', insertSubErr);
      } else {
        await supabase
          .from('subscription_history')
          .insert({
            user_id: String(subTx.user_id),
            subscription_id: newSub.id,
            plan_id: String(subTx.plan_id),
            action: 'activated',
            transaction_id: String(subTx.transaction_id),
            billing_cycle: String(subTx.billing_cycle),
            amount: Number(subTx.amount)
          });
        console.log('Subscription activated:', { subscription_id: newSub.id });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Subscription processed successfully'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Transaction not found',
      razorpay_order_id
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(JSON.stringify({
      error: 'Payment verification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
