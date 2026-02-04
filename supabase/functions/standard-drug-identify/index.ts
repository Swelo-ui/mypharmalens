import "xhr";
declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};
import { checkDrugCacheWithValidation } from './cache-integration.ts';
import { cleanText, cleanTextArray, normalizeDrugName, generateNameAliases } from '../_shared/text-cleaner.ts';
import { findJanaushadhiAlternative, JanaushadhiMatch } from '../_shared/janaushadhi-lookup.ts';
import { isRateLimitError, createRateLimitResponse, logRateLimit } from '../_shared/rate-limit-handler.ts';

// ============================================================================
// STANDARD DRUG IDENTIFY V2 - AGGRESSIVE & ROBUST
// ============================================================================
// Updated: Removes early safety checks, enforces "Thinking" mode, validates at the end.
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Models
// Using Flash-Lite for speed/cost, but with "Thinking" prompt engineering
const VISION_MODEL = 'google/gemini-2.5-flash-lite';          
const ENHANCEMENT_MODEL = 'google/gemini-2.5-flash-lite'; 

// ============================================================================
// TYPES
// ============================================================================

interface DrugData {
  id: string;
  name: string;
  genericName: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  strength?: string;
  dosageForm?: string;
  dosageAndAdmin?: string;
  mechanism?: string;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  indications: string[];
  contraindications: string[];
  pregnancy?: string;
  storage?: string;
  prescriptionStatus?: string;
  color?: string;
  shape?: string;
  imprint?: string;
  expDate?: string;
  mfgDate?: string;
  batchNumber?: string;
  mrp?: string;
  confidence: 'high' | 'medium' | 'low';
  dataSource?: string;
  processingTime?: number;
  janaushadhiAlternative?: JanaushadhiMatch;
  alternatives?: Record<string, unknown>[];
}

interface VisionResult {
  name: string;
  genericName: string;
  manufacturer?: string;
  strength?: string;
  dosageForm?: string;
  category?: string;
  description?: string;
  color?: string;
  shape?: string;
  imprint?: string;
  expDate?: string;
  mfgDate?: string;
  batchNumber?: string;
  mrp?: string;
  confidence: number;
  ocrText?: string;
  _thinking?: string; // Captured reasoning
}

interface ProcessingStage {
  name: string;
  success: boolean;
  data?: unknown;
  processingTime: number;
}

// ============================================================================
// HELPER: Create Response
// ============================================================================

function createResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================================================
// STAGE 1: VISION OCR - Extract from image
// ============================================================================

