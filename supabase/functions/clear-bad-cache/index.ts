// Utility function to clear incorrect cache entries
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { drugName, deleteAll } = await req.json();

    if (deleteAll === true) {
      // Clear ALL cache (use with caution)
      const { error } = await supabase
        .from('drug_identification_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All cache entries cleared',
          cleared: 'all'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!drugName) {
      throw new Error('drugName is required (or set deleteAll: true)');
    }

    // Delete specific drug cache entry
    const { data: deleted, error } = await supabase
      .from('drug_identification_cache')
      .delete()
      .or(`drug_name.ilike.%${drugName}%,generic_name.ilike.%${drugName}%`)
      .select();

    if (error) throw error;

    console.log(`🗑️ Cleared ${deleted?.length || 0} cache entries for: ${drugName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleared ${deleted?.length || 0} cache entries`,
        drugName,
        deletedEntries: deleted
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error clearing cache:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
