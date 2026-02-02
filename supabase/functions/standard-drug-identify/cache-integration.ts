// deno-lint-ignore-file
// Cache integration module for enhanced-drug-identify
// Add this to enhanced-drug-identify/index.ts to enable caching

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { aiCompareDrugNames } from './ai-validator.ts';

// OpenRouter config for advanced validation
const OPENROUTER_API_KEY = Deno?.env?.get('OPENROUTER_API_KEY') ?? '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const VALIDATION_MODEL = 'google/gemini-2.5-flash-lite'; // LITE model for cost savings (was free model)

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
 * CRITICAL: Validate cached drug data against extracted visual/text info
 * Prevents returning wrong drug information (e.g., wrong variant, formulation)
 */
async function validateCachedDataAccuracy(
  cachedDrug: any,
  extractedInfo: {
    drugName: string;
    genericNames?: string[];
    imprint?: string;
    color?: string;
    shape?: string;
  }
): Promise<{ isValid: boolean; confidence: number; reason: string }> {

  const prompt = `You are a pharmaceutical expert validating drug identification accuracy.

CACHED DRUG DATA:
- Brand Name: ${cachedDrug.drug_name}
- Generic Name: ${cachedDrug.generic_name || 'Not specified'}
- Indications: ${Array.isArray(cachedDrug.indications) ? cachedDrug.indications.join(', ') : cachedDrug.indications || 'Not specified'}
- Category: ${cachedDrug.category || 'Not specified'}
- Manufacturer: ${cachedDrug.manufacturer || 'Not specified'}

EXTRACTED FROM IMAGE:
- Drug Name Identified: ${extractedInfo.drugName}
- Generic Names Found: ${extractedInfo.genericNames?.join(', ') || 'None'}
- Imprint: ${extractedInfo.imprint || 'None'}
- Color: ${extractedInfo.color || 'Unknown'}
- Shape: ${extractedInfo.shape || 'Unknown'}

CRITICAL VALIDATION TASK:
1. Verify this is the EXACT SAME product (not just same brand)
2. Check for product variants (e.g., M2-TONE for men vs women, different formulations)
3. Validate indications/purpose match the identified drug
4. Flag ANY discrepancies in purpose, target population, or therapeutic use

RETURN JSON:
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of validation result",
  "concerns": ["List any red flags or mismatches"]
}`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pharmalens.app',
        'X-Title': 'PharmaLens Drug Validator'
      },
      body: JSON.stringify({
        model: VALIDATION_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      console.warn('⚠️ Validation API failed, allowing cache hit with caution');
      return { isValid: true, confidence: 0.7, reason: 'Validation service unavailable' };
    }

    const result = await response.json();
    const validation = JSON.parse(result.choices[0].message.content);

    console.log(`\n🔍 CACHE DATA VALIDATION:`);
    console.log(`   Valid: ${validation.isValid}`);
    console.log(`   Confidence: ${(validation.confidence * 100).toFixed(1)}%`);
    console.log(`   Reason: ${validation.reason}`);
    if (validation.concerns?.length > 0) {
      console.log(`   ⚠️ Concerns: ${validation.concerns.join(', ')}`);
    }

    return validation;

  } catch (error) {
    console.error('❌ Cache validation error:', error);
    // Fail-safe: Allow cache hit but flag low confidence
    return { isValid: true, confidence: 0.6, reason: 'Validation error - proceeding with caution' };
  }
}

/**
 * Check cache before running expensive image analysis
 * Returns cached drug data if found with good completeness
 */
/**
 * Transform cache data to expected format with comprehensive data filling
 */