async function performVisionOCR(imageBase64: string): Promise<VisionResult | null> {
  console.log('\n📷 === STAGE 1: VISION OCR (Aggressive Mode) ===');

  const cleanBase64 = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  // Updated Prompt: Enforces "Thinking" and allows low-confidence guesses
  const prompt = `You are a pharmaceutical OCR expert. Your goal is to EXTRACT TEXT at all costs.

STEP 1: THINKING MODE (Chain of Thought)
- Analyze the image pixel-by-pixel.
- Identify every fragment of text, even if blurry or cut off.
- Reconstruct words from partial letters (e.g., "Do..650" -> "Dolo 650").
- Filter out noise/logos to find the Brand Name.
- Cross-reference visible text to deduce the most likely drug name.

STEP 2: EXTRACTION
- Extract the Product/Brand Name. If unsure, output your best guess.
- Extract the Generic Name (Active Ingredients).
- Extract Strength, Dosage Form, Manufacturer.

CRITICAL RULES:
1. NEVER return "Unknown" if *any* text is visible. GUESS based on the "Thinking" step.
2. It is better to return a hallucinatory name (which we will verify later) than nothing.
3. If the image is blurry, say so in "_thinking" but still provide a name.
4. Extract raw text into "ocrText" for fallback analysis.

RETURN JSON ONLY:
{
  "_thinking": "Step-by-step reasoning: 1. Saw text 'P-C-M'. 2. Inferred 'PCM'. 3. Deduced 'Paracetamol'...",
  "name": "Product name (Best Guess)",
  "genericName": "Active ingredient",
  "manufacturer": "Company name",
  "strength": "Dosage strength",
  "dosageForm": "dosage form",
  "color": "visual color",
  "shape": "visual shape",
  "imprint": "codes/markings",
  "expDate": "date string",
  "mfgDate": "date string",
  "batchNumber": "batch string",
  "mrp": "price string",
  "confidence": 0-100,
  "ocrText": "raw visible text"
}`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SUPABASE_URL,
        'X-Title': 'PharmaLens Vision OCR'
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
          ]
        }],
        temperature: 0.1, // Keep low for consistency, but prompt encourages guessing
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      console.error(`❌ Vision API error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in vision response');
      return null;
    }

    // Parse JSON response
    let visionData: VisionResult;
    try {
      visionData = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        visionData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('❌ Failed to parse vision JSON');
        return null;
      }
    }

    console.log(`✅ Vision OCR Success:`);
    console.log(`   Thinking: ${visionData._thinking?.substring(0, 100)}...`);
    console.log(`   Name: ${visionData.name || 'Unknown'}`);
    console.log(`   Generic: ${visionData.genericName || 'Unknown'}`);
    console.log(`   Confidence: ${visionData.confidence || 0}%`);

    return visionData;

  } catch (error) {
    console.error('❌ Vision OCR error:', error);
    return null;
  }
}

// ============================================================================
// STAGE 2: DATA ENRICHMENT - Check cache and database
// ============================================================================

async function enrichFromSources(
  drugName: string,
  genericName?: string
): Promise<DrugData | null> {
  console.log('\n🔍 === STAGE 2: DATA ENRICHMENT ===');
  
  if (!drugName || drugName.toLowerCase() === 'unknown') {
      console.log('⚠️ Skipping enrichment: No valid drug name');
      return null;
  }

  console.log(`   Searching for: "${drugName}" / "${genericName || 'N/A'}"`);

  // Generate name variations
  const variations = new Set<string>();
  generateNameAliases(drugName).forEach(v => variations.add(v));
  if (genericName) {
    generateNameAliases(genericName).forEach(v => variations.add(v));
  }

  const uniqueVariations = Array.from(variations).slice(0, 5);
  console.log(`   Variations: ${uniqueVariations.join(', ')}`);

  // Parallel search: Cache + Database
  const searchPromises: Promise<{ type: 'cache' | 'db'; data: unknown; key: string }>[] = [];

  // Cache searches
  uniqueVariations.forEach(variation => {
    searchPromises.push(
      checkDrugCacheWithValidation(variation, {})
        .then(data => ({ type: 'cache' as const, data, key: variation }))
        .catch(() => ({ type: 'cache' as const, data: null, key: variation }))
    );
  });

  // Database searches
  uniqueVariations.forEach(variation => {
    searchPromises.push(
      searchLocalDatabase(variation)
        .then(data => ({ type: 'db' as const, data, key: variation }))
        .catch(() => ({ type: 'db' as const, data: null, key: variation }))
    );
  });

  const results = await Promise.allSettled(searchPromises);

  // Find best result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.data) {
      const { type, data, key } = result.value;
      console.log(`✅ Found in ${type}: "${key}"`);
      return normalizeToDrugData(data, 'high');
    }
  }

  console.log('❌ No results from cache or database');
  return null;
}

async function searchLocalDatabase(drugName: string): Promise<unknown> {
  const normalizedName = normalizeDrugName(drugName);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_drugs_by_name`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      search_name: normalizedName,
      similarity_threshold: 0.75
    })
  });

  if (!response.ok) return null;

  const results = await response.json();
  return results?.[0] || null;
}

// ============================================================================
// STAGE 3: AI KNOWLEDGE ENHANCEMENT
// ============================================================================

