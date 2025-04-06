
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // Get JWT token and body from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { couponCode } = await req.json();
    if (!couponCode) {
      throw new Error("No coupon code provided");
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
    console.log(`User ${userId} attempting to redeem coupon: ${couponCode}`);

    // Find the coupon code (case insensitive)
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from("coupon_codes")
      .select("*")
      .ilike("code", couponCode)
      .eq("is_active", true)
      .maybeSingle();

    if (couponError) {
      throw new Error(`Error finding coupon: ${couponError.message}`);
    }

    if (!coupon) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid or expired coupon code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check if coupon is expired
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, message: "This coupon has expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check if coupon has reached max uses
    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ success: false, message: "This coupon has reached its maximum number of uses" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Record the redemption
    const { data: redemption, error: redemptionError } = await supabaseAdmin
      .from("coupon_redemptions")
      .insert({
        user_id: userId,
        coupon_id: coupon.id,
        identifications_granted: coupon.identifications_granted
      })
      .select()
      .single();

    if (redemptionError) {
      throw new Error(`Error recording redemption: ${redemptionError.message}`);
    }

    // Update coupon usage count
    const { error: updateError } = await supabaseAdmin
      .from("coupon_codes")
      .update({ current_uses: (coupon.current_uses || 0) + 1 })
      .eq("id", coupon.id);

    if (updateError) {
      console.error(`Error updating coupon usage: ${updateError.message}`);
      // We'll continue anyway since the redemption was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully added ${coupon.identifications_granted} identifications to your account!`,
        identifications_added: coupon.identifications_granted
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in redeem-coupon:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
