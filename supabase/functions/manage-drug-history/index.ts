
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
    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with the auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });

    // Parse request body
    const { action, data } = await req.json();
    console.log(`Received action: ${action} with data:`, data);

    let result;
    switch (action) {
      case 'getHistoryCount':
        // Get count of user's history
        if (!data.userId) {
          throw new Error('Missing required field: userId is required');
        }
        
        const { count, error: countError } = await supabaseClient
          .from('drug_identifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', data.userId);
          
        if (countError) {
          throw new Error(`Failed to get history count: ${countError.message}`);
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: count || 0,
          error: null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'addIdentification':
        // Validate required fields
        if (!data.userId) {
          throw new Error('Missing required field: userId is required');
        }
        
        // Allow saving even if drugName is missing - use a fallback
        const drugName = data.drugName || "Unknown Medication";
        
        console.log(`Adding identification for user ${data.userId}, drug ${drugName}`);
        
        // Check current history count
        const { data: existingHistory, error: historyError } = await supabaseClient
          .from('drug_identifications')
          .select('id, created_at')
          .eq('user_id', data.userId)
          .order('created_at', { ascending: true });
          
        if (historyError) {
          console.warn('Could not check history count:', historyError);
        }
        
        // If user has 10 or more records, delete the oldest one
        if (existingHistory && existingHistory.length >= 10) {
          const oldestId = existingHistory[0].id;
          console.log(`Deleting oldest record (ID: ${oldestId}) to make space`);
          
          const { error: deleteError } = await supabaseClient
            .from('drug_identifications')
            .delete()
            .eq('id', oldestId);
            
          if (deleteError) {
            console.warn('Failed to delete oldest record:', deleteError);
          }
        }
        
        // Create object WITHOUT image to reduce server load
        const identificationData: any = {
          user_id: data.userId,
          drug_name: drugName,
          details: data.details || null,
          // Explicitly set created_at to current time
          created_at: new Date().toISOString()
        };
        
        // Add image_features if provided (for matching, not display)
        if (data.imageFeatures) {
          identificationData.image_features = data.imageFeatures;
        }
          
        console.log('Attempting to insert identification (no image):', identificationData);
        
        result = await supabaseClient
          .from('drug_identifications')
          .insert(identificationData)
          .select();
          
        console.log('Insert result - success:', result.data ? 'yes' : 'no', 'error:', result.error);
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
    
  } catch (error: any) {
    console.error('Error in manage-drug-history function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      data: null,
      error: error?.message || 'Unknown error' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