async function enhanceWithAIKnowledge(
  partialData: Partial<DrugData>,
  drugName: string,
  genericName?: string
): Promise<DrugData> {
  console.log('\n🧪 === STAGE 3: AI KNOWLEDGE ENHANCEMENT ===');
  
  // If name is still unknown, we can't enhance much, but we'll try
  const targetName = drugName !== 'Unknown' ? drugName : (genericName || 'Unknown Medication');
  console.log(`   Enhancing: "${targetName}"`);

  // Check which fields are missing
  const missingFields: string[] = [];
  if (!partialData.description || partialData.description.length < 20) missingFields.push('description');
  if (!partialData.mechanism || partialData.mechanism.length < 20) missingFields.push('mechanism');
  if (!partialData.sideEffects?.length) missingFields.push('sideEffects');
  if (!partialData.warnings?.length) missingFields.push('warnings');
  if (!partialData.indications?.length) missingFields.push('indications');
  if (!partialData.contraindications?.length) missingFields.push('contraindications');
  if (!partialData.interactions?.length) missingFields.push('interactions');
  if (!partialData.pregnancy) missingFields.push('pregnancy');
  if (!partialData.dosageAndAdmin) missingFields.push('dosageAndAdmin');
  if (!partialData.storage) missingFields.push('storage');

  if (missingFields.length === 0) {
    console.log('   All fields present - no enhancement needed');
    return partialData as DrugData;
  }

  console.log(`   Missing fields: ${missingFields.join(', ')}`);

  const prompt = `You are a pharmaceutical database expert. Provide essential information for this medication.

DRUG: "${targetName}"${genericName ? ` (Generic: ${genericName})` : ''}

PROVIDE INFORMATION FOR THESE FIELDS:
${missingFields.map(f => `- ${f}`).join('\n')}

REQUIREMENTS:
1. Use accurate pharmaceutical knowledge
2. For arrays (sideEffects, warnings): provide top 3-5 most critical items
3. For text fields: provide concise, clear summaries (max 2 sentences)
4. Use PLAIN TEXT only - no markdown
5. NEVER use placeholders ("Not available")
6. Focus on patient safety

RETURN ONLY VALID JSON:
{
${missingFields.map(field => {
    if (['sideEffects', 'contraindications', 'interactions', 'warnings', 'indications'].includes(field)) {
      return `  "${field}": ["critical_item1", "critical_item2", "critical_item3"]`;
    } else {
      return `  "${field}": "Concise summary here"`;
    }
  }).join(',\n')}
}`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SUPABASE_URL,
        'X-Title': 'PharmaLens Knowledge Enhancement'
      },
      body: JSON.stringify({
        model: ENHANCEMENT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      console.error(`❌ Enhancement API error: ${response.status}`);
      return ensureCompleteData(partialData, targetName, genericName);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (content) {
      try {
        const enhancement = JSON.parse(content);

        // Merge enhancement into partial data
        let enhancedCount = 0;
        missingFields.forEach(field => {
          const value = enhancement[field];
          if (value) {
            if (Array.isArray(value) && value.length > 0) {
              (partialData as Record<string, unknown>)[field] = cleanTextArray(value);
              enhancedCount++;
              console.log(`   ✅ Enhanced ${field}: ${value.length} items`);
            } else if (typeof value === 'string' && value.length > 10) {
              (partialData as Record<string, unknown>)[field] = cleanText(value);
              enhancedCount++;
              console.log(`   ✅ Enhanced ${field}`);
            }
          }
        });

        console.log(`🧪 Enhancement complete: ${enhancedCount}/${missingFields.length} fields filled`);
      } catch (e) {
        console.error('❌ Failed to parse enhancement JSON:', e);
      }
    }

  } catch (error) {
    console.error('❌ Enhancement error:', error);
  }

  return ensureCompleteData(partialData, targetName, genericName);
}

// ============================================================================
// STAGE 4: FINAL RESPONSE BUILDER
// ============================================================================

