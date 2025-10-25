import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// PayU Configuration Service
// Manages PayU credentials and configuration settings

export interface PayUConfig {
  key: string;
  salt: string;
  environment: 'test' | 'production';
  baseUrl: string;
  webhookUrl: string;
}

export interface PayUEndpoints {
  paymentLink: string;
  verify: string;
  refund: string;
  webhook: string;
}

// PayU API endpoints
const PAYU_ENDPOINTS = {
  test: {
    paymentLink: 'https://test.payu.in/merchant/postservice?form=2',
    verify: 'https://test.payu.in/merchant/postservice.php?form=2',
    refund: 'https://test.payu.in/merchant/postservice.php?form=2',
    webhook: 'https://test.payu.in/merchant/postservice.php?form=2'
  },
  production: {
    paymentLink: 'https://secure.payu.in/merchant/postservice?form=2',
    verify: 'https://secure.payu.in/merchant/postservice.php?form=2',
    refund: 'https://secure.payu.in/merchant/postservice.php?form=2',
    webhook: 'https://secure.payu.in/merchant/postservice.php?form=2'
  }
};

// Get PayU configuration based on environment
export const getPayUConfig = (): PayUConfig => {
  const environment = (Deno.env.get('PAYU_ENVIRONMENT') || 'test') as 'test' | 'production';
  
  const config: PayUConfig = {
    key: Deno.env.get('PAYU_MERCHANT_KEY') || '',
    salt: Deno.env.get('PAYU_MERCHANT_SALT') || '',
    environment,
    baseUrl: PAYU_ENDPOINTS[environment].paymentLink,
    webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payu-webhook`
  };

  // Validate configuration
  if (!config.key || !config.salt) {
    throw new Error(`PayU configuration incomplete for ${environment} environment`);
  }

  return config;
};

// Get PayU endpoints based on environment
export const getPayUEndpoints = (environment: 'test' | 'production' = 'test'): PayUEndpoints => {
  return PAYU_ENDPOINTS[environment];
};

// Generate PayU hash for secure transactions
export const generatePayUHash = async (
  key: string,
  salt: string,
  txnid: string,
  amount: string,
  productinfo: string,
  firstname: string,
  email: string,
  udf1: string = '',
  udf2: string = '',
  udf3: string = '',
  udf4: string = '',
  udf5: string = ''
): Promise<string> => {
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(hashString);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

// Verify PayU response hash
export const verifyPayUResponse = async (
  salt: string,
  status: string,
  udf1: string = '',
  udf2: string = '',
  udf3: string = '',
  udf4: string = '',
  udf5: string = '',
  email: string,
  firstname: string,
  productinfo: string,
  amount: string,
  txnid: string,
  key: string
): Promise<string> => {
  const hashString = `${salt}|${status}|${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(hashString);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

// CORS headers for API responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Main function for configuration endpoint
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const config = getPayUConfig();
    const endpoints = getPayUEndpoints(config.environment);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          environment: config.environment,
          endpoints,
          webhookUrl: config.webhookUrl
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('PayU config error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Configuration error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});