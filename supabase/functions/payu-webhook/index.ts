import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// TypeScript shim for editors not using Deno language server
// This avoids ts(2304) for global Deno in VSCode Node projects
declare const Deno: any;

// @ts-ignore - VSCode Node TS cannot resolve remote ESM; valid in Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore - VSCode Node TS flags .ts extension; valid in Deno runtime
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client once
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  console.log(`PayU Webhook called with method: ${req.method}, URL: ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Explicitly allow GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed. Only GET and POST are supported.` }),
      { 
        status: 405, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Allow': 'GET, POST, OPTIONS'
        } 
      }
    );
  }

  try {
    const url = new URL(req.url);
    const returnUrl = url.searchParams.get('returnUrl') || (Deno.env.get('APP_URL') || 'https://pharmanotes.me') + '/payment-result';

    // Accept both POST (standard) and GET (some gateways fallback) methods
    const method = req.method;
    console.log(`Processing ${method} request to webhook`);
    console.log(`Query params:`, Object.fromEntries(url.searchParams.entries()));

    // Robust body parsing for PayU (supports urlencoded, multipart, json, and GET query)
    const contentType = req.headers.get('content-type')?.toLowerCase() || '';
    const payload: Record<string, string> = {};
    console.log(`Content-Type: ${contentType}`);

    if (method === 'POST') {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await req.text();
        const params = new URLSearchParams(text);
        for (const [key, value] of params.entries()) payload[key] = String(value);
      } else if (contentType.includes('multipart/form-data')) {
        const form = await req.formData();
        for (const [key, value] of form.entries()) payload[key] = String(value);
      } else if (contentType.includes('application/json')) {
        const json = await req.json();
        for (const key of Object.keys(json)) payload[key] = String(json[key]);
      } else {
        // Fallback: try parsing raw text as params
        const text = await req.text();
        const params = new URLSearchParams(text);
        for (const [key, value] of params.entries()) payload[key] = String(value);
      }
    } else if (method === 'GET') {
        // Some PayU flows may redirect with query params
        for (const [key, value] of url.searchParams.entries()) payload[key] = String(value);
      }

      console.log('Parsed payload:', payload);

      const txnid = payload.txnid;
      const status = (payload.status || url.searchParams.get('status') || '').toLowerCase();

      console.log(`Transaction ID: ${txnid}, Status: ${status}`);

    // Verify hash (PayU response hash: salt|status|udf10|...|udf1|email|firstname|productinfo|amount|txnid|key)
    const merchantKey = Deno.env.get('PAYU_MERCHANT_KEY') || '';
    const merchantSalt = Deno.env.get('PAYU_MERCHANT_SALT') || '';
    const responseHash = payload.hash || url.searchParams.get('hash') || '';

    // Use 10 empty UDF placeholders
    const calcHashString = `${merchantSalt}|${status}||||||||||${payload.email || url.searchParams.get('email') || ''}|${payload.firstname || url.searchParams.get('firstname') || ''}|${payload.productinfo || url.searchParams.get('productinfo') || ''}|${payload.amount || url.searchParams.get('amount') || ''}|${payload.txnid || url.searchParams.get('txnid') || ''}|${merchantKey}`;
    const enc = new TextEncoder();
    const data = enc.encode(calcHashString);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calcHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const hashValid = !!merchantSalt && !!merchantKey && !!responseHash && responseHash === calcHash;

    // Update transaction in DB, and activate subscription on success
    if (txnid) {
      const normalizedStatus = status === 'success' ? 'success' : status === 'failure' ? 'failed' : status === 'pending' ? 'pending' : 'failed';
      const nowIso = new Date().toISOString();
      const updateFields: Record<string, any> = {
        status: normalizedStatus,
        payu_payment_id: payload.payuMoneyId || payload.mihpayid || url.searchParams.get('mihpayid') || null,
        payu_response: payload,
        completed_at: normalizedStatus !== 'pending' ? nowIso : null,
        error_message: normalizedStatus === 'failed' ? (payload.error_Message || url.searchParams.get('error_Message') || 'Payment failed') : null,
      };

      const { data: tx } = await supabase
        .from('payment_transactions')
        .update(updateFields)
        .eq('transaction_id', txnid)
        .select('*')
        .single();

      // If payment succeeded, ensure the user's subscription is activated
      if (normalizedStatus === 'success' && tx && tx.user_id && tx.plan_id) {
        const endsAtMs = (tx.billing_cycle === 'yearly')
          ? Date.now() + 365 * 24 * 60 * 60 * 1000
          : Date.now() + 30 * 24 * 60 * 60 * 1000;
        const endsAtIso = new Date(endsAtMs).toISOString();

        // Try to update existing active subscription, else insert a new one
        const { data: existing } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', tx.user_id)
          .eq('status', 'active')
          .single();

        if (existing?.id) {
          await supabase
            .from('user_subscriptions')
            .update({
              plan_id: tx.plan_id,
              starts_at: nowIso,
              ends_at: endsAtIso,
              updated_at: nowIso,
              status: 'active',
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('user_subscriptions')
            .insert({
              user_id: tx.user_id,
              plan_id: tx.plan_id,
              status: 'active',
              starts_at: nowIso,
              ends_at: endsAtIso,
              created_at: nowIso,
              updated_at: nowIso,
            });
        }
      }
    }

    // Build redirect URL to SPA
    // If no transaction data is received, this might be a direct access or PayU error
    if (!txnid && !status && Object.keys(payload).length === 0) {
      console.log('No transaction data received - possible direct access or PayU error');
      // Redirect with generic failure
      const qp = new URLSearchParams({
        txnid: '',
        status: 'failed',
        hashValid: 'false',
        mihpayid: '',
        amount: '',
        mode: '',
        error: 'No transaction data received from payment gateway',
      });
      const redirectUrl = `${returnUrl}?${qp.toString()}`;
      console.log(`Redirecting to: ${redirectUrl}`);
      
      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
    <style>body{font-family:Arial;padding:40px;text-align:center}</style>
  </head>
  <body>
    <p>Redirecting back to application...</p>
    <p>If you are not redirected, <a href="${redirectUrl}">click here</a>.</p>
  </body>
</html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html', ...corsHeaders },
        status: 200
      });
    }

    const qp = new URLSearchParams({
      txnid: txnid || url.searchParams.get('txnid') || '',
      status: status || 'failed',
      hashValid: String(hashValid),
      mihpayid: payload.mihpayid || url.searchParams.get('mihpayid') || '',
      amount: payload.amount || url.searchParams.get('amount') || '',
      mode: payload.mode || url.searchParams.get('mode') || '',
      error: payload.error_Message || url.searchParams.get('error_Message') || '',
    });

    const redirectUrl = `${returnUrl}?${qp.toString()}`;
    console.log(`Redirecting to: ${redirectUrl}`);

    // Minimal HTML redirect
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
    <style>body{font-family:Arial;padding:40px;text-align:center}</style>
  </head>
  <body>
    <p>Redirecting back to application...</p>
    <p>If you are not redirected, <a href="${redirectUrl}">click here</a>.</p>
  </body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html', ...corsHeaders },
      status: 200
    });

  } catch (err: any) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});