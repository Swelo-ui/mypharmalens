import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
declare const Deno: any;

interface OrderRequest {
  planId: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
}

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

    const body: OrderRequest & { action?: string } = await req.json();
    const action = body.action || 'create_order';

    if (action !== 'create_order') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const required = ['planId','userId','userEmail','userName','amount','billingCycle'] as const;
    for (const f of required) {
      if ((body as any)[f] === undefined || (body as any)[f] === null || (typeof (body as any)[f] === 'string' && !(body as any)[f])) {
        console.error(`Missing required field: ${f}`, { body });
        return new Response(JSON.stringify({ error: `Missing required field: ${f}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Validate amount is a positive number
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', body.amount);
      return new Response(JSON.stringify({ error: 'Invalid amount. Must be a positive number.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const txnid = `TXN_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    const amountPaise = toPaise(amount);
    
    console.log('Creating Razorpay order:', { planId: body.planId, userId: body.userId, amount, amountPaise, billingCycle: body.billingCycle });

    const order = await createRazorpayOrder(amountPaise, txnid, {
      planId: body.planId,
      userId: body.userId,
      billingCycle: body.billingCycle,
    });

    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: txnid,
        user_id: body.userId,
        plan_id: body.planId,
        amount: body.amount,
        currency: 'INR',
        status: 'pending',
        payment_method: 'razorpay',
        billing_cycle: body.billingCycle,
        razorpay_order_id: order.id,
        razorpay_response: order
      });
    if (insertError) {
      throw new Error(`Failed to insert transaction: ${insertError.message}`);
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';
    const callbackUrl = `${appUrl}/payment-result`;

    return new Response(JSON.stringify({
      keyId: Deno.env.get('RAZORPAY_KEY_ID'),
      amount: amountPaise,
      currency: 'INR',
      orderId: order.id,
      callbackUrl,
      transactionId: txnid
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('razorpay-order error:', error);
    const message = error?.message || 'Unknown error';
    const stack = error?.stack || '';
    
    // Log detailed error for debugging
    console.error('Error details:', {
      message,
      stack,
      name: error?.name,
      cause: error?.cause
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
