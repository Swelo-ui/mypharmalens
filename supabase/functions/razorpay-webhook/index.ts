import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// Enhanced logging function
function logEvent(level: 'info' | 'error' | 'warn', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  const secret = Deno?.env?.get?.('RAZORPAY_WEBHOOK_SECRET');
  if (!secret || !signature) {
    logEvent('warn', 'Missing webhook secret or signature', { hasSecret: !!secret, hasSignature: !!signature });
    return false;
  }

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
    const expected = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const isValid = signature === expected;
    logEvent('info', 'Signature verification result', { isValid, expectedLength: expected.length, receivedLength: signature.length });
    return isValid;
  } catch (error) {
    logEvent('error', 'Signature verification error', error);
    return false;
  }
}

// Enhanced subscription update function with validation
async function updateSubscriptionStatus(supabase: any, transaction: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { user_id, plan_id, billing_cycle } = transaction;
    
    if (!user_id || !plan_id) {
      return { success: false, error: 'Missing user_id or plan_id in transaction' };
    }

    const now = new Date();
    const ends = new Date();
    
    // Calculate subscription end date based on billing cycle
    if (billing_cycle === 'yearly') {
      ends.setFullYear(ends.getFullYear() + 1);
    } else if (billing_cycle === 'weekly') {
      ends.setDate(ends.getDate() + 7);
    } else {
      // Default to monthly
      ends.setMonth(ends.getMonth() + 1);
    }

    logEvent('info', 'Updating subscription status', { user_id, plan_id, billing_cycle, starts_at: now.toISOString(), ends_at: ends.toISOString() });

    // First, deactivate all existing active subscriptions
    const { error: deactivateError } = await supabase
      .from('user_subscriptions')
      .update({ status: 'inactive' })
      .eq('user_id', user_id)
      .eq('status', 'active');

    if (deactivateError) {
      logEvent('warn', 'Error deactivating old subscriptions', deactivateError);
    }

    // Insert new active subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id,
        plan_id,
        status: 'active',
        starts_at: now.toISOString(),
        ends_at: ends.toISOString()
      })
      .select('*')
      .single();

    if (subError) {
      logEvent('error', 'Subscription update failed', subError);
      return { success: false, error: subError.message };
    }

    // Log subscription history
    await supabase
      .from('subscription_history')
      .insert({
        user_id,
        subscription_id: subscription.id,
        plan_id,
        action: 'activated',
        transaction_id: transaction.transaction_id,
        billing_cycle,
        amount: transaction.amount
      });

    logEvent('info', 'Subscription updated successfully', { subscription_id: subscription.id, user_id });
    return { success: true };
  } catch (error: any) {
    logEvent('error', 'Subscription update error', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawBody = await req.text();
    const sig = req.headers.get('x-razorpay-signature');

    logEvent('info', 'Webhook received', { 
      hasSignature: !!sig, 
      bodyLength: rawBody.length,
      headers: Object.fromEntries(req.headers.entries())
    });

    const valid = await verifySignature(rawBody, sig);
    if (!valid) {
      logEvent('error', 'Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let payload: any = {};
    try { 
      payload = JSON.parse(rawBody); 
      logEvent('info', 'Webhook payload parsed', payload);
    } catch (parseError) { 
      logEvent('error', 'Failed to parse webhook payload', parseError);
      payload = {};
    }

    const event = payload?.event || payload?.type || '';
    const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity || payload?.payment || payload?.order || {};

    let status: string = 'pending';
    let razorpay_order_id: string | null = entity?.order_id || payload?.payload?.order?.entity?.id || null;
    let razorpay_payment_id: string | null = entity?.id || payload?.payload?.payment?.entity?.id || null;

    logEvent('info', 'Processing webhook event', { event, razorpay_order_id, razorpay_payment_id });

    if (event.includes('payment.captured') || event.includes('order.paid')) {
      status = 'success';
    } else if (event.includes('payment.failed')) {
      status = 'failed';
    }

    // Update transaction with enhanced error handling
    if (razorpay_order_id) {
      const { data: tx, error: txErr } = await supabase
        .from('payment_transactions')
        .update({
          status,
          razorpay_payment_id,
          razorpay_response: payload,
          completed_at: status === 'success' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', razorpay_order_id)
        .select('*')
        .maybeSingle();

      if (txErr) {
        logEvent('error', 'Transaction update failed', txErr);
        return new Response(JSON.stringify({ error: 'Transaction update failed', details: txErr.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      if (!tx) {
        logEvent('warn', 'Transaction not found', { razorpay_order_id });
        return new Response(JSON.stringify({ error: 'Transaction not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      logEvent('info', 'Transaction updated successfully', { transaction_id: tx.transaction_id, status });

      // Handle successful payment with enhanced subscription update
      if (status === 'success') {
        const subscriptionResult = await updateSubscriptionStatus(supabase, tx);
        
        if (!subscriptionResult.success) {
          logEvent('error', 'Subscription update failed', { error: subscriptionResult.error, transaction_id: tx.transaction_id });
          // Don't return error here as payment was successful, just log the issue
        } else {
          logEvent('info', 'Payment and subscription processed successfully', { 
            transaction_id: tx.transaction_id, 
            user_id: tx.user_id,
            plan_id: tx.plan_id
          });
        }
      }
    } else {
      logEvent('warn', 'No razorpay_order_id found in webhook', { event, payload });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      processed: true,
      event,
      status,
      timestamp: new Date().toISOString()
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    logEvent('error', 'Webhook processing error', error);
    return new Response(JSON.stringify({ 
      error: 'Internal error', 
      message: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
