import { serve } from "std/http/server";
import "xhr";
import { saveDrugToCache, checkDrugCache } from '../enhanced-drug-identify/cache-integration.ts';

declare const Deno: { env: { get: (key: string) => string | undefined } };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrugData {
  name: string;
  genericName?: string;
  description?: string;
  dosageAndAdmin?: string;
  category?: string;
  sideEffects?: string[];
  warnings?: string[];
  interactions?: string[];
  indications?: string[];
  confidence?: 'high' | 'medium' | 'low';
  verified?: boolean;
  [key: string]: unknown;
}

function createSuccessResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function createErrorResponse(error: string, message: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error, 
      message, 
      details 
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function calculateCompletenessScore(drugData: DrugData): number {
  let completenessScore = 0;
  
  // Required fields (15 points each)
  const requiredFields = ['genericName', 'description', 'dosageAndAdmin', 'category'];
  requiredFields.forEach(field => {
    const fieldValue = drugData[field];
    if (fieldValue && String(fieldValue).trim().length > 5) {
      completenessScore += 15;
    }
  });
  
  // Array fields (10 points each)
  const arrayFields = ['sideEffects', 'warnings', 'interactions', 'indications'];
  arrayFields.forEach(field => {
    const fieldValue = drugData[field];
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      completenessScore += 10;
    }
  });
  
  return Math.min(completenessScore, 100);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json() as { drugData?: DrugData };
    const { drugData } = requestBody;
    
    if (!drugData || !drugData.name) {
      return createErrorResponse(
        'invalid_data',
        'Drug data is required with at least a name field'
      );
    }

    // Calculate completeness score
    const completenessScore = calculateCompletenessScore(drugData);
    
    console.log(`\n📊 === MANUAL CACHE SAVE REQUEST ===`);
    console.log(`   Drug: ${drugData.name}`);
    console.log(`   Completeness Score: ${completenessScore}%`);
    console.log(`   Confidence: ${drugData.confidence || 'unknown'}`);
    
    // Check if data quality is sufficient for caching (must be 100% for manual save)
    if (completenessScore < 100) {
      console.log(`❌ === CACHE SAVE REJECTED ===`);
      console.log(`   Reason: Incomplete data (${completenessScore}% < 100%)`);
      console.log(`   Missing fields detected - manual cache save requires complete information`);
      
      return createErrorResponse(
        'incomplete_data',
        `Drug information is incomplete (${completenessScore}% complete). Manual cache save requires 100% complete information to ensure high quality.`,
        {
          completenessScore,
          requiredForCache: 100,
          missingFields: getMissingFields(drugData)
        }
      );
    }

    // Check if drug already exists in cache
    console.log(`\n🔍 === CHECKING FOR DUPLICATE IN CACHE ===`);
    const existingCacheEntry = await checkDrugCache(drugData.name);
    
    if (existingCacheEntry) {
      console.log(`⚠️ === DUPLICATE DETECTED ===`);
      console.log(`   Drug: ${drugData.name}`);
      console.log(`   Already cached with completeness: ${existingCacheEntry.cacheCompleteness || 'unknown'}%`);
      
      return createErrorResponse(
        'already_cached',
        `"${drugData.name}" is already cached in the library. This drug information has been previously saved and is available for identification.`,
        {
          drugName: drugData.name,
          cachedDrugName: existingCacheEntry.name,
          cacheCompleteness: existingCacheEntry.cacheCompleteness || 0,
          message: 'Drug already exists in cache - no need to save again'
        }
      );
    }
    
    console.log(`✅ No duplicate found - proceeding with save`);
    
    // Data is complete and unique, proceed with cache save
    console.log(`\n✅ === HIGH-QUALITY DATA APPROVED FOR CACHE ===`);
    console.log(`   Completeness: ${completenessScore}% (100% threshold met)`);
    console.log(`   Source: Manual user save`);
    
    try {
      await saveDrugToCache({
        ...drugData,
        completeness: completenessScore,
        cacheSource: 'manual_user_save',
        manualSave: true,
        savedAt: new Date().toISOString()
      });
      
      console.log(`💾 === CACHE SAVE SUCCESSFUL ===`);
      console.log(`   Drug: ${drugData.name}`);
      console.log(`   Future identifications: Will hit cache instantly`);
      
      return createSuccessResponse({
        message: 'Drug information saved to cache successfully',
        drugName: drugData.name,
        completenessScore,
        cacheSource: 'manual_user_save'
      });
      
    } catch (cacheError) {
      console.error(`🔴 === CACHE SAVE FAILED ===`);
      console.error(`   Error:`, cacheError);
      
      return createErrorResponse(
        'cache_save_failed',
        'Failed to save drug information to cache',
        cacheError instanceof Error ? cacheError.message : String(cacheError)
      );
    }

  } catch (error) {
    console.error('Error in manual-cache-save function:', error);
    return createErrorResponse(
      'server_error',
      'An unexpected error occurred while processing your request',
      error instanceof Error ? error.message : String(error)
    );
  }
});

function getMissingFields(drugData: DrugData): string[] {
  const missing: string[] = [];
  
  // Check required fields
  const requiredFields = ['genericName', 'description', 'dosageAndAdmin', 'category'];
  requiredFields.forEach(field => {
    const fieldValue = drugData[field];
    if (!fieldValue || String(fieldValue).trim().length <= 5) {
      missing.push(field);
    }
  });
  
  // Check array fields
  const arrayFields = ['sideEffects', 'warnings', 'interactions', 'indications'];
  arrayFields.forEach(field => {
    const fieldValue = drugData[field];
    if (!Array.isArray(fieldValue) || fieldValue.length === 0) {
      missing.push(field);
    }
  });
  
  return missing;
}
