
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { format } from "https://deno.land/std@0.132.0/datetime/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client with the service role key (needed for admin operations)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    // Verify the JWT and get the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Error getting user");
    }

    const userId = user.id;
    const today = new Date();
    const todayFormatted = format(today, "yyyy-MM-dd");

    // Check active subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("subscription_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      throw new Error(`Error checking subscription: ${subscriptionError.message}`);
    }

    // Get total coupon redemptions
    const { data: couponRedemptions, error: couponError } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("identifications_granted")
      .eq("user_id", userId);

    if (couponError) {
      throw new Error(`Error checking coupon redemptions: ${couponError.message}`);
    }

    // Calculate total bonus identifications from coupons
    const bonusFromCoupons = couponRedemptions?.reduce(
      (total, item) => total + (item.identifications_granted || 0),
      0
    ) || 0;

    // Get daily free identifications
    const { data: dailyFree, error: dailyError } = await supabaseAdmin
      .from("daily_free_identifications")
      .select("remaining_identifications")
      .eq("user_id", userId)
      .eq("claimed_date", todayFormatted)
      .maybeSingle();

    if (dailyError) {
      throw new Error(`Error checking daily free identifications: ${dailyError.message}`);
    }

    const dailyFreeCount = dailyFree?.remaining_identifications || 0;
    const lastClaimed = dailyFree?.last_claimed_at ? new Date(dailyFree.last_claimed_at) : null;

    // Count identifications used this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { count: usedThisMonth, error: countError } = await supabaseAdmin
      .from("drug_identifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (countError) {
      throw new Error(`Error counting used identifications: ${countError.message}`);
    }

    // Calculate usage and limits
    const monthlyBaseLimit = subscription?.subscription_plans?.monthly_identifications || 0;
    const totalLimit = monthlyBaseLimit + bonusFromCoupons + dailyFreeCount;
    const remaining = Math.max(0, totalLimit - (usedThisMonth || 0));
    const used = usedThisMonth || 0;
    const percentage = totalLimit > 0 ? Math.round((used / totalLimit) * 100) : 100;

    // Determine if user can identify medications
    const canIdentify = remaining > 0;
    const message = canIdentify
      ? `You have ${remaining} identifications remaining`
      : "You've used all your identifications. Please upgrade your plan or redeem a coupon.";

    return new Response(
      JSON.stringify({
        canIdentify,
        message,
        usage: {
          used,
          total: totalLimit,
          remaining,
          percentage,
          base_monthly: monthlyBaseLimit,
          bonus_from_coupons: bonusFromCoupons,
          daily_free: dailyFreeCount,
          last_claimed: lastClaimed
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-subscription-status:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
