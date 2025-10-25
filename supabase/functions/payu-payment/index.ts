// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface PaymentRequest {
  planId: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  billingCycle: 'monthly' | 'weekly' | 'yearly';
  action?: string;
}

interface PayUConfig {
  merchantKey: string;
  merchantSalt: string;
  environment: string;
  webhookUrl: string;
}

async function getPayUConfig(): Promise<PayUConfig> {
  const merchantKey = Deno.env.get('PAYU_MERCHANT_KEY');
  const merchantSalt = Deno.env.get('PAYU_MERCHANT_SALT');
  const environment = Deno.env.get('PAYU_ENVIRONMENT') || 'test';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  if (!merchantKey || !merchantSalt || !supabaseUrl) {
    throw new Error('Missing required PayU configuration');
  }

  const webhookUrl = `${supabaseUrl}/functions/v1/payu-webhook`;

  return {
    merchantKey,
    merchantSalt,
    environment,
    webhookUrl
  };
}

function getPayUEndpoints(environment: string) {
  const isProduction = environment === 'production';
  
  return {
    payment: isProduction 
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment',
    verify: isProduction
      ? 'https://info.payu.in/merchant/postservice.php?form=2'
      : 'https://test.payu.in/merchant/postservice.php?form=2',
    refund: isProduction
      ? 'https://info.payu.in/merchant/postservice.php?form=2'
      : 'https://test.payu.in/merchant/postservice.php?form=2'
  };
}

async function generatePayUHash(
  key: string,
  txnid: string,
  amount: string,
  productinfo: string,
  firstname: string,
  email: string,
  salt: string
): Promise<string> {
  // PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  // UDF fields are empty, so we use empty strings for udf1-udf5, followed by 6 empty fields
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(hashString);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex.toLowerCase(); // PayU requires lowercase hash
}

async function createPaymentLink(paymentData: PaymentRequest): Promise<{ success: boolean; paymentUrl: string }> {
  try {
    console.log('Creating payment link for:', paymentData);

    const config = await getPayUConfig();
    const endpoints = getPayUEndpoints(config.environment);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique transaction ID
    const txnid = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('Generated transaction ID:', txnid);

    // Insert pending transaction
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_id: txnid,
        user_id: paymentData.userId,
        plan_id: paymentData.planId,
        amount: paymentData.amount,
        billing_cycle: paymentData.billingCycle,
        status: 'pending',
        payment_method: 'payu',
        payu_payment_id: null,
        payu_response: null
      });

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
      throw new Error(`Failed to create transaction: ${insertError.message}`);
    }

    console.log('Transaction inserted successfully');

    // Normalize amount and generate PayU hash
    const amountStr = Number(paymentData.amount).toFixed(2);
    const hash = await generatePayUHash(
      config.merchantKey,
      txnid,
      amountStr,
      `${paymentData.planId} - ${paymentData.billingCycle}`,
      paymentData.userName,
      paymentData.userEmail,
      config.merchantSalt
    );

    console.log('Generated PayU hash');

    // Build return URL to SPA via webhook handler
    const appUrl = Deno.env.get('APP_URL') || 'https://pharmanotes.me';
    const returnUrl = `${appUrl}/payment-result`;
    const webhookBase = `${supabaseUrl}/functions/v1/payu-webhook`;
    const successUrl = `${webhookBase}?returnUrl=${encodeURIComponent(returnUrl)}`;
    const failureUrl = successUrl; // use same handler; status derived from POST

    // Create PayU payment form HTML
    const paymentFormHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Processing Payment...</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <h2>Redirecting to PayU...</h2>
    <div class="loader"></div>
    <p>Please wait while we redirect you to the payment gateway.</p>

    <form id="payuForm" action="${endpoints.payment}" method="post">
        <input type="hidden" name="key" value="${config.merchantKey}" />
        <input type="hidden" name="txnid" value="${txnid}" />
        <input type="hidden" name="amount" value="${amountStr}" />
        <input type="hidden" name="productinfo" value="${paymentData.planId} - ${paymentData.billingCycle}" />
        <input type="hidden" name="firstname" value="${paymentData.userName}" />
        <input type="hidden" name="email" value="${paymentData.userEmail}" />
        <input type="hidden" name="phone" value="" />
        <!-- Explicitly include all UDF fields to match hash (10 empties) -->
        <input type="hidden" name="udf1" value="" />
        <input type="hidden" name="udf2" value="" />
        <input type="hidden" name="udf3" value="" />
        <input type="hidden" name="udf4" value="" />
        <input type="hidden" name="udf5" value="" />
        <input type="hidden" name="udf6" value="" />
        <input type="hidden" name="udf7" value="" />
        <input type="hidden" name="udf8" value="" />
        <input type="hidden" name="udf9" value="" />
        <input type="hidden" name="udf10" value="" />
        <input type="hidden" name="surl" value="${successUrl}" />
        <input type="hidden" name="furl" value="${failureUrl}" />
        <input type="hidden" name="hash" value="${hash}" />
        <input type="hidden" name="service_provider" value="payu_paisa" />
    </form>

    <script>
        document.getElementById('payuForm').submit();
    </script>
</body>
</html>`;

    // Convert HTML to base64 data URL
    const base64Html = btoa(paymentFormHtml);
    const paymentUrl = `data:text/html;base64,${base64Html}`;

    console.log('Payment link created successfully');

    return { success: true, paymentUrl };

  } catch (error: any) {
    console.error('Error in createPaymentLink:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('PayU Payment function called with method:', req.method);
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const paymentData: PaymentRequest = await req.json();
    console.log('Received payment data:', paymentData);

    // Support both create and verify actions
    if (paymentData.action === 'verify_payment') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const txnId = (paymentData as any).transactionId;
      if (!txnId) {
        return new Response(
          JSON.stringify({ error: 'Missing transactionId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: tx, error: txErr } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', txnId)
        .single();

      if (txErr) {
        return new Response(
          JSON.stringify({ error: txErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const status = tx?.status || 'pending';
      return new Response(
        JSON.stringify({ status, transaction: tx }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields for create_payment
    const requiredFields = ['planId', 'userId', 'userEmail', 'userName', 'amount', 'billingCycle'];
    for (const field of requiredFields) {
      if (!paymentData[field as keyof PaymentRequest]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    const result = await createPaymentLink(paymentData);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('PayU Payment function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});