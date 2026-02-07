import { serve } from "std/http/server";
import { createClient } from "supabase";
import { corsHeaders } from "../_shared/cors.ts";

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "20minutemail.com",
  "2prong.com",
  "armyspy.com",
  "binkmail.com",
  "byom.de",
  "cool.fr.nf",
  "deadaddress.com",
  "discard.email",
  "disposableemailaddresses.com",
  "dispostable.com",
  "emailfake.com",
  "emailondeck.com",
  "fake-email.com",
  "fakemail.net",
  "fakemailgenerator.com",
  "getnada.com",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "maildrop.cc",
  "mailinator.com",
  "mailinator.net",
  "mailinator.org",
  "mailnesia.com",
  "mintemail.com",
  "mytemp.email",
  "nada.ltd",
  "nada.email",
  "nospamfor.us",
  "nowmymail.com",
  "onewaymail.com",
  "prtnx.com",
  "sharklasers.com",
  "spamgourmet.com",
  "spamhole.com",
  "spambox.us",
  "spamcero.com",
  "spamex.com",
  "spamfree24.com",
  "spamfree24.org",
  "spaminator.de",
  "spamla.com",
  "spamspot.com",
  "tempmail.com",
  "tempmail.net",
  "tempmail.org",
  "temp-mail.com",
  "temp-mail.de",
  "temp-mail.io",
  "temp-mail.net",
  "temp-mail.org",
  "tempinbox.com",
  "tempinbox.co.uk",
  "tempinbox.xyz",
  "tempail.com",
  "tempmails.net",
  "tempmails.org",
  "tempmailo.com",
  "temporary-email.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "trashmail.net",
  "trashmail.org",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "jetable.org",
  "mailinator.co",
  "mailinator.us",
  "mailinator2.com",
  "guerrillamailblock.com",
  "emailtemporario.com.br",
  "tempr.email",
  "tempmail.dev",
  "temp-mail.biz",
  "temp-mail.pro",
  "tempmail.plus",
  "dropmail.me",
  "dropmail.io",
  "dropmail.com",
  "inboxkitten.com",
  "moakt.com",
  "safetymail.info",
  "grr.la",
  "guerrillamail.info"
]);

const getClientIp = (req: Request) => {
  const cfConnecting = req.headers.get('cf-connecting-ip');
  const realIp = req.headers.get('x-real-ip');
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = cfConnecting || realIp || forwarded;
  if (!ip) return 'unknown';
  return ip.split(',')[0].trim() || 'unknown';
};

let BLOCKLIST_CACHE: { set: Set<string>; loadedAt: number } | null = null;

const loadDisposableBlocklist = async (): Promise<Set<string>> => {
  const now = Date.now();
  if (BLOCKLIST_CACHE && now - BLOCKLIST_CACHE.loadedAt < 6 * 60 * 60 * 1000) {
    return BLOCKLIST_CACHE.set;
  }
  try {
    const [blockRes, allowRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf', { method: 'GET' }),
      fetch('https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/allowlist.conf', { method: 'GET' })
    ]);
    if (!blockRes.ok) throw new Error('Failed to fetch blocklist');
    const blockText = await blockRes.text();
    const allowText = allowRes.ok ? await allowRes.text() : '';
    const set = new Set<string>();
    for (const line of blockText.split(/\r?\n/)) {
      const d = line.trim().toLowerCase();
      if (d && !d.startsWith('#')) set.add(d);
    }
    for (const line of allowText.split(/\r?\n/)) {
      const d = line.trim().toLowerCase();
      if (d && !d.startsWith('#')) set.delete(d);
    }
    BLOCKLIST_CACHE = { set, loadedAt: now };
    return set;
  } catch {
    return DISPOSABLE_DOMAINS;
  }
};

const isDisposableDomain = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (!domain) return false;
  const blocklist = await loadDisposableBlocklist();
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    if (blocklist.has(candidate)) return true;
  }
  return false;
};

type SecurityLogInsertResult = {
  error?: { message?: string } | null;
};

type SecurityLogCountResult = {
  count?: number | null;
  error?: { message?: string } | null;
};

type SecurityLogCountQuery = {
  eq: (column: string, value: string) => SecurityLogCountQuery;
  gt: (column: string, value: string) => Promise<SecurityLogCountResult>;
};

type SupabaseClientLike = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<SecurityLogInsertResult>;
    select: (
      columns: string,
      options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }
    ) => SecurityLogCountQuery;
    upsert?: (
      values: Record<string, unknown>,
      options?: { onConflict?: string }
    ) => Promise<{ error?: { message?: string } | null }>;
  };
  auth: {
    admin: {
      createUser: (params: {
        email: string;
        password: string;
        email_confirm: boolean;
        user_metadata: { device_fingerprint: string };
      }) => Promise<{ data: { user: { id: string } }; error?: { message?: string } | null }>;
    };
  };
};