function ensureCompleteData(
  partialData: Partial<DrugData>,
  drugName: string,
  genericName?: string
): DrugData {
  const displayName = drugName !== 'Unknown' ? drugName : 'Unidentified Medication';
  
  return {
    id: partialData.id || crypto.randomUUID(),
    name: partialData.name || displayName,
    genericName: partialData.genericName || genericName || '',
    manufacturer: partialData.manufacturer || '',
    category: partialData.category || 'Medication',
    description: partialData.description || `${displayName} is a pharmaceutical product.`,
    strength: partialData.strength || '',
    dosageForm: partialData.dosageForm || '',
    dosageAndAdmin: partialData.dosageAndAdmin || 'Take as directed by your physician.',
    mechanism: partialData.mechanism || '',
    sideEffects: partialData.sideEffects || [],
    warnings: partialData.warnings || [],
    interactions: partialData.interactions || [],
    indications: partialData.indications || [],
    contraindications: partialData.contraindications || [],
    pregnancy: partialData.pregnancy || '',
    storage: partialData.storage || 'Store in a cool, dry place.',
    prescriptionStatus: partialData.prescriptionStatus || '',
    color: partialData.color || '',
    shape: partialData.shape || '',
    imprint: partialData.imprint || '',
    expDate: partialData.expDate || '',
    mfgDate: partialData.mfgDate || '',
    batchNumber: partialData.batchNumber || '',
    mrp: partialData.mrp || '',
    confidence: partialData.confidence || 'medium',
    dataSource: partialData.dataSource || 'ai-analysis',
    processingTime: partialData.processingTime,
    alternatives: partialData.alternatives || []
  };
}

function getString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return '';
}

