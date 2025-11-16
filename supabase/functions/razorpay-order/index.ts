import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

interface DenoEnv {
  get(key: string): string | undefined;
}

declare const Deno: {
  env: DenoEnv;
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

interface SubscriptionOrderRequest {
  planId: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  type?: 'subscription';
}

interface TopUpOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes: {
    user_id: string;
    pack_id: string;
    identifications_count: number;
    type: string;
    transaction_id: string;
  };
  type?: 'topup';
}

type OrderRequest = SubscriptionOrderRequest | TopUpOrderRequest;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function toPaise(amount: number): number { return Math.round(amount * 100); }

async function createRazorpayOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay credentials');
  }

  const authString = btoa(`${keyId}:${keySecret}`);
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
      payment_capture: 1
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order creation failed: ${res.status} ${text}`);
  }
  return await res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasRazorpayKeyId: !!razorpayKeyId,
      hasRazorpayKeySecret: !!razorpayKeySecret
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', message: 'Missing Supabase credentials' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', message: 'Payment gateway credentials not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json() as {
      amount?: number;
      currency?: string;
      receipt?: string;
      notes?: {
        user_id?: string;
        pack_id?: string;
        identifications_count?: number;
        type?: string;
        transaction_id?: string;
      };
      type?: string;
      planId?: string;
      userId?: string;
      userEmail?: string;
      userName?: string;
      billingCycle?: string;
    };
    
    // Detect order type
    const isTopUp = body.notes?.type === 'identification_pack' || body.type === 'topup';
    
    console.log('Order request type:', isTopUp ? 'TOP-UP' : 'SUBSCRIPTION', { body });

    if (isTopUp) {
      // Handle top-up pack order
      if (!body.amount || !body.notes || !body.notes.user_id || !body.notes.pack_id) {
        console.error('Missing required top-up fields', { body });
        return new Response(
          JSON.stringify({ error: 'Missing required fields for top-up order' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid amount:', body.amount);
        return new Response(
          JSON.stringify({ error: 'Invalid amount. Must be a positive number.' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const txnid = body.receipt || `TOPUP_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const amountPaise = toPaise(amount);
      
      console.log('Creating Razorpay order for top-up:', { 
        user_id: body.notes!.user_id, 
        pack_id: body.notes!.pack_id, 
        amount, 
        amountPaise 
      });

      const order = await createRazorpayOrder(amountPaise, txnid, {
        user_id: body.notes!.user_id!,
        pack_id: body.notes!.pack_id!,
        identifications_count: String(body.notes!.identifications_count!),
        type: 'identification_pack'
      });

      // Note: topup_transactions record is created by frontend before calling this
      // Just return the order details

      return new Response(JSON.stringify({
        key: Deno.env.get('RAZORPAY_KEY_ID'),
        order_id: order.id,
        amount: amountPaise,
        currency: 'INR'
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      // Handle subscription order
      const required = ['planId','userId','userEmail','userName','amount','billingCycle'] as const;
      for (const f of required) {
        if (body[f] === undefined || body[f] === null || (typeof body[f] === 'string' && !body[f])) {
          console.error(`Missing required field: ${f}`, { body });
          return new Response(
            JSON.stringify({ error: `Missing required field: ${f}` }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Validate amount is a positive number
      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid amount:', body.amount);
        return new Response(
          JSON.stringify({ error: 'Invalid amount. Must be a positive number.' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const txnid = `TXN_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const amountPaise = toPaise(amount);
      
      console.log('Creating Razorpay order for subscription:', { 
        planId: body.planId, 
        userId: body.userId, 
        amount, 
        amountPaise, 
        billingCycle: body.billingCycle 
      });

      const order = await createRazorpayOrder(amountPaise, txnid, {
        planId: String(body.planId),
        userId: String(body.userId),
        billingCycle: String(body.billingCycle),
      });

      const { error: insertError } = await supabase
        .from('payment_transactions')
        .insert({
          transaction_id: txnid,
          user_id: String(body.userId),
          plan_id: String(body.planId),
          amount: Number(body.amount),
          currency: 'INR',
          status: 'pending',
          payment_method: 'razorpay',
          billing_cycle: String(body.billingCycle),
          razorpay_order_id: order.id,
          razorpay_response: order
        });
      if (insertError) {
        throw new Error(`Failed to insert transaction: ${insertError.message}`);
      }

      const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';
      const callbackUrl = `${appUrl}/payment-result`;

      return new Response(JSON.stringify({
        key: Deno.env.get('RAZORPAY_KEY_ID'),
        order_id: order.id,
        amount: amountPaise,
        currency: 'INR',
        callback_url: callbackUrl,
        transaction_id: txnid
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('razorpay-order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack || '' : '';
    
    // Log detailed error for debugging
    console.error('Error details:', {
      message,
      stack,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal error', 
        message,
        details: stack.split('\n')[0] // First line of stack trace
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