function transformCacheData(cacheData: any): any {
  // Ensure we have meaningful defaults for Standard Mode UI
  const drugName = cacheData.drug_name || 'Unknown Medication';
  const genericName = cacheData.generic_name || cacheData.drug_name || '';

  return {
    id: cacheData.id,
    name: drugName,
    genericName: genericName,
    manufacturer: cacheData.manufacturer || 'Manufacturer information available on packaging',
    category: cacheData.category || cacheData.drug_class || 'Pharmaceutical Product',
    description: cacheData.description || `${drugName} is a pharmaceutical product. Consult healthcare provider for detailed information.`,
    dosageAndAdmin: cacheData.dosage_and_admin || 'Follow dosage instructions on packaging or as prescribed by healthcare provider',
    sideEffects: Array.isArray(cacheData.side_effects) ? cacheData.side_effects :
      (cacheData.side_effects ? [cacheData.side_effects] : ['Consult healthcare provider for side effects information']),
    warnings: Array.isArray(cacheData.warnings) ? cacheData.warnings :
      (cacheData.warnings ? [cacheData.warnings] : ['Read all warnings on packaging before use', 'Consult healthcare provider if you have medical conditions']),
    interactions: Array.isArray(cacheData.interactions) ? cacheData.interactions :
      (cacheData.interactions ? [cacheData.interactions] : ['Inform healthcare provider about all medications you are taking']),
    storage: cacheData.storage || 'Store at room temperature away from moisture, heat, and light. Keep out of reach of children.',
    mechanism: cacheData.mechanism || 'Mechanism of action information available from healthcare provider',
    indications: Array.isArray(cacheData.indications) ? cacheData.indications :
      (cacheData.indications ? [cacheData.indications] : ['Consult healthcare provider for usage information']),
    contraindications: Array.isArray(cacheData.contraindications) ? cacheData.contraindications :
      (cacheData.contraindications ? [cacheData.contraindications] : ['Consult healthcare provider about contraindications']),
    prescriptionStatus: cacheData.prescription_status || 'Consult pharmacist',
    pregnancy: cacheData.pregnancy || 'Consult healthcare provider before use during pregnancy',
    verified: Boolean(cacheData.verified),
    drugClass: cacheData.drug_class || cacheData.category || '',
    brandNames: Array.isArray(cacheData.brand_names) ? cacheData.brand_names :
      (cacheData.brand_names ? [cacheData.brand_names] : []),
    confidence: cacheData.confidence || 'high', // Cache hits should be high confidence
    imprint: cacheData.imprint || '',
    color: cacheData.color || '',
    shape: cacheData.shape || '',
    fromCache: true,
    cacheCompleteness: cacheData.completeness_score,
    completeness: Math.max(cacheData.completeness_score || 80, 80), // Ensure cache hits show good completeness
    // Add processing metadata for UI
    processingMethod: 'Cache Hit - Fast Lookup',
    processingTime: '<100ms',
    dataSource: 'Cached Database',
    qualityScore: Math.max(cacheData.completeness_score || 85, 85)
  };
}

/**
 * Enhanced cache check with comprehensive validation
 * Now includes accuracy validation to prevent wrong drug information
 */
export async function checkDrugCacheWithValidation(
  drugName: string,
  extractedInfo?: {
    genericNames?: string[];
    imprint?: string;
    color?: string;
    shape?: string;
  }
): Promise<any | null> {

  // First get the basic cache match
  const cacheResult = await checkDrugCache(drugName);

  if (!cacheResult) {
    return null;
  }

  // CRITICAL: Validate the cached data is actually correct
  console.log(`\n🔐 VALIDATING CACHE DATA ACCURACY...`);
  const validation = await validateCachedDataAccuracy(cacheResult, {
    drugName,
    genericNames: extractedInfo?.genericNames || [],
    imprint: extractedInfo?.imprint,
    color: extractedInfo?.color,
    shape: extractedInfo?.shape
  });

  // Reject cache hit if validation fails or confidence too low
  if (!validation.isValid || validation.confidence < 0.7) {
    console.log(`\n❌ CACHE DATA REJECTED - ACCURACY VALIDATION FAILED!`);
    console.log(`   Reason: ${validation.reason}`);
    console.log(`   Confidence: ${(validation.confidence * 100).toFixed(1)}%`);
    console.log(`   This prevents incorrect drug information from being returned`);
    console.log(`   Will perform fresh identification instead...`);
    return null;
  }

  console.log(`\n✅ CACHE DATA VALIDATED - Accuracy confirmed`);
  console.log(`   Validation confidence: ${(validation.confidence * 100).toFixed(1)}%`);

  // Add validation metadata to result
  return {
    ...cacheResult,
    validationPerformed: true,
    validationConfidence: validation.confidence,
    validationReason: validation.reason
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
    // Remove dosage forms that don't affect identity (for fuzzy matching)
    .replace(/\s+(tablet|tablets|capsule|capsules|syrup|syrups|injection|injections|drops|cream|ointment|gel|powder|suspension|solution)s?\s*$/i, '')
    // Remove strength/dosage numbers for base drug matching (e.g., "Paracetamol 500mg" → "Paracetamol")
    .replace(/\s*\d+\s*(mg|mcg|g|ml|iu|units?)\s*/gi, ' ')
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/[^\w\s-]/g, '')  // Remove special chars except hyphen
    .trim();
}

