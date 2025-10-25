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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const returnUrl = url.searchParams.get('returnUrl') || (Deno.env.get('APP_URL') || 'http://localhost:8080') + '/payment-result';

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Robust body parsing for PayU (supports urlencoded, multipart and json)
    const contentType = req.headers.get('content-type')?.toLowerCase() || '';
    const payload: Record<string, string> = {};
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
      // Fallback: try URLSearchParams
      const text = await req.text();
      const params = new URLSearchParams(text);
      for (const [key, value] of params.entries()) payload[key] = String(value);
    }

    const txnid = payload.txnid;
    const status = payload.status?.toLowerCase();

    // Verify hash (PayU response hash: salt|status|udf10|...|udf1|email|firstname|productinfo|amount|txnid|key)
    const merchantKey = Deno.env.get('PAYU_MERCHANT_KEY') || '';
    const merchantSalt = Deno.env.get('PAYU_MERCHANT_SALT') || '';
    const responseHash = payload.hash || '';

    // Use 10 empty UDF placeholders
    const calcHashString = `${merchantSalt}|${status}||||||||||${payload.email}|${payload.firstname}|${payload.productinfo}|${payload.amount}|${txnid}|${merchantKey}`;
    const enc = new TextEncoder();
    const data = enc.encode(calcHashString);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calcHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const hashValid = !!merchantSalt && !!merchantKey && !!responseHash && responseHash === calcHash;

    // Update transaction in DB
    if (txnid) {
      const normalizedStatus = status === 'success' ? 'success' : status === 'failure' ? 'failed' : status === 'pending' ? 'pending' : 'failed';
      const updateFields: Record<string, any> = {
        status: normalizedStatus,
        payu_payment_id: payload.payuMoneyId || payload.mihpayid || null,
        payu_response: payload
      };

      await supabase
        .from('payment_transactions')
        .update(updateFields)
        .eq('transaction_id', txnid);
    }

    // Build redirect URL to SPA
    const qp = new URLSearchParams({
      txnid: txnid || '',
      status: status || 'failed',
      hashValid: String(hashValid),
      mihpayid: payload.mihpayid || '',
      amount: payload.amount || '',
      mode: payload.mode || '',
      error: payload.error_Message || '',
    });

    const redirectUrl = `${returnUrl}?${qp.toString()}`;

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