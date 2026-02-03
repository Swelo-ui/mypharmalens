import "xhr";
declare const Deno: any;
import { checkDrugCacheWithValidation } from './cache-integration.ts';
import { cleanText, cleanTextArray, normalizeDrugName, generateNameAliases } from '../_shared/text-cleaner.ts';
import { findJanaushadhiAlternative, JanaushadhiMatch } from '../_shared/janaushadhi-lookup.ts';
import { isRateLimitError, createRateLimitResponse, logRateLimit } from '../_shared/rate-limit-handler.ts';

// ============================================================================
// STANDARD DRUG IDENTIFY V2 - SIMPLIFIED & ROBUST
// ============================================================================
// Designed for reliability over complexity
// 4 Essential Stages: Vision → Enrich → Enhance → Response
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
const VISION_MODEL = 'google/gemini-2.5-flash-lite';          // Best balance of Speed/Cost
const ENHANCEMENT_MODEL = 'google/gemini-2.5-flash-lite'; // For knowledge enhancement

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
    console.log('\n📷 === STAGE 1: VISION OCR ===');

    const cleanBase64 = imageBase64.includes('base64,')
        ? imageBase64.split('base64,')[1]
        : imageBase64;

    const prompt = `You are a pharmaceutical OCR expert. Analyze this medicine image carefully.

STEP 1: THINK & REASON
- First, analyze the image quality, text clarity, and orientation.
- Identify the most prominent text (likely the Brand Name).
- Distinguish between Brand Name and Generic Name based on font size/style.
- Assess confidence based on visibility.

STEP 2: EXTRACT VISIBLE IDENTITY INFORMATION
- Product/Brand name (most important)
- Generic/Active ingredient name
- Manufacturer/Company name
- Strength/Dosage (e.g., "500mg")
- Dosage form (tablet, syrup, etc.)
- Physical appearance (color, shape) of the pill/package
- Any visible codes/imprints
- Expiry date, Manufacturing date
- Batch/Lot number
- MRP price

DO NOT GENERATE GENERAL DESCRIPTIONS OR USAGE INFO. FOCUS ON EXTRACTING TEXT.

HANDLING DIFFICULT IMAGES:
- If image is torn/cut: extract what's visible, infer the rest
- If blurry: use context clues and common drug patterns
- If partially visible: make educated guesses based on pharmaceutical knowledge

CONFIDENCE SCORING (0-100):
- 90-100: Clear
- 70-89: Mostly readable
- 50-69: Inference used
- Below 50: Low confidence

CRITICAL: Return ONLY valid JSON:
{
  "_reasoning": "Brief thought process about image quality and text identification...",
  "name": "Product name",
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
  "ocrText": "all visible text extracted"
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
                temperature: 0.1,
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
            // Try regex extraction as fallback
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                visionData = JSON.parse(jsonMatch[0]);
            } else {
                console.error('❌ Failed to parse vision JSON');
                return null;
            }
        }

        console.log(`✅ Vision OCR Success:`);
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
    const searchPromises: Promise<{ type: 'cache' | 'db'; data: any; key: string }>[] = [];

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

            // Normalize to DrugData format
            return normalizeToDrugData(data, 'high');
        }
    }

    console.log('❌ No results from cache or database');
    return null;
}

async function searchLocalDatabase(drugName: string): Promise<any> {
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
    console.log(`   Enhancing: "${drugName}"`);

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

DRUG: "${drugName}"${genericName ? ` (Generic: ${genericName})` : ''}

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
            return ensureCompleteData(partialData, drugName, genericName);
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
                            (partialData as any)[field] = cleanTextArray(value);
                            enhancedCount++;
                            console.log(`   ✅ Enhanced ${field}: ${value.length} items`);
                        } else if (typeof value === 'string' && value.length > 10) {
                            (partialData as any)[field] = cleanText(value);
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

    return ensureCompleteData(partialData, drugName, genericName);
}

// ============================================================================
// STAGE 4: FINAL RESPONSE BUILDER
// ============================================================================

function ensureCompleteData(
    partialData: Partial<DrugData>,
    drugName: string,
    genericName?: string
): DrugData {
    return {
        id: partialData.id || crypto.randomUUID(),
        name: partialData.name || drugName,
        genericName: partialData.genericName || genericName || '',
        manufacturer: partialData.manufacturer || '',
        category: partialData.category || 'Medication',
        description: partialData.description || `${drugName} is a pharmaceutical product.`,
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
        processingTime: partialData.processingTime
    };
}

function normalizeToDrugData(data: any, confidence: 'high' | 'medium' | 'low'): DrugData {
    return {
        id: data.id || crypto.randomUUID(),
        name: data.name || data.drug_name || '',
        genericName: data.genericName || data.generic_name || '',
        manufacturer: data.manufacturer || '',
        category: data.category || data.drug_class || '',
        description: data.description || '',
        strength: data.strength || '',
        dosageForm: data.dosageForm || data.dosage_form || '',
        dosageAndAdmin: data.dosageAndAdmin || data.dosage_and_admin || '',
        mechanism: data.mechanism || data.mechanism_of_action || '',
        sideEffects: cleanTextArray(data.sideEffects || data.side_effects || []),
        warnings: cleanTextArray(data.warnings || []),
        interactions: cleanTextArray(data.interactions || data.drug_interactions || []),
        indications: cleanTextArray(data.indications || data.uses || []),
        contraindications: cleanTextArray(data.contraindications || []),
        pregnancy: data.pregnancy || data.pregnancy_category || '',
        storage: data.storage || data.storage_conditions || '',
        prescriptionStatus: data.prescriptionStatus || data.prescription_status || '',
        color: data.color || '',
        shape: data.shape || '',
        imprint: data.imprint || '',
        expDate: data.expDate || data.exp_date || '',
        mfgDate: data.mfgDate || data.mfg_date || '',
        batchNumber: data.batchNumber || data.batch_number || '',
        mrp: data.mrp || '',
        confidence,
        dataSource: data.dataSource || 'database'
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
    console.log('🔬 STANDARD DRUG IDENTIFY V2');
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
        // STAGE 1: VISION OCR
        // ========================================================================
        const visionResult = await performVisionOCR(image);

        stages.push({
            name: 'vision-ocr',
            success: !!visionResult?.name,
            data: visionResult,
            processingTime: Date.now() - startTime
        });

        if (!visionResult || !visionResult.name || visionResult.name.toLowerCase() === 'unknown') {
            console.log('⚠️ Vision OCR failed to identify drug name');

            // Return helpful error with retake suggestion
            return createResponse({
                success: false,
                error: 'Could not identify medication. Please try a clearer photo.',
                data: {
                    id: crypto.randomUUID(),
                    name: 'Unknown',
                    genericName: 'Error Occurred',
                    description: 'The image could not be processed. Please ensure the medication name is clearly visible and retake the photo.',
                    confidence: 'low',
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
                processingTime: Date.now() - startTime
            });
        }

        const drugName = visionResult.name;
        const genericName = visionResult.genericName;
        console.log(`\n✅ Identified: "${drugName}" / "${genericName}"`);

        // ========================================================================
        // STAGE 2: DATA ENRICHMENT (Cache + Database)
        // ========================================================================
        let drugData: DrugData | null = null;

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

        // Merge vision data into drug data if not found in cache/db
        if (!drugData) {
            drugData = {
                id: crypto.randomUUID(),
                name: drugName,
                genericName: genericName || '',
                manufacturer: visionResult.manufacturer || '',
                category: visionResult.category || '',
                description: visionResult.description || '',
                strength: visionResult.strength || '',
                dosageForm: visionResult.dosageForm || '',
                color: visionResult.color || '',
                shape: visionResult.shape || '',
                imprint: visionResult.imprint || '',
                expDate: visionResult.expDate || '',
                mfgDate: visionResult.mfgDate || '',
                batchNumber: visionResult.batchNumber || '',
                mrp: visionResult.mrp || '',
                confidence: visionResult.confidence >= 80 ? 'high' : visionResult.confidence >= 50 ? 'medium' : 'low',
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
            const janaushadhiResult = await findJanaushadhiAlternative(genericName || drugName);
            if (janaushadhiResult.found) {
                drugData.janaushadhiAlternative = janaushadhiResult;
                console.log(`🏥 Janaushadhi alternative found: ₹${janaushadhiResult.mrp}`);
            }
        } catch (error) {
            console.error('❌ Janaushadhi lookup error:', error);
        }

        // Set processing time
        drugData.processingTime = Date.now() - startTime;

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
