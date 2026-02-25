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
// This maximizes revenue by ensuring each service sees unique IP views.
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

// Determine which provider to use based on claim number (1-indexed)
function getProviderForClaim(claimNumber: number): { providerKey: string; envKey: string } {
    if (claimNumber <= 1) {
        return { providerKey: 'gplinks', envKey: 'GPLINKS_API_TOKEN' };
    } else if (claimNumber <= 3) {
        return { providerKey: 'exeio', envKey: 'EXE_IO_API_TOKEN' };
    } else {
        return { providerKey: 'shrinkme', envKey: 'SHRINKME_API_TOKEN' };
    }
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

            // Get rolling 24h claim count
            const { data: countData, error: countError } = await supabaseAdmin
                .rpc("get_daily_claim_count", { p_user_id: user.id });

            if (countError) {
                console.error("Error checking daily claims:", countError);
                return new Response(
                    JSON.stringify({ success: false, error: "Failed to check claim limit" }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const dailyCount = countData ?? 0;
            if (dailyCount >= DAILY_CLAIM_LIMIT) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Daily limit reached",
                        dailyClaimsUsed: dailyCount,
                        dailyClaimsLimit: DAILY_CLAIM_LIMIT
                    }),
                    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

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

            // Build callback URL (path-based for uniqueness)
            const appUrl = Deno.env.get("APP_URL") || "https://pharmalens.tech";
            const callbackUrl = `${appUrl}/claim-callback/${token}`;

            // ================================================================
            // ROUND-ROBIN: Pick the right provider based on claim number
            // Claim 1 → GPLinks, Claim 2-3 → Exe.io, Claim 4-5 → ShrinkMe
            // ================================================================
            const nextClaimNumber = dailyCount + 1;
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

            // Create unique alias to prevent any caching/deduplication
            const uniqueAlias = `pl${token.substring(0, 10)}`;
            const encodedUrl = encodeURIComponent(callbackUrl);
            const shortenerApiUrl = provider.getUrl(apiToken, encodedUrl, uniqueAlias);

            console.log(`📎 [Claim ${nextClaimNumber}/5] Using ${provider.name} | Alias: ${uniqueAlias} | Callback: ${callbackUrl}`);

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

            const shortUrl = parsed.shortUrl;

            // Save claim token to database
            const { error: insertError } = await supabaseAdmin
                .from("free_claim_tokens")
                .insert({
                    user_id: user.id,
                    token: token,
                    status: "pending",
                    short_url: shortUrl,
                    expires_at: expiresAt.toISOString(),
                    ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"
                });

            if (insertError) {
                console.error("Error saving claim token:", insertError);
                return new Response(
                    JSON.stringify({ success: false, error: "Failed to create claim" }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            console.log(`✅ Claim #${nextClaimNumber} via ${provider.name} for user ${user.id} | Token: ${token.substring(0, 8)}...`);

            return new Response(
                JSON.stringify({
                    success: true,
                    shortUrl: shortUrl,
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

            const { error: updateError } = await supabaseAdmin
                .from("free_claim_tokens")
                .update({
                    status: "claimed",
                    claimed_at: new Date().toISOString(),
                    ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || tokenData.ip_address
                })
                .eq("id", tokenData.id);

            if (updateError) {
                console.error("Error updating claim status:", updateError);
            }

            const { data: newCount } = await supabaseAdmin
                .rpc("get_daily_claim_count", { p_user_id: tokenData.user_id });

            console.log(`🎉 Free identification claimed! User: ${tokenData.user_id} | Daily: ${newCount}/${DAILY_CLAIM_LIMIT}`);

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
