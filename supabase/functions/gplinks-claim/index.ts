// @ts-nocheck
// This file runs in Supabase Deno Edge Runtime, local TS will not have Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const DAILY_CLAIM_LIMIT = 5;
const TOKEN_EXPIRY_MINUTES = 30;

// ============================================================================
// Round-Robin URL Shortener Provider Configuration
// Claim 1     → GPLinks   (unique IP view on GPLinks)
// Claim 2, 3  → Exe.io    (unique IP view on Exe.io)
// Claim 4, 5  → ShrinkMe  (unique IP view on ShrinkMe)
// ============================================================================
interface ShortenerProvider {
    name: string;
    getUrl: (apiToken: string, encodedUrl: string, alias: string) => string;
    parseResponse: (data: any) => { success: boolean; shortUrl?: string; error?: string };
}

const PROVIDERS: Record<string, ShortenerProvider> = {
    gplinks: {
        name: 'GPLinks',
        getUrl: (apiToken, encodedUrl, alias) =>
            `https://api.gplinks.com/api?api=${apiToken}&url=${encodedUrl}&alias=${alias}`,
        parseResponse: (data) => {
            if (data.status === 'error') {
                return { success: false, error: data.message || 'GPLinks API error' };
            }
            return { success: true, shortUrl: data.shortenedUrl };
        }
    },
    exeio: {
        name: 'Exe.io',
        getUrl: (apiToken, encodedUrl, alias) =>
            `https://exe.io/api?api=${apiToken}&url=${encodedUrl}&alias=${alias}`,
        parseResponse: (data) => {
            if (data.status === 'error') {
                return { success: false, error: data.message || 'Exe.io API error' };
            }
            return { success: true, shortUrl: data.shortenedUrl };
        }
    },
    shrinkme: {
        name: 'ShrinkMe',
        getUrl: (apiToken, encodedUrl, alias) =>
            `https://shrinkme.io/api?api=${apiToken}&url=${encodedUrl}&alias=${alias}`,
        parseResponse: (data) => {
            if (data.status === 'error') {
                return { success: false, error: data.message || 'ShrinkMe API error' };
            }
            return { success: true, shortUrl: data.shortenedUrl };
        }
    }
};

function getProviderForClaim(claimNumber: number): { providerKey: string; envKey: string } {
    if (claimNumber <= 1) {
        return { providerKey: 'gplinks', envKey: 'GPLINKS_API_TOKEN' };
    } else if (claimNumber <= 3) {
        return { providerKey: 'exeio', envKey: 'EXE_IO_API_TOKEN' };
    } else {
        return { providerKey: 'shrinkme', envKey: 'SHRINKME_API_TOKEN' };
    }
}