const logSecurityEvent = async (
  supabaseAdmin: SupabaseClientLike,
  {
    ip,
    deviceFingerprint,
    domain,
    eventType,
    metadata
  }: {
    ip: string;
    deviceFingerprint?: string;
    domain?: string | null;
    eventType: string;
    metadata?: Record<string, unknown>;
  }
) => {
  const { error } = await supabaseAdmin.from('security_logs').insert({
    ip_address: ip,
    device_fingerprint: deviceFingerprint || 'unknown',
    email_domain: domain ?? null,
    event_type: eventType,
    metadata: metadata ?? {}
  });

  if (error) {
    console.error('Security log insert error:', error);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase Environment Variables');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Supabase keys' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }) as unknown as SupabaseClientLike;
    const ip = getClientIp(req);
    
    // Handle potential empty body or invalid JSON
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, turnstileToken, deviceFingerprint, honeypot } = body;

    console.log(`Signup attempt for email: ${email}, IP: ${ip}`);

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const passwordValue = typeof password === 'string' ? password : '';
    const deviceId = typeof deviceFingerprint === 'string' ? deviceFingerprint : '';
    const honeypotValue = typeof honeypot === 'string' ? honeypot : '';

    if (honeypotValue) {
      await logSecurityEvent(supabaseAdmin, {
        ip,
        deviceFingerprint: deviceId,
        domain: null,
        eventType: 'signup_blocked',
        metadata: { reason: 'honeypot' }
      });
      return new Response(JSON.stringify({ 
        user: { id: '00000000-0000-0000-0000-000000000000' }, 
        session: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!normalizedEmail || !passwordValue) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const domain = normalizedEmail.split('@')[1] || '';
    if (await isDisposableDomain(normalizedEmail)) {
      await logSecurityEvent(supabaseAdmin, {
        ip,
        deviceFingerprint: deviceId,
        domain,
        eventType: 'signup_blocked',
        metadata: { reason: 'disposable_email' }
      });
      return new Response(JSON.stringify({ error: 'Please use a permanent email address (e.g., Gmail, Yahoo).' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (!turnstileSecret) {
      console.error('Missing TURNSTILE_SECRET_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Turnstile secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const turnstileResponse = typeof turnstileToken === 'string' ? turnstileToken : '';
    if (!turnstileResponse) {
      console.log('Missing Turnstile token');
      await logSecurityEvent(supabaseAdmin, {
        ip,
        deviceFingerprint: deviceId,
        domain,
        eventType: 'signup_blocked',
        metadata: { reason: 'missing_turnstile' }
      });
      return new Response(JSON.stringify({ error: 'Security check required.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const turnstileBody = new URLSearchParams({
      secret: turnstileSecret,
      response: turnstileResponse
    });
    if (ip !== 'unknown') {
      turnstileBody.set('remoteip', ip);
    }
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: turnstileBody.toString(),
    });
    if (!turnstileRes.ok) {
      console.error(`Turnstile HTTP error: ${turnstileRes.status}`);
      return new Response(JSON.stringify({ error: 'Security check failed (Turnstile API error). Please try again.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const turnstileData = await turnstileRes.json();
    if (!turnstileData.success) {
      console.log('Turnstile verification failed:', turnstileData);
      await logSecurityEvent(supabaseAdmin, {
        ip,
        deviceFingerprint: deviceId,
        domain,
        eventType: 'signup_blocked',
        metadata: { reason: 'turnstile_failed' }
      });
      return new Response(JSON.stringify({ error: 'Security check failed. Please try again.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    let ipCount: number | null | undefined = 0;
    if (ip !== 'unknown') {
      const { count, error: ipError } = await supabaseAdmin
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('event_type', 'signup_success')
        .gt('created_at', windowStart);

      if (ipError) {
        console.error('IP Check Error:', ipError);
      }

      ipCount = count ?? 0;
      if (ipCount >= 3) {
        await logSecurityEvent(supabaseAdmin, {
          ip,
          deviceFingerprint: deviceId,
          domain,
          eventType: 'signup_blocked',
          metadata: { reason: 'ip_rate_limit' }
        });
        return new Response(JSON.stringify({ error: 'Too many accounts were created from this network in the last 30 days. Please try again later, or log in with your existing account and enjoy.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let deviceCountValue = 0;
    if (deviceId) {
        const { count: deviceCount, error: deviceError } = await supabaseAdmin
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .eq('device_fingerprint', deviceId)
        .eq('event_type', 'signup_success')
        .gt('created_at', windowStart);

        if (deviceError) console.error('Device Check Error:', deviceError);

        deviceCountValue = deviceCount ?? 0;
        if (deviceCountValue >= 1) {
        await logSecurityEvent(supabaseAdmin, {
          ip,
          deviceFingerprint: deviceId,
          domain,
          eventType: 'signup_blocked',
          metadata: { reason: 'device_rate_limit' }
        });
        return new Response(JSON.stringify({ error: 'Too many accounts were created from this device in the last 30 days. Please try again later, or log in with your existing account and enjoy.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        }
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: passwordValue,
      email_confirm: true,
      user_metadata: { device_fingerprint: deviceId }
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message || 'Unable to create account' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await logSecurityEvent(supabaseAdmin, {
      ip,
      deviceFingerprint: deviceId,
      domain,
      eventType: 'signup_success',
      metadata: { email_domain: domain }
    });

    const secondFromIp = (ipCount ?? 0) === 1;
    const secondFromDevice = deviceId ? deviceCountValue === 1 : false;
    if (secondFromIp && secondFromDevice) {
      const nowIso = new Date().toISOString();
      const { error: profileErr } = await (supabaseAdmin.from('profiles').upsert?.({
        id: authData.user.id,
        identifications_used: 5,
        monthly_identifications: 5,
        last_reset_date: nowIso
      }, { onConflict: 'id' }) ?? Promise.resolve({ error: null }));
      if (profileErr) {
        console.error('Profile exhaustion set error:', profileErr);
      }
    }

    return new Response(JSON.stringify({ 
        success: true, 
        message: 'Account created successfully',
        user: authData.user 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Secure Signup Error:', error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