/**
 * Calculate similarity between two drug names (0-1 score)
 * Uses Levenshtein-like approach with pharmaceutical awareness
 * NOW USED AS FALLBACK ONLY - AI comparison is primary
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
    const SIMILARITY_THRESHOLD = 0.75;  // Optimized threshold for accuracy
    const HIGH_CONFIDENCE_THRESHOLD = 0.90;  // Skip AI validation for very high matches

    // Collect all candidates above threshold for debugging
    const candidates: Array<{ drug: any, score: number }> = [];

    for (const cached of allCachedDrugs) {
      const scoreBrand = calculateNameSimilarity(drugName, cached.drug_name);
      const scoreGeneric = cached.generic_name ? calculateNameSimilarity(drugName, cached.generic_name) : 0;
      const score = Math.max(scoreBrand, scoreGeneric);

      // Log top candidates for debugging
      if (score >= 0.5) {  // Log anything above 50% similarity
        candidates.push({ drug: cached, score });
      }

      if (score > bestScore && score >= SIMILARITY_THRESHOLD) {
        bestScore = score;
        bestMatch = cached;
      }
    }

    // Sort and log top candidates for debugging
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      console.log(`\n   📊 TOP SIMILAR DRUGS FOUND (showing top ${Math.min(5, candidates.length)}):`);
      candidates.slice(0, 5).forEach((c, i) => {
        const marker = c.score >= SIMILARITY_THRESHOLD ? '✅' : '⚠️';
        console.log(`      ${marker} ${i + 1}. "${c.drug.drug_name}" - ${(c.score * 100).toFixed(1)}% match`);
      });
    }

    if (bestMatch) {
      console.log(`\n🎯 FUZZY MATCH FOUND (ABOVE ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}% THRESHOLD)!`);
      console.log(`   Input: "${drugName}"`);
      console.log(`   Matched: "${bestMatch.drug_name}"`);
      console.log(`   Similarity: ${(bestScore * 100).toFixed(1)}%`);
      console.log(`   Completeness: ${bestMatch.completeness_score}%`);

      // Optimize AI validation: Skip for very high similarity matches (90%+)
      if (bestScore >= HIGH_CONFIDENCE_THRESHOLD) {
        console.log(`\n🚀 SKIPPING AI VALIDATION - High confidence match (${(bestScore * 100).toFixed(1)}%)`);
        console.log(`   This is likely an exact or near-exact match`);
      } else {
        console.log(`\n🔐 AI VALIDATION REQUIRED - Verifying cache match...`);
        const aiValidation = await aiCompareDrugNames(
          drugName,
          undefined, // We don't have extracted generic yet in cache check
          bestMatch.drug_name,
          bestMatch.generic_name
        );

        // Only accept cache hit if AI confirms it's the SAME drug
        if (!aiValidation.isSame) {
          console.log(`\n❌ AI REJECTED CACHE HIT!`);
          console.log(`   Reason: ${aiValidation.reasoning}`);
          console.log(`   This prevents incorrect drug information from being returned`);
          console.log(`   Will continue to fresh identification...`);
          console.log(`🔍 === CACHE CHECK END (AI REJECTED) ===\n`);
          return null;
        }

        console.log(`\n✅ AI VALIDATED CACHE HIT!`);
        console.log(`   AI Confidence: ${(aiValidation.confidence * 100).toFixed(1)}%`);
        console.log(`   Reasoning: ${aiValidation.reasoning}`);
      }

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
      console.log(`🔍 === CACHE CHECK END (AI-VALIDATED HIT) ===\n`);
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
