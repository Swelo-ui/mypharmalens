// deno-lint-ignore-file
// @ts-ignore: Deno imports
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Local Drug Search Edge Function
 * Searches the local_drugs table using exact, fuzzy, and full-text matching
 * 
 * Request body:
 * {
 *   "query": "drug name to search",
 *   "threshold": 0.6  // Optional, similarity threshold (0-1)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "matches": [
 *     {
 *       "drug_data": { ...drug object },
 *       "match_score": 0.95,
 *       "match_type": "exact|fuzzy|fulltext"
 *     }
 *   ],
 *   "count": 5
 * }
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const body = await req.json();
    const { query, threshold = 0.6 } = body;
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Query parameter required (string)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    console.log(`🔍 Searching local drugs for: "${query}" (threshold: ${threshold})`);

    // Call the database search function
    const { data, error } = await supabase
      .rpc('search_local_drugs', { 
        search_query: query,
        similarity_threshold: threshold
      });

    if (error) {
      console.error('❌ Database search error:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Database search failed',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const processingTime = Date.now() - startTime;
    const matchCount = data?.length || 0;

    console.log(`✅ Found ${matchCount} matches in ${processingTime}ms`);
    
    if (matchCount > 0 && data[0]) {
      console.log(`   Top match: ${data[0].drug_data.name} (score: ${data[0].match_score.toFixed(2)}, type: ${data[0].match_type})`);
    }

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        matches: data || [],
        count: matchCount,
        processingTime,
        query
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
