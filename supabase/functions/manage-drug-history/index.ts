
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
        
        // Save full drug details to enable proper viewing in history
        const identificationData = {
          user_id: data.userId,
          drug_name: drugName,
          image_url: data.imageUrl || null,
          details: data.details || null,
          image_features: data.imageFeatures || null,
        };
        
        // Use the service role key to bypass RLS policies for insertion
        // This ensures that we can always save the identification regardless of RLS policies
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        
        result = await adminClient
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
        
        // Use service role key to ensure deletion works regardless of session state
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const adminClientForDelete = createClient(supabaseUrl, serviceKey);
        
        result = await adminClientForDelete
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
        
        // Use service role key to ensure queries work regardless of session state
        const serviceKeyForGet = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const adminClientForGet = createClient(supabaseUrl, serviceKeyForGet);
        
        result = await adminClientForGet
          .from('drug_identifications')
          .select('*')
          .eq('user_id', data.userId)
          .order('created_at', { ascending: false });
        break;
        
      case 'getDrugDetail':
        // Get detailed drug information from history
        if (!data.id || !data.userId) {
          throw new Error('Missing required fields: id and userId are required');
        }
        
        const serviceKeyForDetail = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const adminClientForDetail = createClient(supabaseUrl, serviceKeyForDetail);
        
        result = await adminClientForDetail
          .from('drug_identifications')
          .select('*')
          .eq('id', data.id)
          .eq('user_id', data.userId)
          .single();
        
        // If the record is found but details are stored as a string, parse it to JSON
        if (result?.data && result.data.details && typeof result.data.details === 'string') {
          try {
            result.data.details = JSON.parse(result.data.details);
          } catch (e) {
            console.error('Error parsing drug details from string:', e);
          }
        }
        
        // If there are still details as an object, add them to the main data object
        // for easier access in the frontend
        if (result?.data?.details && typeof result.data.details === 'object') {
          result.data = {
            ...result.data,
            ...result.data.details
          };
        }
        
        // Ensure all expected fields exist with proper types
        if (result?.data) {
          // Convert arrays if they're stored as strings
          ['side_effects', 'warnings', 'interactions', 'indications', 'contraindications', 'brand_names'].forEach(field => {
            if (result.data[field] && typeof result.data[field] === 'string') {
              try {
                result.data[field] = JSON.parse(result.data[field]);
              } catch (e) {
                result.data[field] = [];
              }
            } else if (!result.data[field]) {
              result.data[field] = [];
            }
          });
          
          // Ensure prescription_status has a valid value
          if (!result.data.prescription_status) {
            result.data.prescription_status = "OTC";
          }
        }
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (result?.error) {
      console.error('Database operation error:', result.error);
      throw new Error(`Database operation failed: ${result.error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: result?.data || [], 
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
