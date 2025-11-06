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
/**
 * Transform cache data to expected format
 */
function transformCacheData(cacheData: any): any {
  return {
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
}

/**
 * Intelligent drug name normalization for fuzzy cache matching
 * Removes common variations that don't affect drug identity
 */
function normalizeDrugName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Remove special characters and trademarks
    .replace(/[®™©]/g, '')
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/[^\w\s-]/g, '')  // Remove special chars except hyphen
    .trim();
}

/**
 * Calculate similarity between two drug names (0-1 score)
 * Uses Levenshtein-like approach with pharmaceutical awareness
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeDrugName(name1);
  const n2 = normalizeDrugName(name2);
  
  // Exact match after normalization
  if (n1 === n2) return 1.0;
  
  // One is substring of other (e.g., "M2-TONE" in "M2-TONE SYRUP")
  if (n1.includes(n2) || n2.includes(n1)) {
    const shorter = n1.length < n2.length ? n1 : n2;
    const longer = n1.length >= n2.length ? n1 : n2;
    return shorter.length / longer.length;
  }
  
  // Calculate Levenshtein distance
  const matrix: number[][] = [];
  const len1 = n1.length;
  const len2 = n2.length;
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = n1[i - 1] === n2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1.0 : 1 - (distance / maxLen);
}

/**
 * Intelligent cache check with fuzzy matching
 * Tries exact match first, then fuzzy matching with common sense
 */
export async function checkDrugCache(drugName: string): Promise<any | null> {
  if (!drugName || drugName.toLowerCase().includes('unknown')) {
    return null;
  }

  try {
    console.log(`\n🔍 === INTELLIGENT CACHE CHECK START ===`);
    console.log(`   Original drug name: "${drugName}"`);
    console.log(`   Normalized: "${normalizeDrugName(drugName)}"`);
    
    // Strategy 1: Try exact RPC match first (fastest)
    console.log(`\n   Strategy 1: Exact RPC match (by brand or generic)...`);
    const { data, error } = await supabase
      .rpc('get_cached_drug', {
        // Pass the same input as both brand and generic so the RPC can match either
        p_drug_name: drugName,
        p_generic_name: drugName,
        p_imprint: null
      })
      .single();

    if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows returned
      console.error(`🔴 RPC get_cached_drug ERROR:`);
      console.error(`   Error code: ${error.code}`);
      console.error(`   Error message: ${error.message}`);
    }

    if (data) {
      console.log(`✅ Exact match found!`);
      console.log(`🔍 === CACHE CHECK END (EXACT HIT) ===\n`);
      return transformCacheData(data);
    }
    
    console.log(`   No exact match, trying fuzzy matching...`);
    
    // Strategy 2: Fuzzy matching with all cached drugs
    console.log(`\n   Strategy 2: Intelligent fuzzy matching...`);
    
    // Get all cached drug names for fuzzy comparison
    const { data: allCachedDrugs, error: fetchError } = await supabase
      .from('drug_identification_cache')
      .select('id, drug_name, generic_name, completeness_score')
      .gte('completeness_score', 50)  // Only compare with quality entries
      .limit(1000);  // Reasonable limit
    
    if (fetchError) {
      console.error(`❌ Failed to fetch cached drugs for fuzzy match:`, fetchError);
      console.log(`🔍 === CACHE CHECK END (ERROR) ===\n`);
      return null;
    }
    
    if (!allCachedDrugs || allCachedDrugs.length === 0) {
      console.log(`❌ No cached drugs available for comparison`);
      console.log(`🔍 === CACHE CHECK END (MISS) ===\n`);
      return null;
    }
    
    console.log(`   Comparing against ${allCachedDrugs.length} cached entries...`);
    
    // Find best match using intelligent similarity
    let bestMatch: any = null;
    let bestScore = 0;
    const SIMILARITY_THRESHOLD = 0.75;  // 75% similarity required
    
    for (const cached of allCachedDrugs) {
      const scoreBrand = calculateNameSimilarity(drugName, cached.drug_name);
      const scoreGeneric = cached.generic_name ? calculateNameSimilarity(drugName, cached.generic_name) : 0;
      const score = Math.max(scoreBrand, scoreGeneric);

      if (score > bestScore && score >= SIMILARITY_THRESHOLD) {
        bestScore = score;
        bestMatch = cached;
      }
    }
    
    if (bestMatch) {
      console.log(`\n🎯 FUZZY MATCH FOUND!`);
      console.log(`   Input: "${drugName}"`);
      console.log(`   Matched (brand): "${bestMatch.drug_name}" | (generic): "${bestMatch.generic_name || ''}"`);
      console.log(`   Similarity: ${(bestScore * 100).toFixed(1)}%`);
      console.log(`   Completeness: ${bestMatch.completeness_score}%`);
      
      // Fetch full data for the matched drug
      const { data: fullData, error: fullError } = await supabase
        .from('drug_identification_cache')
        .select('*')
        .eq('id', bestMatch.id)
        .single();
      
      if (fullError || !fullData) {
        console.error(`❌ Failed to fetch full data for matched drug`);
        console.log(`🔍 === CACHE CHECK END (ERROR) ===\n`);
        return null;
      }
      
      console.log(`✅ Full data retrieved successfully`);
      console.log(`🔍 === CACHE CHECK END (FUZZY HIT) ===\n`);
      return transformCacheData(fullData);
    }
    
    console.log(`❌ No fuzzy match found (best score: ${(bestScore * 100).toFixed(1)}%)`);
    console.log(`🔍 === CACHE CHECK END (MISS) ===\n`);
    return null;
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
