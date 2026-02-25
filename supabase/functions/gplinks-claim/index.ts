import "@supabase/functions-js/edge-runtime";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

const DAILY_CLAIM_LIMIT = 5;
const TOKEN_EXPIRY_MINUTES = 10;

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const gplinksApiToken = Deno.env.get("GPLINKS_API_TOKEN");

        if (!gplinksApiToken) {
            return new Response(
                JSON.stringify({ success: false, error: "GPLinks API not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        const body = await req.json().catch(() => ({}));
        const action = body.action || "generate";

        // =======================================================================
        // ACTION: GENERATE — Create a new claim link
        // =======================================================================
        if (action === "generate") {
            // Authenticate user
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

            // Check daily claim count
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

            // Cleanup any expired pending tokens for this user
            await supabaseAdmin
                .from("free_claim_tokens")
                .update({ status: "expired" })
                .eq("user_id", user.id)
                .eq("status", "pending")
                .lt("expires_at", new Date().toISOString());

            // Generate unique token
            const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").substring(0, 8);
            const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

            // Build the callback URL (goes to frontend page)
            const appUrl = Deno.env.get("APP_URL") || "https://pharmalens.tech";
            const callbackUrl = `${appUrl}/claim-callback?token=${token}`;

            // Call GPLinks API to create short link
            const encodedUrl = encodeURIComponent(callbackUrl);
            const gplinksUrl = `https://api.gplinks.com/api?api=${gplinksApiToken}&url=${encodedUrl}`;

            console.log("📎 Calling GPLinks API...");
            const gplinksResponse = await fetch(gplinksUrl);
            const gplinksData = await gplinksResponse.json();

            if (gplinksData.status === "error") {
                console.error("GPLinks API error:", gplinksData);
                return new Response(
                    JSON.stringify({ success: false, error: "Failed to create short link" }),
                    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const shortUrl = gplinksData.shortenedUrl;

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

            console.log(`✅ Claim token created for user ${user.id} | Token: ${token.substring(0, 8)}... | Daily: ${dailyCount + 1}/${DAILY_CLAIM_LIMIT}`);

            return new Response(
                JSON.stringify({
                    success: true,
                    shortUrl: shortUrl,
                    claimId: token.substring(0, 8),
                    dailyClaimsUsed: dailyCount + 1,
                    dailyClaimsLimit: DAILY_CLAIM_LIMIT,
                    expiresInMinutes: TOKEN_EXPIRY_MINUTES
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =======================================================================
        // ACTION: VERIFY — User returned from GPLinks, verify and credit
        // =======================================================================
        if (action === "verify") {
            const claimToken = body.token;
            if (!claimToken) {
                return new Response(
                    JSON.stringify({ success: false, error: "Missing claim token" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Look up the token
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

            // Check if already claimed
            if (tokenData.status === "claimed") {
                return new Response(
                    JSON.stringify({ success: false, error: "This reward has already been claimed" }),
                    { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Check if expired
            if (tokenData.status === "expired" || new Date(tokenData.expires_at) < new Date()) {
                // Mark as expired if not already
                await supabaseAdmin
                    .from("free_claim_tokens")
                    .update({ status: "expired" })
                    .eq("id", tokenData.id);

                return new Response(
                    JSON.stringify({ success: false, error: "Claim token has expired. Please generate a new one." }),
                    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Credit the user with +1 extra identification
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

            // Mark token as claimed
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
                // Don't fail — the credit was already given
            }

            // Get updated daily count
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
        // ACTION: STATUS — Get current daily claim status for user
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
        console.error("GPLinks claim error:", error);
        const errMsg = error instanceof Error ? error.message : "Internal server error";
        return new Response(
            JSON.stringify({ success: false, error: errMsg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
