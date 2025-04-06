
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

    // Check if the user has already claimed their daily free identifications today
    const { data: existingRecord, error: queryError } = await supabaseAdmin
      .from("daily_free_identifications")
      .select("*")
      .eq("user_id", userId)
      .eq("claimed_date", todayFormatted)
      .maybeSingle();

    if (queryError) {
      throw new Error(`Error checking existing daily claim: ${queryError.message}`);
    }

    if (existingRecord) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "You've already claimed your free identifications today",
          remaining: existingRecord.remaining_identifications
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create a new daily free identifications record
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("daily_free_identifications")
      .insert({
        user_id: userId,
        claimed_date: todayFormatted,
        remaining_identifications: 2,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error adding daily free identifications: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully claimed 2 free identifications for today!",
        remaining: 2
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in daily-free-identifications:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