function getStringArray(obj: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

function normalizeToDrugData(inputData: unknown, confidence: 'high' | 'medium' | 'low'): DrugData {
  const data = (inputData || {}) as Record<string, unknown>;
  return {
    id: getString(data, ['id']) || crypto.randomUUID(),
    name: getString(data, ['name', 'drug_name']),
    genericName: getString(data, ['genericName', 'generic_name']),
    manufacturer: getString(data, ['manufacturer']),
    category: getString(data, ['category', 'drug_class']),
    description: getString(data, ['description']),
    strength: getString(data, ['strength']),
    dosageForm: getString(data, ['dosageForm', 'dosage_form']),
    dosageAndAdmin: getString(data, ['dosageAndAdmin', 'dosage_and_admin']),
    mechanism: getString(data, ['mechanism', 'mechanism_of_action']),
    sideEffects: cleanTextArray(getStringArray(data, ['sideEffects', 'side_effects'])),
    warnings: cleanTextArray(getStringArray(data, ['warnings'])),
    interactions: cleanTextArray(getStringArray(data, ['interactions', 'drug_interactions'])),
    indications: cleanTextArray(getStringArray(data, ['indications', 'uses'])),
    contraindications: cleanTextArray(getStringArray(data, ['contraindications'])),
    pregnancy: getString(data, ['pregnancy', 'pregnancy_category']),
    storage: getString(data, ['storage', 'storage_conditions']),
    prescriptionStatus: getString(data, ['prescriptionStatus', 'prescription_status']),
    color: getString(data, ['color']),
    shape: getString(data, ['shape']),
    imprint: getString(data, ['imprint']),
    expDate: getString(data, ['expDate', 'exp_date']),
    mfgDate: getString(data, ['mfgDate', 'mfg_date']),
    batchNumber: getString(data, ['batchNumber', 'batch_number']),
    mrp: getString(data, ['mrp']),
    confidence,
    dataSource: getString(data, ['dataSource']) || 'database'
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stages: ProcessingStage[] = [];

  console.log('\n' + '='.repeat(60));
  console.log('🔬 STANDARD DRUG IDENTIFY V2 (AGGRESSIVE)');
  console.log('='.repeat(60));

  try {
    // Parse request
    const body = await req.json();
    const image = body.image || body.imageBase64;

    if (!image) {
      return createResponse({
        success: false,
        error: 'No image provided',
        processingStages: [],
        confidence: 'low'
      }, 400);
    }

    // ========================================================================
    // STAGE 1: VISION OCR (Aggressive)
    // ========================================================================
    const visionResult = await performVisionOCR(image);

    stages.push({
      name: 'vision-ocr',
      success: !!visionResult?.name && visionResult.name !== 'Unknown',
      data: visionResult,
      processingTime: Date.now() - startTime
    });

    // NOTE: Removed early failure check here. We proceed even if "Unknown".
    
    const drugName = visionResult?.name || 'Unknown';
    const genericName = visionResult?.genericName;
    console.log(`\n✅ Identified (Stage 1): "${drugName}" / "${genericName || 'N/A'}"`);

    // ========================================================================
    // START PARALLEL TASKS
    // ========================================================================
    // Start Janaushadhi lookup immediately if we have a name
    let janaushadhiPromise: Promise<JanaushadhiMatch> | null = null;
    if (drugName !== 'Unknown' && (drugName || genericName)) {
        console.log(`⚡ Starting parallel Janaushadhi lookup for: "${drugName}"`);
        janaushadhiPromise = findJanaushadhiAlternative(genericName || drugName);
    }

    // ========================================================================
    // STAGE 2: DATA ENRICHMENT (Cache + Database)
    // ========================================================================
    let drugData: DrugData | null = null;

    if (drugName !== 'Unknown') {
        try {
          drugData = await enrichFromSources(drugName, genericName);
          stages.push({
            name: 'data-enrichment',
            success: !!drugData,
            data: drugData ? { source: 'cache/database' } : null,
            processingTime: Date.now() - startTime
          });
        } catch (error) {
          console.error('❌ Enrichment error:', error);
          stages.push({
            name: 'data-enrichment',
            success: false,
            processingTime: Date.now() - startTime
          });
        }
    } else {
        console.log('⚠️ Skipping Stage 2 (Unknown Name)');
        stages.push({
            name: 'data-enrichment',
            success: false,
            data: { skipped: true },
            processingTime: Date.now() - startTime
        });
    }

    // Merge vision data into drug data if not found in cache/db
    if (!drugData) {
      drugData = {
        id: crypto.randomUUID(),
        name: drugName,
        genericName: genericName || '',
        manufacturer: visionResult?.manufacturer || '',
        category: visionResult?.category || '',
        description: visionResult?.description || '',
        strength: visionResult?.strength || '',
        dosageForm: visionResult?.dosageForm || '',
        color: visionResult?.color || '',
        shape: visionResult?.shape || '',
        imprint: visionResult?.imprint || '',
        expDate: visionResult?.expDate || '',
        mfgDate: visionResult?.mfgDate || '',
        batchNumber: visionResult?.batchNumber || '',
        mrp: visionResult?.mrp || '',
        confidence: (visionResult?.confidence || 0) >= 80 ? 'high' : (visionResult?.confidence || 0) >= 50 ? 'medium' : 'low',
        sideEffects: [],
        warnings: [],
        interactions: [],
        indications: [],
        contraindications: [],
        dataSource: 'vision-ocr'
      } as DrugData;
    }

    // ========================================================================
    // STAGE 3: AI KNOWLEDGE ENHANCEMENT
    // ========================================================================
    try {
      drugData = await enhanceWithAIKnowledge(drugData, drugName, genericName);
      stages.push({
        name: 'ai-enhancement',
        success: true,
        processingTime: Date.now() - startTime
      });
    } catch (error) {
      console.error('❌ AI Enhancement error:', error);
      stages.push({
        name: 'ai-enhancement',
        success: false,
        processingTime: Date.now() - startTime
      });
    }

    // ========================================================================
    // STAGE 4: JANAUSHADHI LOOKUP + FINAL RESPONSE
    // ========================================================================
    try {
      if (janaushadhiPromise) {
          const janaushadhiResult = await janaushadhiPromise;
          
          // Ensure MRP is a number to prevent "0" string issues
          if (janaushadhiResult.found && janaushadhiResult.mrp !== undefined) {
              janaushadhiResult.mrp = Number(janaushadhiResult.mrp);
          }

          // ALWAYS attach the result
          drugData.janaushadhiAlternative = janaushadhiResult;

          if (janaushadhiResult.found) {
            // Add to alternatives list for UI visibility
            const janaushadhiEntry = {
                name: janaushadhiResult.genericName,
                brand: "Janaushadhi Pariyojana",
                manufacturer: "Bureau of Pharma PSUs of India (BPPI)",
                price: `₹${janaushadhiResult.mrp}`,
                saved: janaushadhiResult.savings,
                description: janaushadhiResult.advice,
                drugCode: janaushadhiResult.drugCode,
                strength: janaushadhiResult.strength,
                formulation: janaushadhiResult.formulation,
                isJanaushadhi: true,
                type: 'Generic Alternative'
            };
            
            drugData.alternatives = drugData.alternatives || [];
            drugData.alternatives.unshift(janaushadhiEntry);
            
            console.log(`🏥 Janaushadhi alternative found (Parallel): ₹${janaushadhiResult.mrp}`);
          } else {
             console.log(`🏥 Janaushadhi not found (Parallel)`);
          }
      } else {
          // If no promise was started (e.g. unknown name), explicit set to not found
           drugData.janaushadhiAlternative = { found: false };
      }
    } catch (error) {
      console.error('❌ Janaushadhi lookup error:', error);
      // Fallback on error
      drugData.janaushadhiAlternative = { found: false };
    }
    
    // FINAL SAFETY CHECK: Ensure it's never undefined
    if (!drugData.janaushadhiAlternative) {
        drugData.janaushadhiAlternative = { found: false };
    }

    // Set processing time
    drugData.processingTime = Date.now() - startTime;

    // FINAL VALIDATION: Check if we have a meaningful result
    const isMeaningless = 
        drugData.name === 'Unknown' && 
        (!drugData.genericName || drugData.genericName === 'Unknown');

    if (isMeaningless) {
        console.log('⚠️ Final Result is Meaningless - Triggering Retry Suggestion');
        return createResponse({
            success: false,
            error: 'Could not identify medication. Please try a clearer photo.',
            data: {
              ...drugData,
              retakeRecommended: true,
              retakeTips: [
                'Ensure good lighting',
                'Keep medication label in focus',
                'Capture the full packaging',
                'Avoid reflections and shadows'
              ]
            },
            processingStages: stages.map(s => s.name),
            confidence: 'low',
            processingTime: drugData.processingTime
          });
    }

    // Log success
    console.log('\n' + '='.repeat(60));
    console.log('✅ IDENTIFICATION COMPLETE');
    console.log(`   Drug: ${drugData.name}`);
    console.log(`   Generic: ${drugData.genericName}`);
    console.log(`   Confidence: ${drugData.confidence}`);
    console.log(`   Processing Time: ${drugData.processingTime}ms`);
    console.log('='.repeat(60) + '\n');

    return createResponse({
      success: true,
      data: drugData,
      processingStages: stages.map(s => s.name),
      confidence: drugData.confidence,
      fallbackUsed: drugData.dataSource !== 'database',
      processingTime: drugData.processingTime
    });

  } catch (error: unknown) {
    console.error('❌ Fatal error:', error);

    // Check for rate limit
    const errorForCheck = error instanceof Error ? error : new Error(String(error));
    if (isRateLimitError(errorForCheck)) {
      logRateLimit('standard-drug-identify', errorForCheck.message);
      return createResponse(createRateLimitResponse());
    }

    return createResponse({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      processingStages: stages.map(s => s.name),
      confidence: 'low',
      processingTime: Date.now() - startTime
    }, 500);
  }
});
