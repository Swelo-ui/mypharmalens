
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with the auth context from the request
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Set the auth token in the Supabase client
    supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: '',
    });

    // Parse request body
    const { action, data } = await req.json();
    console.log(`Received action: ${action} with data:`, data);

    let result;
    switch (action) {
      case 'addIdentification':
        // Validate required fields
        if (!data.userId) {
          throw new Error('Missing required field: userId is required');
        }
        
        // Allow saving even if drugName is missing - use a fallback
        const drugName = data.drugName || "Unknown Medication";
        
        console.log(`Adding identification for user ${data.userId}, drug ${drugName}`);
        
        // Create object with only fields that exist in the database table
        const identificationData = {
          user_id: data.userId,
          drug_name: drugName,
          image_url: data.imageUrl || null,
          details: data.details || null,
        };
        
        // Add image_features only if the column exists in the schema and if data is provided
        try {
          // First attempt to check if we can query the table with the image_features column
          const { error: columnCheckError } = await supabaseClient
            .from('drug_identifications')
            .select('image_features')
            .limit(1);
          
          if (!columnCheckError) {
            // Column exists, we can add the image_features field
            if (data.imageFeatures) {
              identificationData.image_features = data.imageFeatures;
            }
          } else {
            console.log('image_features column does not exist, skipping this field');
          }
        } catch (err) {
          console.log('Error checking for image_features column, skipping this field:', err.message);
        }
          
        result = await supabaseClient
          .from('drug_identifications')
          .insert([identificationData])
          .select();
          
        console.log('Insert result:', result);
        break;
        
      case 'removeIdentification':
        // Remove a drug identification from history
        if (!data.id || !data.userId) {
          throw new Error('Missing required fields: id and userId are required for deletion');
        }
        
        result = await supabaseClient
          .from('drug_identifications')
          .delete()
          .eq('id', data.id)
          .eq('user_id', data.userId);
        break;
        
      case 'getIdentificationHistory':
        // Get user's identification history
        if (!data.userId) {
          throw new Error('Missing required field: userId is required');
        }
        
        result = await supabaseClient
          .from('drug_identifications')
          .select('*')
          .eq('user_id', data.userId)
          .order('created_at', { ascending: false });
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (result.error) {
      console.error('Database operation error:', result.error);
      throw new Error(`Database operation failed: ${result.error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: result.data, 
      error: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in manage-drug-history function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      data: null,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
