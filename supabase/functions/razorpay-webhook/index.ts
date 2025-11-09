import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface DenoEnv {
  get(key: string): string | undefined;
}

declare const Deno: {
  env: DenoEnv;
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

interface LogData {
  [key: string]: unknown;
}

// Enhanced logging function
function logEvent(level: 'info' | 'error' | 'warn', message: string, data?: LogData) {
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
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logEvent('error', 'Signature verification error', { error: errorMsg });
    return false;
  }
}

interface SubscriptionTransaction {
  transaction_id: string;
  user_id: string;
  plan_id: string;
  billing_cycle: string;
  amount: number;
}

// Enhanced subscription update function with validation
async function updateSubscriptionStatus(
  supabase: SupabaseClient,
  transaction: SubscriptionTransaction
): Promise<{ success: boolean; error?: string }> {
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
      logEvent('warn', 'Error deactivating old subscriptions', { error: deactivateError.message });
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
      logEvent('error', 'Subscription update failed', { error: subError.message });
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logEvent('error', 'Subscription update error', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

interface TopUpTransaction {
  transaction_id: string;
  user_id: string;
  pack_id: string;
  identifications_count: number;
  amount: number;
}

// Handle top-up pack purchase
async function updateTopUpPurchase(
  supabase: SupabaseClient,
  transaction: TopUpTransaction
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user_id, pack_id, identifications_count, transaction_id, amount } = transaction;
    
    if (!user_id || !pack_id) {
      return { success: false, error: 'Missing user_id or pack_id in transaction' };
    }

    logEvent('info', 'Processing top-up purchase', { user_id, pack_id, identifications_count });

    // Record the purchase in history
    const { error: purchaseError } = await supabase
      .from('user_identification_purchases')
      .insert({
        user_id,
        pack_id,
        identifications_added: identifications_count,
        amount_paid: amount,
        transaction_id: transaction_id,
        payment_status: 'completed'
      });
    
    if (purchaseError) {
      logEvent('error', 'Failed to record pack purchase', { error: purchaseError.message });
      return { success: false, error: purchaseError.message };
    }
    
    // Add identifications to user's profile using RPC function
    const { error: profileError } = await supabase.rpc('increment_extra_identifications', {
      p_user_id: user_id,
      p_amount: identifications_count
    });
    
    if (profileError) {
      logEvent('error', 'Failed to add identifications to profile', { error: profileError.message });
      return { success: false, error: profileError.message };
    }

    logEvent('info', 'Top-up purchase processed successfully', {
      user_id,
      pack_id,
      identifications_added: identifications_count
    });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logEvent('error', 'Top-up purchase error', { error: errorMessage });
    return { success: false, error: errorMessage };
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

    // Build headers object without using entries()
    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    logEvent('info', 'Webhook received', { 
      hasSignature: !!sig, 
      bodyLength: rawBody.length,
      headers: headersObj
    });

    const valid = await verifySignature(rawBody, sig);
    if (!valid) {
      logEvent('error', 'Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    interface WebhookPayload {
      event?: string;
      type?: string;
      payload?: {
        payment?: {
          entity?: Record<string, unknown>;
        };
        order?: {
          entity?: Record<string, unknown>;
        };
      };
      payment?: Record<string, unknown>;
      order?: Record<string, unknown>;
    }

    let payload: WebhookPayload = {};
    try { 
      payload = JSON.parse(rawBody) as WebhookPayload;
      logEvent('info', 'Webhook payload parsed', payload as LogData);
    } catch (parseError) { 
      const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown error';
      logEvent('error', 'Failed to parse webhook payload', { error: errorMsg });
      payload = {};
    }

    const event = payload?.event || payload?.type || '';
    const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity || payload?.payment || payload?.order || {};

    let status: string = 'pending';
    const razorpay_order_id: string | null = (entity as Record<string, unknown>)?.order_id as string || (payload?.payload?.order?.entity as Record<string, unknown>)?.id as string || null;
    const razorpay_payment_id: string | null = (entity as Record<string, unknown>)?.id as string || (payload?.payload?.payment?.entity as Record<string, unknown>)?.id as string || null;

    logEvent('info', 'Processing webhook event', { event, razorpay_order_id, razorpay_payment_id });

    if (event.includes('payment.captured') || event.includes('order.paid')) {
      status = 'success';
    } else if (event.includes('payment.failed')) {
      status = 'failed';
    }

    // Update transaction with enhanced error handling
    if (razorpay_order_id) {
      // First, try to find in subscription transactions (payment_transactions)
      const { data: subTx, error: subTxErr } = await supabase
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

      // If not found in subscriptions, try top-up transactions
      const { data: topupTx, error: topupTxErr } = await supabase
        .from('topup_transactions')
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

      // Check if both failed
      if (subTxErr && topupTxErr) {
        logEvent('error', 'Transaction update failed in both tables', {
          subError: subTxErr.message,
          topupError: topupTxErr.message
        });
        return new Response(JSON.stringify({ 
          error: 'Transaction update failed',
          details: 'Could not find transaction in any table'
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Determine which transaction was found
      const tx = subTx || topupTx;
      const isTopUp = !!topupTx;

      if (!tx) {
        logEvent('warn', 'Transaction not found', { razorpay_order_id });
        return new Response(JSON.stringify({ error: 'Transaction not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      logEvent('info', 'Transaction updated successfully', {
        transaction_id: tx.transaction_id,
        status,
        type: isTopUp ? 'topup' : 'subscription'
      });

      // Handle successful payment
      if (status === 'success') {
        if (isTopUp) {
          // Handle top-up pack purchase
          const topupTransaction: TopUpTransaction = {
            transaction_id: tx.transaction_id,
            user_id: tx.user_id,
            pack_id: tx.pack_id,
            identifications_count: tx.identifications_count,
            amount: tx.amount
          };
          
          const topupResult = await updateTopUpPurchase(supabase, topupTransaction);
          
          if (!topupResult.success) {
            logEvent('error', 'Top-up purchase failed', {
              error: topupResult.error,
              transaction_id: tx.transaction_id
            });
            // Don't return error here as payment was successful, just log the issue
          } else {
            logEvent('info', 'Payment and top-up processed successfully', { 
              transaction_id: tx.transaction_id, 
              user_id: tx.user_id,
              pack_id: tx.pack_id,
              identifications_added: tx.identifications_count
            });
          }
        } else {
          // Handle subscription purchase
          const subscriptionTransaction: SubscriptionTransaction = {
            transaction_id: tx.transaction_id,
            user_id: tx.user_id,
            plan_id: tx.plan_id,
            billing_cycle: tx.billing_cycle,
            amount: tx.amount
          };
          
          const subscriptionResult = await updateSubscriptionStatus(supabase, subscriptionTransaction);
          
          if (!subscriptionResult.success) {
            logEvent('error', 'Subscription update failed', {
              error: subscriptionResult.error,
              transaction_id: tx.transaction_id
            });
            // Don't return error here as payment was successful, just log the issue
          } else {
            logEvent('info', 'Payment and subscription processed successfully', { 
              transaction_id: tx.transaction_id, 
              user_id: tx.user_id,
              plan_id: tx.plan_id
            });
          }
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logEvent('error', 'Webhook processing error', { error: errorMessage });
    return new Response(JSON.stringify({ 
      error: 'Internal error', 
      message: errorMessage,
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
