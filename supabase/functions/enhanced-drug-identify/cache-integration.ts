// deno-lint-ignore-file
// Cache integration module for enhanced-drug-identify
// Add this to enhanced-drug-identify/index.ts to enable caching

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get: (key: string) => string | undefined } };

const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Log credentials status (without exposing actual keys)
console.log(`🔑 Cache module initialized:`);
console.log(`   SUPABASE_URL present: ${!!SUPABASE_URL}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY present: ${!!SUPABASE_SERVICE_ROLE_KEY}`);
console.log(`   URL length: ${SUPABASE_URL?.length || 0}`);
console.log(`   Key length: ${SUPABASE_SERVICE_ROLE_KEY?.length || 0}`);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('⚠️ WARNING: Supabase credentials missing! Cache will not work.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Check cache before running expensive image analysis
 * Returns cached drug data if found with good completeness
 */
export async function checkDrugCache(drugName: string): Promise<any | null> {
  if (!drugName || drugName.toLowerCase().includes('unknown')) {
    return null;
  }

  try {
    console.log(`\n🔍 === CACHE CHECK START (enhanced-drug-identify) ===`);
    console.log(`   Drug name: ${drugName}`);
    console.log(`   Calling RPC: get_cached_drug`);
    
    const { data, error } = await supabase
      .rpc('get_cached_drug', {
        p_drug_name: drugName,
        p_generic_name: null,
        p_imprint: null
      })
      .single();
    
    console.log(`   RPC call completed`);

    if (error) {
      console.error(`🔴 RPC get_cached_drug FAILED:`);
      console.error(`   Error code: ${error.code}`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error details:`, JSON.stringify(error, null, 2));
      console.log(`🔍 === CACHE CHECK END (ERROR) ===\n`);
      return null;
    }

    if (!data) {
      console.log(`❌ No cache entry found for: ${drugName}`);
      console.log(`🔍 === CACHE CHECK END (MISS) ===\n`);
      return null;
    }

    // Type assertion for the RPC response
    const cacheData = data as any;

    console.log(`📊 Cache entry found:`);
    console.log(`   Completeness: ${cacheData.completeness_score}%`);
    console.log(`   Access count: ${cacheData.access_count}`);
    
    // Only use cache if completeness is good (>= 50%)
    if (cacheData.completeness_score >= 50) {
      console.log(`✅ Cache HIT! Returning cached data`);
      console.log(`🔍 === CACHE CHECK END (HIT) ===\n`);
      
      // Transform to expected format
      const transformedData = {
        id: cacheData.id,
        name: cacheData.drug_name,
        genericName: cacheData.generic_name || '',
        manufacturer: cacheData.manufacturer || '',
        category: cacheData.category || '',
        description: cacheData.description || '',
        dosageAndAdmin: cacheData.dosage_and_admin || '',
        sideEffects: cacheData.side_effects || [],
        warnings: cacheData.warnings || [],
        interactions: cacheData.interactions || [],
        storage: cacheData.storage || 'Store at room temperature away from moisture, heat, and light.',
        mechanism: cacheData.mechanism || '',
        indications: cacheData.indications || [],
        contraindications: cacheData.contraindications || [],
        prescriptionStatus: cacheData.prescription_status || 'Unknown',
        pregnancy: cacheData.pregnancy || '',
        verified: cacheData.verified || false,
        drugClass: cacheData.drug_class || '',
        brandNames: cacheData.brand_names || [],
        confidence: cacheData.confidence || 'medium',
        imprint: cacheData.imprint || '',
        color: cacheData.color || '',
        shape: cacheData.shape || '',
        fromCache: true,
        cacheCompleteness: cacheData.completeness_score
      };
      return transformedData;
    } else {
      console.log(`⚠️ Cache found but low quality (${cacheData.completeness_score}% < 50%)`);
      console.log(`🔍 === CACHE CHECK END (LOW QUALITY) ===\n`);
      return null;
    }
  } catch (error) {
    console.error('🔴 Cache check EXCEPTION:', error);
    if (error && typeof error === 'object') {
      console.error('   Error details:', JSON.stringify(error, null, 2));
    }
    console.log(`🔍 === CACHE CHECK END (EXCEPTION) ===\n`);
    return null;
  }
}

/**
 * Save successful drug identification to cache
 */
export async function saveDrugToCache(drugData: any): Promise<void> {
  try {
    const drugName = drugData.name;
    
    if (!drugName || drugName === 'Unknown Medication' || drugName.toLowerCase().includes('unknown')) {
      console.log('Skipping cache save for unknown drug');
      return;
    }

    // Calculate completeness score
    let completeness = 0;
    const fields = ['genericName', 'description', 'dosageAndAdmin', 'manufacturer', 'category'];
    fields.forEach(field => {
      if (drugData[field] && String(drugData[field]).trim().length > 5) completeness += 12;
    });
    
    const arrayFields = ['sideEffects', 'warnings', 'interactions', 'indications', 'contraindications'];
    arrayFields.forEach(field => {
      if (Array.isArray(drugData[field]) && drugData[field].length > 0) completeness += 8;
    });

    completeness = Math.min(completeness, 100);

    // Only cache if we have decent data
    if (completeness < 30) {
      console.log(`Skipping cache - low completeness (${completeness}%)`);
      return;
    }

    console.log(`💾 Saving ${drugName} to cache (${completeness}% complete)`);

    // Prepare data in exact format expected by save_drug_to_cache RPC
    const cacheData = {
      genericName: drugData.genericName || '',
      manufacturer: drugData.manufacturer || '',
      category: drugData.category || '',
      drugClass: drugData.drugClass || '',
      description: drugData.description || '',
      dosageAndAdmin: drugData.dosageAndAdmin || '',
      sideEffects: Array.isArray(drugData.sideEffects) ? drugData.sideEffects : [],
      warnings: Array.isArray(drugData.warnings) ? drugData.warnings : [],
      interactions: Array.isArray(drugData.interactions) ? drugData.interactions : [],
      storage: drugData.storage || '',
      mechanism: drugData.mechanism || '',
      indications: Array.isArray(drugData.indications) ? drugData.indications : [],
      contraindications: Array.isArray(drugData.contraindications) ? drugData.contraindications : [],
      prescriptionStatus: drugData.prescriptionStatus || 'Unknown',
      pregnancy: drugData.pregnancy || '',
      brandNames: Array.isArray(drugData.brandNames) ? drugData.brandNames : [],
      imprint: drugData.imprint || '',
      color: drugData.color || '',
      shape: drugData.shape || '',
      sourcesUsed: Array.isArray(drugData.processingStages) ? drugData.processingStages : ['enhanced-drug-identify'],
      completeness: completeness,
      verified: Boolean(drugData.verified),
      confidence: drugData.confidence || 'medium'
    };

    console.log(`📤 Calling save_drug_to_cache RPC...`);
    console.log(`   Drug name: ${drugName}`);
    console.log(`   Completeness: ${completeness}%`);
    
    const { data, error } = await supabase.rpc('save_drug_to_cache', {
      p_drug_name: drugName,
      p_drug_data: cacheData
    });

    if (error) {
      console.error(`🔴 RPC save_drug_to_cache FAILED:`);
      console.error(`   Error code: ${error.code}`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error details:`, JSON.stringify(error, null, 2));
      throw error;
    }

    console.log(`✅ Saved ${drugName} to cache successfully`);
    console.log(`   Cache ID: ${data}`);
  } catch (error) {
    console.error('🔴 Cache save EXCEPTION:', error);
    if (error && typeof error === 'object') {
      console.error('   Error details:', JSON.stringify(error, null, 2));
    }
    // Don't throw - caching is not critical, but log extensively
  }
}

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. In the main serve() function, add cache check BEFORE the pipeline:
 * 
 * ```typescript
 * import { checkDrugCache, saveDrugToCache } from './cache-integration';
 * 
 * serve(async (req) => {
 *   // ... CORS handling ...
 *   
 *   const { imageBase64, options = {} } = await req.json();
 *   
 *   // NEW: Check cache first if we can extract drug name early
 *   // This would require running Gemini first to get the drug name,
 *   // then checking cache before running expensive enrichment
 *   
 *   // Run Stage 1 & 2 first (text + Gemini to get drug name)
 *   const textStage = await stageTextExtraction(imageBase64);
 *   const geminiStage = await stageGeminiAnalysis(imageBase64, ...);
 *   
 *   const drugName = geminiStage.data?.name;
 *   
 *   // Check cache
 *   if (drugName) {
 *     const cachedDrug = await checkDrugCache(drugName);
 *     if (cachedDrug) {
 *       return createResponse({
 *         success: true,
 *         data: cachedDrug,
 *         processingStages: ['cache-hit'],
 *         confidence: cachedDrug.confidence,
 *         fallbackUsed: false,
 *         processingTime: Date.now() - startTime
 *       });
 *     }
 *   }
 *   
 *   // Continue with multi-source enrichment...
 *   const multiSourceStage = await stageMultiSourceEnrichment(drugName);
 *   
 *   // After combining results
 *   const combinedResult = combineStageResults(stages);
 *   
 *   // NEW: Save to cache for future use (async, don't wait)
 *   if (combinedResult) {
 *     saveDrugToCache(combinedResult).catch(err => 
 *       console.error('Background cache save failed:', err)
 *     );
 *   }
 * ```
 */
