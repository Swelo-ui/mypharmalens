
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
        
        // Always save - no need for explicit save option anymore
        // Allow saving even if drugName is missing - use a fallback
        const drugName = data.drugName || "Unknown Medication";
        
        console.log(`Adding identification for user ${data.userId}, drug ${drugName}`);
        
        // Ensure we store all available drug details to show in history
        const identificationData = {
          user_id: data.userId,
          drug_name: drugName,
          // Don't store image_url anymore to save space
          details: extractEssentialDetails(data.details || null),
        };
          
        // Use the service role key to bypass RLS policies for insertion
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        
        try {
          result = await adminClient
            .from('drug_identifications')
            .insert([identificationData])
            .select();
            
          if (result.error) {
            console.error('Error inserting drug identification:', result.error);
            throw new Error(result.error.message);
          }
            
          console.log('Insert result:', result);
        } catch (insertError) {
          console.error('Database insert error:', insertError);
          throw new Error(`Database operation failed: ${insertError.message}`);
        }
        break;
        
      case 'removeIdentification':
        // Remove a drug identification from history
        if (!data.id || !data.userId) {
          throw new Error('Missing required fields: id and userId are required for deletion');
        }
        
        // Use service role key to ensure deletion works regardless of session state
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const adminClientForDelete = createClient(supabaseUrl, serviceKey);
        
        try {
          result = await adminClientForDelete
            .from('drug_identifications')
            .delete()
            .eq('id', data.id)
            .eq('user_id', data.userId);
            
          if (result.error) {
            console.error('Error deleting drug identification:', result.error);
            throw new Error(result.error.message);
          }
        } catch (deleteError) {
          console.error('Database delete error:', deleteError);
          throw new Error(`Database operation failed: ${deleteError.message}`);
        }
        break;
        
      case 'getIdentificationHistory':
        // Get user's identification history
        if (!data.userId) {
          throw new Error('Missing required field: userId is required');
        }
        
        // Use service role key to ensure queries work regardless of session state
        const serviceKeyForGet = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const adminClientForGet = createClient(supabaseUrl, serviceKeyForGet);
        
        try {
          result = await adminClientForGet
            .from('drug_identifications')
            .select('*')
            .eq('user_id', data.userId)
            .order('created_at', { ascending: false });
            
          if (result.error) {
            console.error('Error fetching drug identification history:', result.error);
            throw new Error(result.error.message);
          }
        } catch (getError) {
          console.error('Database query error:', getError);
          throw new Error(`Database operation failed: ${getError.message}`);
        }
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: result?.data || [], 
      error: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
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

// Function to extract only essential details for storage
function extractEssentialDetails(details: any) {
  if (!details) return null;
  
  try {
    // If it's a string, parse it
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch (e) {
        return details; // Return as is if can't parse
      }
    }
    
    // Extract only essential information to reduce storage
    return {
      id: details.id,
      name: details.name,
      genericName: details.genericName || details.generic_name,
      category: details.category,
      drugClass: details.drugClass,
      indications: details.indications || [],
      manufacturer: details.manufacturer,
      prescriptionStatus: details.prescriptionStatus
    };
  } catch (error) {
    console.error('Error extracting essential details:', error);
    return details; // Return original if extraction fails
  }
}