// Extract real client IP from request headers
function getClientIP(req: Request): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("cf-connecting-ip")
        || req.headers.get("x-real-ip")
        || "unknown";
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json().catch(() => ({}));
        const action = body.action || "generate";

        // =======================================================================
        // ACTION: GENERATE
        // =======================================================================
        if (action === "generate") {
            const authHeader = req.headers.get("Authorization");
            if (!authHeader) {
                return new Response(
                    JSON.stringify({ success: false, error: "Authentication required" }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
                global: { headers: { Authorization: authHeader } }
            });

            const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
            if (authError || !user) {
                return new Response(
                    JSON.stringify({ success: false, error: "Invalid session" }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Get client IP and device ID
            const clientIP = getClientIP(req);
            const deviceId = body.deviceId || "";

            // ================================================================
            // TRIPLE-LAYER ABUSE PREVENTION
            // Check user_id + ip_address + device_id limits (all 5/24h)
            // ================================================================
            const { data: eligibility, error: eligibilityError } = await supabaseAdmin
                .rpc("check_claim_eligibility", {
                    p_user_id: user.id,
                    p_ip_address: clientIP,
                    p_device_id: deviceId,
                    p_limit: DAILY_CLAIM_LIMIT
                });

            if (eligibilityError) {
                console.error("Error checking eligibility:", eligibilityError);
                return new Response(
                    JSON.stringify({ success: false, error: "Failed to check claim limit" }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            if (!eligibility.eligible) {
                console.log(`🚫 Claim blocked | Reason: ${eligibility.reason} | User: ${user.id} | IP: ${clientIP} | Device: ${deviceId?.substring(0, 8)}... | Counts: user=${eligibility.user_count} ip=${eligibility.ip_count} device=${eligibility.device_count}`);
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Daily limit reached",
                        message: eligibility.message,
                        reason: eligibility.reason,
                        dailyClaimsUsed: Math.max(eligibility.user_count, eligibility.ip_count, eligibility.device_count),
                        dailyClaimsLimit: DAILY_CLAIM_LIMIT
                    }),
                    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Use the highest count among all 3 dimensions for determining provider
            const effectiveCount = Math.max(eligibility.user_count, eligibility.ip_count, eligibility.device_count);

            // Expire old pending tokens
            await supabaseAdmin
                .from("free_claim_tokens")
                .update({ status: "expired" })
                .eq("user_id", user.id)
                .eq("status", "pending")
                .lt("expires_at", new Date().toISOString());

            // Generate unique token
            const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").substring(0, 8);
            const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

            // Build callback URL
            const appUrl = Deno.env.get("APP_URL") || "https://pharmalens-drug-identify.vercel.app";
            const callbackUrl = `${appUrl}/claim-callback/${token}`;

            // ================================================================
            // ROUND-ROBIN: Pick provider based on effective claim number
            // ================================================================
            const nextClaimNumber = effectiveCount + 1;
            const { providerKey, envKey } = getProviderForClaim(nextClaimNumber);
            const provider = PROVIDERS[providerKey];
            const apiToken = Deno.env.get(envKey);

            if (!apiToken) {
                console.error(`Missing API token for ${provider.name} (env: ${envKey})`);
                return new Response(
                    JSON.stringify({ success: false, error: `${provider.name} API not configured` }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const uniqueAlias = `pl${token.substring(0, 10)}`;
            const encodedUrl = encodeURIComponent(callbackUrl);
            const shortenerApiUrl = provider.getUrl(apiToken, encodedUrl, uniqueAlias);

            console.log(`📎 [Claim ${nextClaimNumber}/5] Using ${provider.name} | User: ${user.id} | IP: ${clientIP} | Device: ${deviceId?.substring(0, 8)}...`);

            const shortenerResponse = await fetch(shortenerApiUrl);
            const shortenerData = await shortenerResponse.json();

            console.log(`📎 ${provider.name} response:`, JSON.stringify(shortenerData));

            const parsed = provider.parseResponse(shortenerData);

            if (!parsed.success || !parsed.shortUrl) {
                console.error(`${provider.name} API error:`, shortenerData);
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Failed to create short link",
                        detail: parsed.error || "Unknown error"
                    }),
                    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Save claim token with IP and device_id
            const { error: insertError } = await supabaseAdmin
                .from("free_claim_tokens")
                .insert({
                    user_id: user.id,
                    token: token,
                    status: "pending",
                    short_url: parsed.shortUrl,
                    expires_at: expiresAt.toISOString(),
                    ip_address: clientIP,
                    device_id: deviceId || null
                });

            if (insertError) {
                console.error("Error saving claim token:", insertError);
                return new Response(
                    JSON.stringify({ success: false, error: "Failed to create claim" }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            console.log(`✅ Claim #${nextClaimNumber} via ${provider.name} | User: ${user.id} | IP: ${clientIP}`);

            return new Response(
                JSON.stringify({
                    success: true,
                    shortUrl: parsed.shortUrl,
                    claimId: token.substring(0, 8),
                    provider: provider.name,
                    dailyClaimsUsed: nextClaimNumber,
                    dailyClaimsLimit: DAILY_CLAIM_LIMIT,
                    expiresInMinutes: TOKEN_EXPIRY_MINUTES
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =======================================================================
        // ACTION: VERIFY
        // =======================================================================
        if (action === "verify") {
            const claimToken = body.token;
            if (!claimToken) {
                return new Response(
                    JSON.stringify({ success: false, error: "Missing claim token" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const { data: tokenData, error: tokenError } = await supabaseAdmin
                .from("free_claim_tokens")
                .select("*")
                .eq("token", claimToken)
                .single();

            if (tokenError || !tokenData) {
                console.error("Token lookup error:", tokenError);
                return new Response(
                    JSON.stringify({ success: false, error: "Invalid or expired claim token" }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            if (tokenData.status === "claimed") {
                return new Response(
                    JSON.stringify({ success: false, error: "This reward has already been claimed" }),
                    { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            if (tokenData.status === "expired" || new Date(tokenData.expires_at) < new Date()) {
                await supabaseAdmin
                    .from("free_claim_tokens")
                    .update({ status: "expired" })
                    .eq("id", tokenData.id);

                return new Response(
                    JSON.stringify({ success: false, error: "Claim token has expired. Please generate a new one." }),
                    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const { error: incrementError } = await supabaseAdmin
                .rpc("increment_extra_identifications", {
                    p_user_id: tokenData.user_id,
                    p_amount: 1
                });

            if (incrementError) {
                console.error("Error incrementing identifications:", incrementError);
                return new Response(
                    JSON.stringify({ success: false, error: "Failed to credit identification" }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const clientIP = getClientIP(req);

            const { error: updateError } = await supabaseAdmin
                .from("free_claim_tokens")
                .update({
                    status: "claimed",
                    claimed_at: new Date().toISOString(),
                    ip_address: clientIP
                })
                .eq("id", tokenData.id);

            if (updateError) {
                console.error("Error updating claim status:", updateError);
            }

            const { data: newCount } = await supabaseAdmin
                .rpc("get_daily_claim_count", { p_user_id: tokenData.user_id });

            console.log(`🎉 Claim verified! User: ${tokenData.user_id} | Daily: ${newCount}/${DAILY_CLAIM_LIMIT}`);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Free identification added successfully!",
                    dailyClaimsUsed: newCount ?? 0,
                    dailyClaimsLimit: DAILY_CLAIM_LIMIT
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =======================================================================
        // ACTION: STATUS
        // =======================================================================
        if (action === "status") {
            const authHeader = req.headers.get("Authorization");
            if (!authHeader) {
                return new Response(
                    JSON.stringify({ success: false, error: "Authentication required" }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
                global: { headers: { Authorization: authHeader } }
            });

            const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
            if (authError || !user) {
                return new Response(
                    JSON.stringify({ success: false, error: "Invalid session" }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const { data: countData } = await supabaseAdmin
                .rpc("get_daily_claim_count", { p_user_id: user.id });

            return new Response(
                JSON.stringify({
                    success: true,
                    dailyClaimsUsed: countData ?? 0,
                    dailyClaimsLimit: DAILY_CLAIM_LIMIT
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: false, error: "Invalid action. Use: generate, verify, or status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Claim error:", error);
        const errMsg = error instanceof Error ? error.message : "Internal server error";
        return new Response(
            JSON.stringify({ success: false, error: errMsg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
