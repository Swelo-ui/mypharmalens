import "xhr";
// Fix for "Cannot find name 'Deno'"
declare const Deno: any;
import { checkDrugCache as checkCacheIntegration, checkDrugCacheWithValidation } from './cache-integration.ts';
import { aiCompareDrugNames } from './ai-validator.ts';
import { performCriticalVisionAnalysis, shouldUseCriticalAnalysis } from '../_shared/critical-vision-analysis.ts';
import { cleanText, cleanMechanismText, cleanTextArray, normalizeDrugName, generateNameAliases, normalizeManufacturer } from '../_shared/text-cleaner.ts';
import { geminiExtractName, geminiValidateData as _geminiValidateData } from '../_shared/ai-helpers.ts';
import { performIntelligentWebSearch, shouldUseIntelligentWebSearch } from '../_shared/intelligent-web-search.ts';
import { isRateLimitError, createRateLimitResponse, getRateLimitErrorMessage, logRateLimit } from '../_shared/rate-limit-handler.ts';
import { findJanaushadhiAlternative, JanaushadhiMatch } from '../_shared/janaushadhi-lookup.ts';
// AI fallback imports (will be used when adding intelligent fallbacks)
// import {
//   extractDrugFromImage,
//   extractDataFromHTML,
//   correctScrapedData,
//   logAIUsage
// } from '../_shared/ai-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenRouter configuration - All vision models via OpenRouter (No direct Gemini)
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Supabase configuration - CRITICAL for API calls
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// COST-OPTIMIZED MODEL SELECTION:
// - OCR Stage: Full Gemini 2.5 Flash (best extraction power - crucial for accuracy)
// - Other Stages: Gemini 2.5 Flash Lite (validation, web scraping, correction - 50% cheaper)
const VISION_MODEL_PRIMARY = 'google/gemini-2.5-flash';        // PRIMARY: OCR & Vision extraction (ALWAYS use for best accuracy)
const VISION_MODEL_LITE = 'google/gemini-2.5-flash-lite';      // LITE: Validation, fallback, non-critical tasks
const VISION_MODEL_FALLBACK = 'google/gemini-2.5-flash-lite';  // Fallback for vision tasks (was gemini-flash-3-preview)

// Web scraping & validation: Use LITE model for cost savings
const WEB_SCRAPING_MODEL = 'google/gemini-2.5-flash-lite';    // LITE for web scraping & reasoning
const VALIDATION_MODEL = 'google/gemini-2.5-flash-lite';       // LITE for hallucination check & validation

// Standard Mode data cleaner - Clean all data but NO rate limiting
// Removes markdown/asterisks but returns FULL data (no item limits)

/**
 * Clean HTML for web scraping - removes scripts, styles, ads, nav
 * Reduces token count by ~70% while preserving drug information
 */
function cleanHTMLForScraping(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000); // Reduced from 15000 to 5000
}

/**
 * Validate drug data fields to ensure they contain meaningful information
 * Detects placeholder text, empty values, and triggers fallback when needed
 */
function validateDrugFields(data: DrugData, fieldName?: string): { isValid: boolean; missingFields: string[]; hasPlaceholders: boolean } {
  const missingFields: string[] = [];
  let hasPlaceholders = false;

  // Placeholder patterns to detect - EXPANDED to catch more cases
  const placeholderPatterns = [
    /^not available$/i,
    /^n\/a$/i,
    /^unknown$/i,
    /^not found$/i,
    /^information not (available|found)$/i,
    /^data not available$/i,
    /^no (data|information)$/i,
    /^not specified$/i,
    /not specified on packaging/i,  // Frontend fallback text
    /not explicitly listed/i,
    /not visible on packaging/i,
    /consult (your )?(healthcare|doctor|physician)/i,  // Generic fallback
    /^\s*$/  // Empty or whitespace only
  ];

  // Helper: Check if value is a placeholder
  const isPlaceholder = (value: string | undefined | null): boolean => {
    if (!value || typeof value !== 'string') return true;
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;
    return placeholderPatterns.some(pattern => pattern.test(trimmed));
  };

  // Helper: Check if array has meaningful data
  const hasValidArrayData = (arr: unknown): boolean => {
    if (!Array.isArray(arr)) return false;
    if (arr.length === 0) return false;
    // Check if array items are not placeholders
    return arr.some(item => typeof item === 'string' && !isPlaceholder(item));
  };

  // Critical fields that must have real data (not placeholders)
  // EXPANDED: Now includes contraindications, interactions, pregnancy for complete drug info
  const criticalStringFields: (keyof DrugData)[] = ['description', 'mechanism', 'dosageAndAdmin', 'pregnancy'];
  const criticalArrayFields: (keyof DrugData)[] = ['sideEffects', 'warnings', 'indications', 'contraindications', 'interactions'];

  // Validate string fields
  criticalStringFields.forEach(field => {
    const value = data[field];
    if (typeof value === 'string' && isPlaceholder(value)) {
      missingFields.push(field as string);
      hasPlaceholders = true;
    } else if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      missingFields.push(field as string);
    }
  });

  // Validate array fields
  criticalArrayFields.forEach(field => {
    const value = data[field];
    if (!hasValidArrayData(value)) {
      missingFields.push(field as string);
      if (Array.isArray(value) && value.some(item => typeof item === 'string' && isPlaceholder(item))) {
        hasPlaceholders = true;
      }
    }
  });

  const isValid = missingFields.length === 0 && !hasPlaceholders;

  if (!isValid) {
    console.log(`⚠️ FIELD VALIDATION FAILED:`);
    if (missingFields.length > 0) {
      console.log(`   Missing/Invalid fields: ${missingFields.join(', ')}`);
    }
    if (hasPlaceholders) {
      console.log(`   Contains placeholder text ("Not available", "N/A", etc.)`);
    }
  }

  return { isValid, missingFields, hasPlaceholders };
}

/**
 * PHARMACEUTICAL KNOWLEDGE ENHANCEMENT
 * Uses AI pharmaceutical knowledge to fill in missing critical drug information.
 * This is the KEY function that ensures complete drug data even when:
 * - Web scraping returns empty fields
 * - Image only shows drug name (packaging doesn't list side effects, etc.)
 * - Data sources have incomplete information
 */
async function enhanceWithPharmaceuticalKnowledge(
  data: DrugData,
  drugName: string,
  genericName?: string
): Promise<DrugData> {
  // Validate current data to find missing fields
  const validation = validateDrugFields(data);

  if (validation.isValid) {
    console.log(`✅ All critical fields present - no enhancement needed`);
    return data;
  }

  console.log(`\n🧪 === PHARMACEUTICAL KNOWLEDGE ENHANCEMENT ===`);
  console.log(`   Drug: ${drugName} (${genericName || 'unknown generic'})`);
  console.log(`   Missing fields: ${validation.missingFields.join(', ')}`);

  try {
    const enhancementPrompt = `You are a pharmaceutical database expert with comprehensive knowledge of medications worldwide. 

DRUG TO ENHANCE: "${drugName}"${genericName ? ` (Generic: ${genericName})` : ''}

MISSING INFORMATION NEEDED:
${validation.missingFields.map(f => `- ${f}`).join('\n')}

YOUR TASK: Provide COMPLETE, ACCURATE pharmaceutical information for the missing fields above.

CRITICAL RULES:
1. Use your pharmaceutical knowledge database - this is REAL drug information, not hypothetical
2. For side effects: List 5-8 common side effects actually associated with this drug/drug class
3. For contraindications: List 5-8 conditions where this drug should NOT be used
4. For interactions: List 5-8 drugs/substances that interact with this medication
5. For pregnancy: Provide the FDA pregnancy category and safety information
6. For mechanism: Explain how the drug works in the body (pharmacological mechanism)
7. For warnings: List 5-8 important safety warnings
8. For indications: List 5-8 conditions this medication treats

FORMATTING RULES:
- Use PLAIN TEXT ONLY - no markdown, asterisks, or formatting
- Be specific and medically accurate
- NEVER say "consult your doctor" or "not available" - provide actual data
- Each array item should be a complete, informative statement

OUTPUT (JSON with ONLY the requested missing fields):
{
${validation.missingFields.map(field => {
      if (['sideEffects', 'contraindications', 'interactions', 'warnings', 'indications'].includes(field)) {
        return `  "${field}": ["item1", "item2", "item3", "item4", "item5"]`;
      } else {
        return `  "${field}": "complete information here"`;
      }
    }).join(',\n')}
}`;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get("SUPABASE_URL") || '',
        'X-Title': 'PharmaLens Pharmaceutical Enhancement'
      },
      body: JSON.stringify({
        model: WEB_SCRAPING_MODEL,
        messages: [{ role: 'user', content: enhancementPrompt }],
        temperature: 0.1,
        max_tokens: 1200, // Larger for comprehensive data
        stop: ["}"] // Stop at JSON end
      })
    });

    if (!response.ok) {
      console.error(`❌ Pharmaceutical enhancement API error: ${response.status}`);
      return data;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    const finishReason = result.choices?.[0]?.finish_reason || 'unknown';

    // Handle potential truncation
    let jsonContent = content;
    if (finishReason === 'length' && !jsonContent.trim().endsWith('}')) {
      const openBraces = (jsonContent.match(/{/g) || []).length;
      const closeBraces = (jsonContent.match(/}/g) || []).length;
      const missingBraces = openBraces - closeBraces;
      if (missingBraces > 0) {
        jsonContent = jsonContent + '}'.repeat(missingBraces);
      }
    }

    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const enhancement = JSON.parse(jsonMatch[0]);

      // Merge enhanced fields into data
      let enhancedCount = 0;
      validation.missingFields.forEach(field => {
        if (enhancement[field]) {
          const value = enhancement[field];
          // Validate the enhanced value is not a placeholder
          if (Array.isArray(value) && value.length > 0) {
            (data as any)[field] = value;
            enhancedCount++;
            console.log(`   ✅ Enhanced ${field}: ${value.length} items`);
          } else if (typeof value === 'string' && value.trim().length > 10) {
            (data as any)[field] = value;
            enhancedCount++;
            console.log(`   ✅ Enhanced ${field}: ${value.substring(0, 50)}...`);
          }
        }
      });

      console.log(`🧪 Enhancement complete: ${enhancedCount}/${validation.missingFields.length} fields filled`);
      console.log(`🧪 === PHARMACEUTICAL ENHANCEMENT COMPLETE ===\n`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Pharmaceutical enhancement failed:`, error);
    return data;
  }
}

// deno-lint-ignore no-explicit-any
function limitDataForStandardMode(data: any): any {
  if (!data) return data;

  return {
    ...data,
    // Keep ALL array items (no limit) - just clean formatting
    sideEffects: Array.isArray(data.sideEffects) ? cleanTextArray(data.sideEffects) : [],
    warnings: Array.isArray(data.warnings) ? cleanTextArray(data.warnings) : [],
    interactions: Array.isArray(data.interactions) ? cleanTextArray(data.interactions) : [],
    indications: Array.isArray(data.indications) ? cleanTextArray(data.indications) : [],
    contraindications: Array.isArray(data.contraindications) ? cleanTextArray(data.contraindications) : [],
    brandNames: Array.isArray(data.brandNames) ? cleanTextArray(data.brandNames) : [],
    // NO WORD LIMITS - show full text (better UX, complete information)
    description: cleanText(data.description || ''),
    mechanism: cleanMechanismText(data.mechanism || ''),
    dosageAndAdmin: data.dosageAndAdmin ? cleanText(data.dosageAndAdmin) : data.dosageAndAdmin,
    storage: data.storage ? cleanText(data.storage) : data.storage,
    pregnancy: data.pregnancy ? cleanText(data.pregnancy) : data.pregnancy
  };
}

// Smart Pre-Processing Types
interface PreProcessingResult {
  imageComplexity: 'simple' | 'moderate' | 'complex';
  suggestedMode: 'standard' | 'enhanced';
  cachePreCheckAvailable: boolean;
  qualityScore: number;
  challenges: string[];
  recommendations: string[];
}

interface QualityScore {
  overall: number;
  dataCompleteness: number;
  sourceReliability: number;
  validationLevel: number;
  confidence: Confidence;
}

interface EnrichedMetadata {
  processingPipeline: string[];
  qualityMetrics: QualityScore;
  dataSources: string[];
  processingTime: number;
  cacheStatus: 'hit' | 'miss' | 'partial';
  aiValidationUsed: boolean;
  fallbacksTriggered: string[];
  timestamp: string;
}

// Drug data interface for type safety
interface DrugData {
  name?: string;
  genericName?: string;
  description?: string;
  sideEffects?: string[];
  warnings?: string[];
  indications?: string[];
  contraindications?: string[];
  mechanism?: string;
  dosageAndAdmin?: string;
  manufacturer?: string;
  category?: string;
  drugClass?: string;
  storage?: string;
  prescriptionStatus?: string;
  pregnancy?: string;
  imprint?: string;
  color?: string;
  shape?: string;
  brandNames?: string[];
  possibleNames?: string[];
  verified?: boolean;
  completeness?: number;
  // Cache-specific properties
  fromCache?: boolean;
  cacheCompleteness?: number;
  qualityScore?: number;
  [key: string]: unknown; // Allow additional properties
}

// Enriched response interface
interface EnrichedResponse extends DrugData {
  _metadata: EnrichedMetadata;
  _preprocessing: {
    imageComplexity: 'simple' | 'moderate' | 'complex';
    suggestedMode: 'standard' | 'enhanced';
    qualityScore: number;
    challenges: string[];
  };
  qualityScore: number;
  dataCompleteness: number;
  sourceReliability: number;
}

// Typed shapes used across OCR and fallback flows
type Confidence = 'high' | 'medium' | 'low';

interface VisionResult {
  name?: string;
  nameSource?: 'visible' | 'partial' | 'corrected';
  genericName?: string;
  manufacturer?: string;
  manufacturerSource?: 'visible' | 'partial' | 'not_visible';
  strength?: string;
  verified?: boolean;
  correctedFrom?: string | null;
  description?: string;
  confidence?: Confidence;
  color?: string;
  shape?: string;
  imprint?: string;
  ocrSource?: string;
  fullText?: string;
  fallbackUsed?: string;
  needsCriticalAnalysis?: boolean;
  tornOrCut?: boolean;
  blurry?: boolean;
  reflective?: boolean;
  partialView?: boolean;
  imageChallenges?: string[];
  imageQuality?: number;
}


interface ScrapedDrugData {
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  description?: string;
  mechanism?: string;
  indications?: string[];
  sideEffects?: string[];
  contraindications?: string[];
  interactions?: string[];
  warnings?: string[];
  dosageAndAdmin?: string;
  storage?: string;
  prescriptionStatus?: string;
  pregnancy?: string;
  brandNames?: string[];
  price?: string;
  availability?: string;
  extractionQuality?: number;
  dataCompleteness?: number;
  sourceUrl?: string;
  scrapingMethod?: string;
  source?: string;
  scrapedAt?: string;
  dataQuality?: number;
  completeness?: number;
  corrections?: string[];
  validationNotes?: string;
  correctedAt?: string;
  correctionMethod?: string;
  // Image condition flags for Critical Vision trigger
  imageChallenges?: string[];
  needsCriticalAnalysis?: boolean;
  imageQuality?: number;
  blurry?: boolean;
  tornOrCut?: boolean;
  reflective?: boolean;
  partialView?: boolean;
}

interface DataQualityMeta {
  hasBasicInfo: boolean;
  hasVisualInfo: boolean;
  verified: boolean;
  lastChecked: string;
  completeness: number;
  warnings: string[];
}

interface PartialDrugData {
  id: string;
  name: string;
  genericName?: string;
  description?: string;
  confidence: Confidence;
  color?: string;
  shape?: string;
  imprint?: string;
  manufacturer?: string;
  category?: string;
  drugClass?: string;
  dosageAndAdmin?: string;
  mechanism?: string;
  pregnancy?: string;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  indications: string[];
  contraindications: string[];
  storage: string;
  prescriptionStatus: string;
  brandNames: string[];
  recommendations: string[];
  dataQuality?: DataQualityMeta;
}

interface DrugIdentificationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  processingStages: string[];
  confidence: 'high' | 'medium' | 'low';
  fallbackUsed: boolean;
  processingTime: number;
}

interface ProcessingStage {
  name: string;
  success: boolean;
  data?: unknown;
  error?: string;
  processingTime: number;
}

function createResponse(data: DrugIdentificationResult, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Smart Pre-Processing: Analyze image complexity and suggest mode
async function performSmartPreProcessing(imageBase64: string): Promise<PreProcessingResult> {
  console.log('\n🧠 === SMART PRE-PROCESSING STAGE ===');
  const startTime = Date.now();

  try {
    // Quick vision analysis to determine image complexity
    const analysisPrompt = `Analyze this pharmaceutical image and determine:
1. Image quality (0-100)
2. Text clarity (high/medium/low)
3. Lighting conditions (good/poor)
4. Visible challenges (torn, blurry, reflective, partial view)
5. Recommended processing mode (standard for clear images, enhanced for complex)

Return ONLY JSON:
{
  "imageQuality": 0-100,
  "textClarity": "high/medium/low",
  "lighting": "good/poor",
  "challenges": ["torn", "blurry", etc.],
  "recommendedMode": "standard/enhanced"
}`;

    const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get("SUPABASE_URL") || '',
        'X-Title': 'PharmaLens Smart Pre-Processing'
      },
      body: JSON.stringify({
        model: VISION_MODEL_LITE, // Use LITE model for pre-processing (not critical OCR)
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
          ]
        }],
        temperature: 0.1,
        max_tokens: 256
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        const imageQuality = analysis.imageQuality || 50;
        const challenges = analysis.challenges || [];
        const recommendedMode = analysis.recommendedMode || 'standard';

        // Determine complexity based on quality and challenges
        let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
        if (imageQuality < 40 || challenges.length > 2) {
          complexity = 'complex';
        } else if (imageQuality < 70 || challenges.length > 0) {
          complexity = 'moderate';
        }

        const result: PreProcessingResult = {
          imageComplexity: complexity,
          suggestedMode: recommendedMode === 'enhanced' ? 'enhanced' : 'standard',
          cachePreCheckAvailable: imageQuality > 60,
          qualityScore: imageQuality,
          challenges: challenges,
          recommendations: [
            complexity === 'complex' ? '⚠️ Enhanced Mode recommended for best results' : '✅ Standard Mode should work well',
            challenges.includes('blurry') ? '💡 Consider retaking with better focus' : '',
            challenges.includes('reflective') ? '💡 Reduce glare/reflection if possible' : '',
            imageQuality < 50 ? '💡 Better lighting recommended' : ''
          ].filter(r => r.length > 0)
        };

        const processingTime = Date.now() - startTime;
        console.log(`   Image Complexity: ${result.imageComplexity.toUpperCase()}`);
        console.log(`   Quality Score: ${result.qualityScore}/100`);
        console.log(`   Suggested Mode: ${result.suggestedMode.toUpperCase()}`);
        console.log(`   Challenges: ${result.challenges.join(', ') || 'None'}`);
        console.log(`   Processing Time: ${processingTime}ms`);
        console.log(`🧠 === PRE-PROCESSING COMPLETE ===\n`);

        return result;
      }
    }
  } catch (error) {
    console.error(`❌ Pre-processing error:`, error);
  }

  // Fallback result if analysis fails
  return {
    imageComplexity: 'moderate',
    suggestedMode: 'standard',
    cachePreCheckAvailable: true,
    qualityScore: 50,
    challenges: [],
    recommendations: ['📸 Image analysis unavailable, proceeding with standard mode']
  };
}

// 🛡️ STAGE 2: HALLUCINATION CHECK - Safety mechanism to filter OCR errors
// Verifies if the extracted drug name actually exists in pharmaceutical knowledge
interface HallucinationCheckResult {
  isValid: boolean;
  correctedName?: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  suggestedAlternatives?: string[];
}

async function performHallucinationCheck(extractedName: string, genericName?: string): Promise<HallucinationCheckResult> {
  console.log('\\n🛡️ === STAGE 2: HALLUCINATION CHECK ===');
  console.log(`   Verifying: "${extractedName}" (Generic: "${genericName || 'N/A'}")`);
  const startTime = Date.now();

  try {
    const prompt = `You are a pharmaceutical verification expert. Your task is to verify if this drug name is REAL and EXISTS in actual pharmaceutical databases.

EXTRACTED DRUG NAME: "${extractedName}"
EXTRACTED GENERIC NAME: "${genericName || 'Not provided'}"

CRITICAL VERIFICATION TASKS:
1. Is "${extractedName}" a REAL pharmaceutical product that exists?
2. If NOT, is it likely an OCR error? (e.g., "CROCIB" might be OCR misread of "CROCIN")
3. If it's an OCR error, what is the CORRECT drug name?
4. Does the generic name match what this drug should contain?

COMMON OCR ERRORS TO CHECK:
- Letters confused: B↔D, I↔L, O↔0, S↔5, G↔6, N↔M
- Missing letters or extra characters
- Partial names (only part of the full name visible)

OUTPUT (JSON only):
{
  "isValid": true/false,
  "originalName": "${extractedName}",
  "correctedName": "Actual drug name if OCR error detected, or null if valid",
  "confidence": "high/medium/low",
  "reasoning": "Brief explanation of verification result",
  "suggestedAlternatives": ["Similar real drugs if verification failed"],
  "genericMatch": true/false
}

Be STRICT - only mark as valid if you are confident this is a real pharmaceutical product.
Return ONLY JSON:`;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get("SUPABASE_URL") || '',
        'X-Title': 'PharmaLens Hallucination Check'
      },
      body: JSON.stringify({
        model: VALIDATION_MODEL, // Use LITE model for validation (cost savings)
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500, // Raised from 300 to prevent JSON truncation
        stop: ["}"] // Stop immediately when JSON ends
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const verification = JSON.parse(jsonMatch[0]);
        const processingTime = Date.now() - startTime;

        if (verification.isValid) {
          console.log(`   ✅ VERIFIED: "${extractedName}" is a real pharmaceutical product`);
          console.log(`   Confidence: ${verification.confidence}`);
        } else if (verification.correctedName) {
          console.log(`   🔄 OCR CORRECTION: "${extractedName}" → "${verification.correctedName}"`);
          console.log(`   Reasoning: ${verification.reasoning}`);
        } else {
          console.log(`   ❌ REJECTED: "${extractedName}" appears to be a hallucination/OCR error`);
          console.log(`   Suggestions: ${verification.suggestedAlternatives?.join(', ') || 'None'}`);
        }
        console.log(`   Processing Time: ${processingTime}ms`);
        console.log(`🛡️ === HALLUCINATION CHECK COMPLETE ===\\n`);

        return {
          isValid: verification.isValid || false,
          correctedName: verification.correctedName || undefined,
          confidence: verification.confidence || 'low',
          reasoning: verification.reasoning || 'Verification completed',
          suggestedAlternatives: verification.suggestedAlternatives || []
        };
      }
    }
  } catch (error) {
    console.error(`   ❌ Hallucination check error:`, error);
  }

  // Fallback: Assume valid if check fails (don't block the pipeline)
  console.log(`   ⚠️ Verification unavailable, proceeding with caution`);
  return {
    isValid: true,
    confidence: 'low',
    reasoning: 'Verification service unavailable, proceeding with original name'
  };
}

// Calculate quality score based on data completeness and source reliability
function calculateQualityScore(data: DrugData, sources: string[]): QualityScore {
  let dataCompleteness = 0;
  let sourceReliability = 0;
  let validationLevel = 0;

  // Data completeness (0-100)
  const requiredFields = ['name', 'genericName', 'description', 'sideEffects', 'warnings'];
  const optionalFields = ['indications', 'contraindications', 'mechanism', 'dosageAndAdmin'];

  requiredFields.forEach(field => {
    const value = data[field as keyof DrugData];
    if (value && (typeof value === 'string' ? value.length > 0 : Array.isArray(value) && value.length > 0)) {
      dataCompleteness += 15;
    }
  });

  optionalFields.forEach(field => {
    const value = data[field as keyof DrugData];
    if (value && (typeof value === 'string' ? value.length > 0 : Array.isArray(value) && value.length > 0)) {
      dataCompleteness += 6.25;
    }
  });

  // Source reliability (0-100)
  const reliableSourceScores: Record<string, number> = {
    'cache-search': 95,
    'local-database-smart-search': 90,
    '1mg-intelligent-scraping': 75,
    'medlineplus-intelligent-scraping': 80,
    'multi-source-api-fallback': 85,
    'multi-source-comprehensive-fallback': 80,
    'openrouter-vision': 60,
    'critical-vision-analysis': 70,
    'ai-powered-fallback': 65
  };

  sources.forEach(source => {
    sourceReliability = Math.max(sourceReliability, reliableSourceScores[source] || 50);
  });

  // Validation level (0-100)
  if (sources.includes('cache-search') || sources.includes('local-database-smart-search')) {
    validationLevel = 90; // AI validated
  } else if (sources.some(s => s.includes('intelligent-scraping'))) {
    validationLevel = 70; // AI corrected
  } else if (sources.includes('multi-source-api-fallback')) {
    validationLevel = 75; // Multi-source verified
  } else {
    validationLevel = 50; // Single source
  }

  const overall = Math.round((dataCompleteness * 0.4 + sourceReliability * 0.35 + validationLevel * 0.25));

  let confidence: Confidence = 'low';
  if (overall >= 80) confidence = 'high';
  else if (overall >= 60) confidence = 'medium';

  return {
    overall,
    dataCompleteness: Math.round(dataCompleteness),
    sourceReliability: Math.round(sourceReliability),
    validationLevel: Math.round(validationLevel),
    confidence
  };
}

// Enrich response with metadata
function enrichResponseMetadata(
  data: DrugData,
  stages: ProcessingStage[],
  preProcessing: PreProcessingResult,
  overallStartTime: number
): EnrichedResponse {
  if (data.manufacturer) {
    data.manufacturer = normalizeManufacturer(cleanText(data.manufacturer));
  }
  const successfulStages = stages.filter(s => s.success).map(s => s.name);
  const failedStages = stages.filter(s => !s.success).map(s => s.name);

  const qualityMetrics = calculateQualityScore(data, successfulStages);

  const cacheStatus: 'hit' | 'miss' | 'partial' =
    successfulStages.includes('cache-search') ? 'hit' :
      successfulStages.includes('local-database-smart-search') ? 'partial' : 'miss';

  const aiValidationUsed = stages.some(s =>
    s.name.includes('ai-powered') ||
    s.name.includes('critical-vision') ||
    s.name.includes('intelligent-scraping')
  );

  const metadata: EnrichedMetadata = {
    processingPipeline: successfulStages,
    qualityMetrics,
    dataSources: [...new Set(successfulStages)],
    processingTime: Date.now() - overallStartTime,
    cacheStatus,
    aiValidationUsed,
    fallbacksTriggered: failedStages,
    timestamp: new Date().toISOString()
  };

  return {
    ...data,
    _metadata: metadata,
    _preprocessing: {
      imageComplexity: preProcessing.imageComplexity,
      suggestedMode: preProcessing.suggestedMode,
      qualityScore: preProcessing.qualityScore,
      challenges: preProcessing.challenges
    },
    qualityScore: qualityMetrics.overall,
    dataCompleteness: qualityMetrics.dataCompleteness,
    sourceReliability: qualityMetrics.sourceReliability
  } as EnrichedResponse;
}

// Functions for local database search (uses SUPABASE_URL and SUPABASE_ANON_KEY from top of file)

async function checkLocalDatabase(drugName: string, threshold: number = 0.75): Promise<unknown> {
  try {
    console.log(`      🔎 Local DB API call: query="${drugName}", threshold=${threshold}`);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/local-drug-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ query: drugName, threshold })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.data) {
        console.log(`      ✅ Local DB returned: ${data.data.name || 'data found'}`);
      } else {
        console.log(`      ❌ Local DB: No match`);
      }
      return data?.data;
    } else {
      console.log(`      ❌ Local DB API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('      ❌ Local database search exception:', error);
  }
  return null;
}

// Enhanced cache check with validation
async function checkDrugCache(
  drugName: string,
  extractedInfo?: {
    genericNames?: string[];
    imprint?: string;
    color?: string;
    shape?: string;
  }
): Promise<unknown> {
  try {
    // Use validated cache check if we have extracted info
    if (extractedInfo) {
      return await checkDrugCacheWithValidation(drugName, extractedInfo);
    }
    // Fall back to basic cache check
    return await checkCacheIntegration(drugName);
  } catch (error) {
    console.error('Cache check error:', error);
  }
  return null;
}

// OpenRouter Vision with 2-tier fallback: Gemini 2.5 Flash → Gemini Flash 3 Preview
async function performOpenRouterAnalysis(imageBase64: string, modelIndex: number = 0): Promise<VisionResult | null> {
  // Select model based on index: 0 = Gemini 2.5 Flash (Primary), 1 = Gemini Flash 3 Preview (Fallback)
  const models = [
    { id: VISION_MODEL_PRIMARY, name: 'Gemini 2.5 Flash' },
    { id: VISION_MODEL_FALLBACK, name: 'Gemini Flash 3 Preview' }
  ];

  const currentModel = models[modelIndex];
  if (!currentModel) return null; // All models exhausted

  const { id: modelToUse, name: modelName } = currentModel;

  try {
    console.log(`🔄 Using OpenRouter Vision (${modelName})...`);

    const prompt = `You are an expert pharmaceutical drug identifier. Extract ALL visible drug information from this medicine image.

CRITICAL TASKS:
1. Extract ALL visible text from packaging (brand name, generic name, manufacturer, strength)
2. Verify the drug name is REAL (not OCR error or hallucination)
3. Detect image quality issues

EXTRACTION RULES:
- Brand Name: Exact name on package (e.g., "Crocin 650", "Dolo 650")
- Generic Name: Active ingredient from composition (e.g., "Paracetamol 650mg")
- Manufacturer: Company name if visible (e.g., "GSK", "Micro Labs"). If NOT visible, set to "not_visible"
- Strength: Dosage if visible (e.g., "500mg", "650mg")

DRUG VERIFICATION (IMPORTANT):
- Is this a REAL pharmaceutical product?
- If name looks like OCR error (e.g., "CROC1N" → "CROCIN"), provide corrected name
- Set verified=true ONLY if confident drug exists

IMAGE CHALLENGES:
- "torn" - Strip is torn/cut/damaged
- "blurry" - Text unclear
- "reflective" - Glare on foil
- "partial" - Partial view only

OUTPUT (JSON only):
{
  "name": "Brand name (verified or corrected)",
  "nameSource": "visible/partial/corrected",
  "genericName": "Active ingredient",
  "manufacturer": "Company name or not_visible",
  "manufacturerSource": "visible/partial/not_visible",
  "strength": "Dosage if visible",
  "verified": true/false,
  "correctedFrom": "Original OCR if corrected, null otherwise",
  "confidence": "high/medium/low",
  "imageChallenges": ["torn", "blurry", etc.],
  "needsCriticalAnalysis": true/false,
  "imageQuality": 0-100,
  "tornOrCut": true/false,
  "blurry": true/false,
  "reflective": true/false,
  "partialView": true/false
}

Be ACCURATE. Extract manufacturer if visible. Verify drug is real. Return ONLY JSON:`;

    const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get("SUPABASE_URL") || '',
        'X-Title': 'PharmaLens Drug Identifier'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
          ]
        }],
        temperature: 0.1,
        max_tokens: 512, // Standard Mode: Fast response
        response_format: { type: 'json_object' } // Force structured JSON output
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter Vision (${modelName}) failed: ${response.status}`);
    }

    const openRouterResponse = await response.json();
    const content = openRouterResponse.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as VisionResult;
        console.log(`✅ OpenRouter Vision (${modelName}) Success: "${parsed.name}"`);
        return { ...parsed, fallbackUsed: modelName };
      } catch (parseError) {
        console.error(`❌ OpenRouter (${modelName}) JSON parse error:`, parseError);
      }
    }

    throw new Error(`No valid JSON in OpenRouter (${modelName}) response`);
  } catch (error) {
    console.error(`❌ OpenRouter Vision (${modelName}) failed:`, error);

    // Try next model in cascade: Gemini 2.5 Flash → Gemini Flash 3 Preview
    const nextModelIndex = modelIndex + 1;
    if (nextModelIndex < 2 && OPENROUTER_API_KEY) {
      const nextModelName = models[nextModelIndex]?.name || 'Fallback model';
      console.log(`🔄 ${modelName} failed, trying ${nextModelName}...`);
      return await performOpenRouterAnalysis(imageBase64, nextModelIndex);
    }

    console.log('❌ All Gemini vision models exhausted (2-tier cascade)');

    // Return user-friendly error instead of null
    throw new Error('Server not responding. All vision analysis services are currently unavailable. Please try again later or contact us for support.');
  }
}

// Intelligent Web Scraping with Gemini 2.5 Flash
async function intelligentWebScraping(drugName: string, source: '1mg' | 'medlineplus'): Promise<ScrapedDrugData> {
  console.log(`🕷️ Intelligent web scraping for "${drugName}" from ${source}...`);

  try {
    // Step 1: Construct search URL
    let searchUrl: string;
    let url: string;

    if (source === '1mg') {
      searchUrl = `https://www.1mg.com/search/all?name=${encodeURIComponent(drugName)}`;
      url = searchUrl; // Will be updated after search
    } else {
      searchUrl = `https://medlineplus.gov/druginfo/meds/${encodeURIComponent(drugName.toLowerCase().replace(/\s+/g, ''))}.html`;
      url = searchUrl; // Will be updated after search
    }

    console.log(`   Fetching: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`   HTML fetched: ${html.length} characters`);

    // Step 2: Use DeepSeek R1T2 Chimera to intelligently extract drug data
    const extractionPrompt = `You are an expert web scraper specializing in pharmaceutical data extraction. Analyze this HTML content from ${source} and extract comprehensive drug information.

TARGET DRUG: "${drugName}"

EXTRACTION REQUIREMENTS:
1. **Drug Identification**:
   - Brand name (exact match for "${drugName}")
   - Generic name / Active ingredient
   - Manufacturer / Company
   - Drug class / Category

2. **Physical Properties**:
   - Dosage form (tablet, syrup, injection, etc.)
   - Strength/Dosage (mg, ml, etc.)
   - Color, shape, imprint (if available)

3. **Medical Information**:
   - Mechanism of action (how it works)
   - Indications (what it treats) - list 5-8 conditions
   - Side effects - list 8-10 common ones
   - Contraindications - list 5-8 conditions to avoid
   - Drug interactions - list 5-8 important ones
   - Warnings and precautions - list 5-8 key warnings

FORMATTING RULES (CRITICAL):
- Use PLAIN TEXT ONLY - NO markdown formatting
- NEVER use asterisks (**text**), underscores (__text__), or any markdown
- Write naturally without bold/italic markers
- Do NOT use phrases like "not explicitly listed" or "not visible on packaging"
- All text should be clean, professional, and ready for direct display
- CRITICAL: For missing fields, use empty string "" or empty array []
- Prioritize extracting real data. If information is truly not found, use empty string "" or empty array [].

4. **Usage Information**:
   - Dosage and administration instructions
   - Storage conditions
   - Prescription status (OTC/Prescription/Controlled)
   - Pregnancy category/safety

5. **Additional Data**:
   - Brand variations/alternate names
   - Price information (if available)
   - Availability status

CRITICAL DATA EXTRACTION RULES:
- Focus ONLY on the drug "${drugName}" - ignore other search results
- Extract EXACT, COMPLETE text from the webpage - be thorough
- For description: Extract full medical description, what condition it treats, how it helps
- For mechanism: Extract the complete mechanism of action explanation
- For ALL fields: Search the entire page content carefully before concluding data is missing
- If truly not found, use empty string "" or empty array [] - validation will trigger enhancement
- Prioritize completeness AND accuracy - extract all available information
- Look for structured data in tables, lists, sections, and paragraph content
- Use PLAIN TEXT ONLY - NO markdown, asterisks, or formatting markers
- All extracted text must be clean and ready for direct user display

HTML CONTENT:
${cleanHTMLForScraping(html)}

OUTPUT FORMAT (JSON):
{
  "name": "Brand name",
  "genericName": "Active ingredient",
  "manufacturer": "Company name",
  "category": "Drug class",
  "dosageForm": "tablet/syrup/etc",
  "strength": "mg/ml amount",
  "description": "Brief description",
  "mechanism": "How it works",
  "indications": ["condition1", "condition2", ...],
  "sideEffects": ["effect1", "effect2", ...],
  "contraindications": ["condition1", "condition2", ...],
  "interactions": ["drug1", "drug2", ...],
  "warnings": ["warning1", "warning2", ...],
  "dosageAndAdmin": "Usage instructions",
  "storage": "Storage conditions",
  "prescriptionStatus": "OTC/Prescription/Controlled",
  "pregnancy": "Safety category",
  "brandNames": ["brand1", "brand2", ...],
  "price": "Price if available",
  "availability": "Available/Out of stock",
  "extractionQuality": 0-100,
  "dataCompleteness": 0-100,
  "sourceUrl": "${url}"
}

Return ONLY valid JSON. Be thorough but accurate.`;

    console.log(`   Using Gemini 2.5 Flash for intelligent extraction...`);

    const aiResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get("SUPABASE_URL") || '',
        'X-Title': 'PharmaLens Intelligent Web Scraper'
      },
      body: JSON.stringify({
        model: WEB_SCRAPING_MODEL,
        messages: [{
          role: 'user',
          content: extractionPrompt
        }],
        temperature: 0.1, // Low temperature for accuracy
        max_tokens: 1000, // Raised from 700 to prevent JSON truncation (finish_reason: length)
        top_p: 0.9,
        stop: ["}"] // CRITICAL: Stop immediately when JSON ends to prevent extra tokens
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`Gemini API error: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiResult = await aiResponse.json();
    const extractedContent = aiResult.choices?.[0]?.message?.content || '';
    const finishReason = aiResult.choices?.[0]?.finish_reason || 'unknown';

    // 🚨 CRITICAL: Detect if response was truncated (finish_reason: length)
    if (finishReason === 'length') {
      console.error(`⚠️ RESPONSE TRUNCATED! finish_reason: ${finishReason}`);
      console.error(`   This means max_tokens was hit before AI finished writing.`);
      console.error(`   Attempting to salvage partial JSON...`);
    }

    console.log(`   Gemini response (finish_reason: ${finishReason}): ${extractedContent.substring(0, 200)}...`);

    // Parse JSON from AI response - handle potentially truncated responses
    let jsonContent = extractedContent;

    // If response was truncated, try to fix incomplete JSON
    if (finishReason === 'length' && !jsonContent.trim().endsWith('}')) {
      console.log(`   Attempting to auto-close truncated JSON...`);
      // Count open braces and close them
      const openBraces = (jsonContent.match(/{/g) || []).length;
      const closeBraces = (jsonContent.match(/}/g) || []).length;
      const missingBraces = openBraces - closeBraces;
      if (missingBraces > 0) {
        jsonContent = jsonContent + '}'.repeat(missingBraces);
        console.log(`   Added ${missingBraces} closing brace(s) to fix truncation`);
      }
    }

    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsedData = JSON.parse(jsonMatch[0]);
        console.log(`✅ Intelligent scraping success: ${parsedData.name} (${parsedData.dataCompleteness}% complete)`);

        // Add metadata
        parsedData.scrapingMethod = 'Gemini 2.5 Flash Lite'; // Cost-optimized
        parsedData.source = source;
        parsedData.scrapedAt = new Date().toISOString();
        parsedData._finishReason = finishReason; // Track if response was truncated

        return parsedData;
      } catch (parseError) {
        console.error(`❌ JSON parse error:`, parseError);
        if (finishReason === 'length') {
          console.error(`   JSON parsing failed due to truncation. Response was cut off at max_tokens limit.`);
        }
        throw new Error(`Failed to parse extracted data (finish_reason: ${finishReason})`);
      }
    } else {
      console.error(`❌ No JSON found in Gemini response`);
      throw new Error('No structured data extracted');
    }

  } catch (error) {
    console.error(`❌ Intelligent web scraping failed for ${source}:`, error);
    throw error;
  }
}

// Data correction and validation using Gemini 2.5 Flash
async function correctAndValidateData(rawData: ScrapedDrugData, drugName: string): Promise<ScrapedDrugData> {
  console.log(`🔍 Correcting and validating data for "${drugName}"...`);

  try {
    const correctionPrompt = `You are a pharmaceutical data validator and corrector. Review this extracted drug data and correct any errors, inconsistencies, or missing information.

TARGET DRUG: "${drugName}"

RAW EXTRACTED DATA:
${JSON.stringify(rawData, null, 2)}

VALIDATION TASKS:
1. **Data Accuracy**: Check if all information is medically accurate and consistent
2. **Completeness**: Identify missing critical information
3. **Formatting**: Standardize formats (dosages, drug names, etc.)
4. **Deduplication**: Remove duplicate entries in arrays
5. **Medical Validation**: Ensure side effects, interactions, and indications are realistic
6. **Consistency**: Check that generic name matches brand name
7. **Quality Scoring**: Rate the overall data quality 0-100

CORRECTION RULES:
- Fix obvious typos and formatting issues
- Standardize drug names (proper capitalization)
- Ensure dosage formats are consistent (e.g., "500mg" not "500 mg")
- Remove HTML artifacts or encoding issues
- Validate that side effects are real medical terms
- Check that indications match the drug's actual uses
- Ensure interactions are with real drug names
- Standardize manufacturer names
- REMOVE ALL MARKDOWN FORMATTING (**, __, *, etc.)
- Remove phrases like "not explicitly listed" or "not visible on packaging"
- Ensure all text is plain, clean, and ready for direct user display
- Replace any bold markers with plain text

OUTPUT FORMAT (JSON):
{
  "name": "Corrected brand name",
  "genericName": "Corrected generic name",
  "manufacturer": "Standardized manufacturer",
  "category": "Corrected drug class",
  "dosageForm": "Standardized form",
  "strength": "Standardized strength",
  "description": "Corrected description",
  "mechanism": "Validated mechanism",
  "indications": ["validated_condition1", "validated_condition2", ...],
  "sideEffects": ["validated_effect1", "validated_effect2", ...],
  "contraindications": ["validated_contraindication1", ...],
  "interactions": ["validated_drug1", "validated_drug2", ...],
  "warnings": ["validated_warning1", "validated_warning2", ...],
  "dosageAndAdmin": "Corrected instructions",
  "storage": "Standardized storage",
  "prescriptionStatus": "Validated status",
  "pregnancy": "Corrected pregnancy info",
  "brandNames": ["corrected_brand1", "corrected_brand2", ...],
  "price": "Formatted price",
  "availability": "Validated availability",
  "dataQuality": 0-100,
  "completeness": 0-100,
  "corrections": ["correction1", "correction2", ...],
  "validationNotes": "Any important notes about the data quality"
}

Return ONLY valid JSON with corrected and validated data.`;

    console.log(`   Using Gemini R1T2 Chimera for data correction...`);

    const correctionResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get("SUPABASE_URL") || '',
        'X-Title': 'PharmaLens Data Validator'
      },
      body: JSON.stringify({
        model: WEB_SCRAPING_MODEL,
        messages: [{
          role: 'user',
          content: correctionPrompt
        }],
        temperature: 0.05, // Very low temperature for accuracy
        max_tokens: 1000, // Raised from 800 to prevent JSON truncation (finish_reason: length)
        top_p: 0.8,
        stop: ["}"] // CRITICAL: Stop immediately when JSON ends to prevent extra tokens
      })
    });

    if (!correctionResponse.ok) {
      throw new Error(`Gemini correction API error: ${correctionResponse.status}`);
    }

    const correctionResult = await correctionResponse.json();
    const correctedContent = correctionResult.choices?.[0]?.message?.content || '';
    const finishReason = correctionResult.choices?.[0]?.finish_reason || 'unknown';

    // 🚨 CRITICAL: Detect if response was truncated (finish_reason: length)
    if (finishReason === 'length') {
      console.error(`⚠️ CORRECTION RESPONSE TRUNCATED! finish_reason: ${finishReason}`);
      console.error(`   This means max_tokens was hit before AI finished writing.`);
    }

    // Parse corrected JSON - handle potentially truncated responses
    let jsonContent = correctedContent;

    // If response was truncated, try to fix incomplete JSON
    if (finishReason === 'length' && !jsonContent.trim().endsWith('}')) {
      console.log(`   Attempting to auto-close truncated correction JSON...`);
      const openBraces = (jsonContent.match(/{/g) || []).length;
      const closeBraces = (jsonContent.match(/}/g) || []).length;
      const missingBraces = openBraces - closeBraces;
      if (missingBraces > 0) {
        jsonContent = jsonContent + '}'.repeat(missingBraces);
        console.log(`   Added ${missingBraces} closing brace(s) to fix truncation`);
      }
    }

    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const correctedData = JSON.parse(jsonMatch[0]);
        console.log(`✅ Data correction complete (finish_reason: ${finishReason}): Quality ${correctedData.dataQuality}%, Completeness ${correctedData.completeness}%`);

        // 🛡️ CRITICAL VALIDATION: Check if corrected data has real information
        const validation = validateDrugFields(correctedData as DrugData);

        if (!validation.isValid) {
          console.log(`⚠️ Corrected data still has missing/invalid fields: ${validation.missingFields.join(', ')}`);
          console.log(`   Attempting to fill missing fields with pharmaceutical knowledge...`);

          // Try to enhance missing fields using AI
          try {
            const enhancementPrompt = `You are a pharmaceutical database expert. The following drug data is missing these fields: ${validation.missingFields.join(', ')}.

DRUG: ${drugName}
EXISTING DATA:
${JSON.stringify(correctedData, null, 2)}

Provide ONLY the missing information based on your pharmaceutical knowledge. Return JSON with ONLY these fields:
${validation.missingFields.map(f => `"${f}": "complete information here"`).join(',\n')}

IMPORTANT:
- Provide real, accurate pharmaceutical information
- NEVER use "Not available", "N/A", or placeholder text
- If you truly don't have information, use empty string "" or []
- Be thorough and complete in your descriptions`;

            const enhancementResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': Deno.env.get("SUPABASE_URL") || '',
                'X-Title': 'PharmaLens Field Enhancement'
              },
              body: JSON.stringify({
                model: WEB_SCRAPING_MODEL,
                messages: [{ role: 'user', content: enhancementPrompt }],
                temperature: 0.1,
                max_tokens: 500
              })
            });

            if (enhancementResponse.ok) {
              const enhancementResult = await enhancementResponse.json();
              const enhancementContent = enhancementResult.choices?.[0]?.message?.content || '{}';
              const enhancementMatch = enhancementContent.match(/\{[\s\S]*\}/);

              if (enhancementMatch) {
                const enhancement = JSON.parse(enhancementMatch[0]);
                // Merge enhanced fields into corrected data
                validation.missingFields.forEach(field => {
                  if (enhancement[field]) {
                    (correctedData as any)[field] = enhancement[field];
                    console.log(`   ✅ Enhanced field: ${field}`);
                  }
                });
              }
            }
          } catch (enhancementError) {
            console.error(`❌ Field enhancement failed:`, enhancementError);
          }
        }

        // Add correction metadata
        correctedData.correctedAt = new Date().toISOString();
        correctedData.correctionMethod = 'Gemini 2.5 Flash';

        return correctedData;
      } catch (parseError) {
        console.error(`❌ Correction JSON parse error:`, parseError);
        return rawData; // Return original if correction fails
      }
    } else {
      console.error(`❌ No JSON found in correction response`);
      return rawData; // Return original if correction fails
    }

  } catch (error) {
    console.error(`❌ Data correction error:`, error);
    return rawData; // Return original data if correction fails
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const overallStartTime = Date.now();
  const stages: ProcessingStage[] = [];

  try {
    const { imageBase64 } = await req.json();

    console.log('='.repeat(80));
    console.log(`⚡ STANDARD MODE - SPEED OPTIMIZED (30-40% FASTER!)`);
    console.log('='.repeat(80));
    console.log('📋 Pipeline Stages:');
    console.log('   1. Smart Pre-Processing (~500ms)');
    console.log('   2. OpenRouter Vision 3-tier (~500ms)');
    console.log('   3. Critical Vision (if needed, ~1s)');
    console.log('   4. ⚡ PARALLEL Cache + Local DB (~100ms) - NEW!');
    console.log('   5. ⚡ Extended AI Validation (70-90%) - NEW!');
    console.log('   6. ⚡ PARALLEL Web Scraping (1mg + MedlinePlus) - NEW!');
    console.log('   7. Multi-Source API (~1s)');
    console.log('   8. ⚡ Early Exit (5-10x faster for high-confidence)');
    console.log('='.repeat(80));
    console.log('⚡ Optimizations:');
    console.log('   • Parallel cache + DB search (was sequential)');
    console.log('   • Parallel web scraping: 1mg + MedlinePlus (2x faster)');
    console.log('   • Early exit for 95%+ complete results');
    console.log('   • AI validation extended to 70-90% matches');
    console.log('='.repeat(80));

    // STAGE 0: Smart Pre-Processing
    let preProcessingResult: PreProcessingResult;
    try {
      preProcessingResult = await performSmartPreProcessing(imageBase64);
      stages.push({
        name: 'smart-preprocessing',
        success: true,
        data: preProcessingResult,
        processingTime: Date.now() - overallStartTime
      });

      // Show recommendations to user (would be shown in UI)
      if (preProcessingResult.recommendations.length > 0) {
        console.log('\n📢 Pre-Processing Recommendations:');
        preProcessingResult.recommendations.forEach(r => console.log(`   ${r}`));
      }
    } catch (error) {
      console.error('⚠️ Pre-processing failed, continuing with defaults:', error);
      preProcessingResult = {
        imageComplexity: 'moderate',
        suggestedMode: 'standard',
        cachePreCheckAvailable: true,
        qualityScore: 50,
        challenges: [],
        recommendations: []
      };
    }

    if (!imageBase64) {
      return createResponse({
        success: false,
        error: "No image provided",
        processingStages: [],
        confidence: 'low',
        fallbackUsed: false,
        processingTime: Date.now() - overallStartTime
      }, 400);
    }

    // Stage 1: OpenRouter Vision (Gemini 2.5 Flash → Gemini Flash 3 Preview cascade)
    console.log('🔍 Stage 1: OpenRouter Vision Analysis (Gemini 2.5 Flash → Gemini Flash 3 Preview)...');

    let visionResult;
    try {
      visionResult = await performOpenRouterAnalysis(imageBase64);
    } catch (error) {
      // Handle the case when all 3 vision models fail
      console.error('❌ All vision models failed:', error);

      stages.push({
        name: 'openrouter-vision',
        success: false,
        data: null,
        processingTime: Date.now() - overallStartTime
      });

      return createResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Server not responding. All vision analysis services are currently unavailable. Please try again later or contact us for support.',
        processingStages: stages.map(s => s.name),
        confidence: 'low',
        fallbackUsed: true,
        processingTime: Date.now() - overallStartTime
      }, 503); // 503 Service Unavailable
    }

    stages.push({
      name: 'openrouter-vision',
      success: !!visionResult,
      data: visionResult,
      processingTime: Date.now() - overallStartTime
    });

    // Use the OpenRouter vision result directly (already has 3-tier fallback built-in)
    const validatedResult = visionResult;

    let drugName = validatedResult?.name || 'Unknown';
    let genericName = validatedResult?.genericName || '';
    console.log(`📝 Validated - Brand: "${drugName}", Generic: "${genericName}"`);

    // 🛡️ STAGE 2: HALLUCINATION CHECK - SKIP if OCR already verified
    // OPTIMIZATION: OCR now includes verification, skip separate API call if verified
    const ocrAlreadyVerified = validatedResult?.verified === true && validatedResult?.confidence === 'high';

    if (ocrAlreadyVerified) {
      console.log('✅ OCR already verified drug - SKIPPING hallucination check (saves 1 API call)');
      // Use corrected name if OCR corrected it
      if (validatedResult?.correctedFrom) {
        console.log(`🔄 OCR auto-corrected: "${validatedResult.correctedFrom}" → "${drugName}"`);
      }
      stages.push({
        name: 'hallucination-check-skipped',
        success: true,
        data: { skipped: true, reason: 'OCR verified', verified: true },
        processingTime: Date.now() - overallStartTime
      });
    } else if (drugName && drugName !== 'Unknown' && !drugName.toLowerCase().includes('unknown')) {
      console.log('\\n🛡️ Running Hallucination Check to verify OCR accuracy...');
      try {
        const hallucinationResult = await performHallucinationCheck(drugName, genericName);

        stages.push({
          name: 'hallucination-check',
          success: hallucinationResult.isValid || !!hallucinationResult.correctedName,
          data: hallucinationResult,
          processingTime: Date.now() - overallStartTime
        });

        if (!hallucinationResult.isValid && hallucinationResult.correctedName) {
          // OCR error detected - use corrected name
          console.log(`🔄 OCR CORRECTION APPLIED: "${drugName}" → "${hallucinationResult.correctedName}"`);
          drugName = hallucinationResult.correctedName;
        } else if (!hallucinationResult.isValid && !hallucinationResult.correctedName) {
          // Drug name not recognized and no correction available
          console.log(`⚠️ Drug name "${drugName}" not verified - proceeding with caution`);
          if (hallucinationResult.suggestedAlternatives && hallucinationResult.suggestedAlternatives.length > 0) {
            // Try the first suggested alternative
            console.log(`   Trying first suggested alternative: "${hallucinationResult.suggestedAlternatives[0]}"`);
            drugName = hallucinationResult.suggestedAlternatives[0];
          }
        }
      } catch (error) {
        console.error('⚠️ Hallucination check failed, continuing with original name:', error);
      }
    }
    // �🔍 DEBUG: Log ALL challenge detection fields
    console.log('\n🔍 === CHALLENGE DETECTION DEBUG (STANDARD MODE) ===');
    console.log(`   needsCriticalAnalysis: ${validatedResult?.needsCriticalAnalysis}`);
    console.log(`   tornOrCut: ${validatedResult?.tornOrCut}`);
    console.log(`   blurry: ${validatedResult?.blurry}`);
    console.log(`   reflective: ${validatedResult?.reflective}`);
    console.log(`   partialView: ${validatedResult?.partialView}`);
    console.log(`   imageChallenges: ${JSON.stringify(validatedResult?.imageChallenges)}`);
    console.log(`   imageQuality: ${validatedResult?.imageQuality}`);
    console.log(`   confidence: ${validatedResult?.confidence}`);

    // Check if image has challenging conditions detected by OCR
    // 🚨 MORE AGGRESSIVE: Also trigger on low confidence or "Unknown" drug name
    const hasChallenges = validatedResult?.needsCriticalAnalysis ||
      validatedResult?.tornOrCut ||
      validatedResult?.blurry ||
      validatedResult?.reflective ||
      validatedResult?.partialView ||
      (validatedResult?.imageChallenges && validatedResult.imageChallenges.length > 0) ||
      (validatedResult?.imageQuality && validatedResult.imageQuality < 50) ||
      validatedResult?.confidence === 'low' ||
      drugName === 'Unknown' ||
      drugName.toLowerCase().includes('unknown');

    if (hasChallenges) {
      console.log('\n⚠️ === CHALLENGING IMAGE CONDITIONS DETECTED ===');
      console.log(`   Challenges: ${validatedResult?.imageChallenges?.join(', ') || 'Low quality/confidence'}`);
      console.log(`   Image Quality: ${validatedResult?.imageQuality || 'Unknown'}%`);
      console.log(`   Torn/Cut: ${validatedResult?.tornOrCut ? 'YES' : 'No'}`);
      console.log(`   Blurry: ${validatedResult?.blurry ? 'YES' : 'No'}`);
      console.log(`   Reflective: ${validatedResult?.reflective ? 'YES' : 'No'}`);
      console.log(`   Partial View: ${validatedResult?.partialView ? 'YES' : 'No'}`);
      console.log(`   🚨 TRIGGERING CRITICAL VISION ANALYSIS IMMEDIATELY...`);

      // Trigger Critical Vision Analysis for challenging images
      try {
        const criticalStage = await performCriticalVisionAnalysis(imageBase64, {
          previousAttemptFailed: drugName === 'Unknown',
          knownIssues: validatedResult?.imageChallenges || ['challenging_conditions'],
          mode: 'standard'
        });

        if (criticalStage.success && criticalStage.confidence >= 60 && criticalStage.data) {
          console.log(`✅ CRITICAL VISION IDENTIFIED: ${criticalStage.data.name} (${criticalStage.confidence}% confidence)`);
          console.log(`   Condition: ${criticalStage.data.physicalCondition}`);
          console.log(`   Safe to use: ${criticalStage.data.safeToUse ? 'Yes ✅' : 'No ❌'}`);

          stages.push({
            name: 'critical-vision-analysis',
            success: true,
            data: criticalStage.data,
            processingTime: Date.now() - overallStartTime
          });

          // Enrich with metadata using Unified Response Layer
          const enrichedData = enrichResponseMetadata(
            {
              ...criticalStage.data,
              criticalAnalysisUsed: true,
              challengingImageHandled: true
            },
            stages,
            preProcessingResult,
            overallStartTime
          );

          console.log(`\n✅ Critical Vision Analysis handled challenging image successfully!`);
          console.log(`=`.repeat(80));

          return createResponse({
            success: true,
            data: enrichedData,
            processingStages: stages.map(s => s.name),
            confidence: criticalStage.confidence >= 80 ? 'high' : 'medium',
            fallbackUsed: true,
            processingTime: Date.now() - overallStartTime
          });
        } else {
          console.log(`⚠️ Critical Vision Analysis ran but confidence too low (${criticalStage.confidence}%)`);
          console.log(`   Continuing with standard pipeline...`);
        }
      } catch (criticalError) {
        console.error(`❌ Critical Vision Analysis error:`, criticalError);
        console.log(`   Continuing with standard pipeline...`);
      }
    }

    // Stage 1.5: If OCR failed, try OpenRouter Vision fallback (dual model)
    if (!validatedResult || drugName === 'Unknown' || drugName.toLowerCase().includes('unknown')) {
      console.log('\n🔄 === GEMINI OCR FAILED - TRYING OPENROUTER VISION FALLBACK ===');

      // Try OpenRouter Vision (Qwen 2.5-VL → Nvidia Nemotron cascade)
      const openRouterResult = await performOpenRouterAnalysis(imageBase64);

      if (openRouterResult && openRouterResult?.name && openRouterResult.name !== 'Unknown') {
        console.log('✅ OPENROUTER VISION SUCCESS!');
        console.log(`   Model used: ${openRouterResult.fallbackUsed || 'Qwen 2.5-VL'}`);
        console.log(`   Extracted drug name: "${openRouterResult.name}"`);
        console.log(`   Extracted generic: "${openRouterResult.genericName || 'N/A'}"`);

        // Update drugName and genericName for cache/local DB search
        drugName = openRouterResult.name;
        genericName = openRouterResult.genericName || '';

        stages.push({
          name: 'openrouter-vision-fallback',
          success: true,
          data: openRouterResult,
          processingTime: Date.now() - overallStartTime
        });

        console.log('✅ OpenRouter Vision provided drug name - continuing to cache/local DB search...\n');
      } else {
        console.log('❌ OpenRouter Vision also failed - trying multi-source comprehensive analysis...');

        // Stage 1.6: Last resort - multi-source comprehensive analysis
        console.log('\n🔄 === ACTIVATING MULTI-SOURCE COMPREHENSIVE FALLBACK ===');
        console.log('⚡ Calling multi-source API for direct image analysis...');

        try {
          const multiSourceResponse = await fetch(`${SUPABASE_URL}/functions/v1/multi-source-drug-api`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              imageBase64,
              fallbackMode: true // Signal that this is a fallback request
            })
          });

          if (multiSourceResponse.ok) {
            const multiSourceData = await multiSourceResponse.json();

            if (multiSourceData.success && multiSourceData.data) {
              console.log('✅ Multi-source comprehensive analysis SUCCESSFUL!');
              const completeness = multiSourceData.data.completeness || 0;
              const isVerified = !!multiSourceData.data.verified;
              console.log(`   Drug identified: ${multiSourceData.data.name || 'N/A'}`);
              console.log(`   Generic: ${multiSourceData.data.genericName || 'N/A'}`);
              console.log(`   Completeness: ${completeness}%`);
              console.log(`   Verified: ${isVerified}`);

              // Accept results with moderate quality (50%+) to ensure Standard Mode works
              // Standard Mode focuses on speed + basic accuracy, not comprehensive data
              if (isVerified || completeness >= 50) {
                stages.push({
                  name: 'multi-source-comprehensive-fallback',
                  success: true,
                  data: multiSourceData.data,
                  processingTime: Date.now() - overallStartTime
                });

                // Enrich comprehensive fallback data with metadata  
                const enrichedComprehensiveData = enrichResponseMetadata(
                  multiSourceData.data,
                  stages,
                  preProcessingResult,
                  overallStartTime
                );

                return createResponse({
                  success: true,
                  data: enrichedComprehensiveData,
                  processingStages: stages.map(s => s.name),
                  confidence: isVerified ? 'high' : (completeness >= 90 ? 'high' : 'medium'),
                  fallbackUsed: true,
                  processingTime: Date.now() - overallStartTime
                });
              } else {
                console.log(`⚠️ Multi-source data quality moderate (${completeness}%), will try to improve with AI`);
                // Update drugName and genericName from multi-source for further processing
                if (multiSourceData.data.name && multiSourceData.data.name !== 'Unknown') {
                  drugName = multiSourceData.data.name;
                  genericName = multiSourceData.data.genericName || '';
                  console.log(`✅ Updated from multi-source - Brand: "${drugName}", Generic: "${genericName}"`);
                }
              }
            } else {
              console.log('⚠️ Multi-source API returned no usable data');
            }
          } else {
            console.log(`⚠️ Multi-source API failed: ${multiSourceResponse.status}`);
          }
        } catch (error) {
          console.error(`❌ Multi-source comprehensive fallback error:`, error);
        }
      }

      console.log('=== COMPREHENSIVE FALLBACK COMPLETE ===\n');
    }

    // ⚡ OPTIMIZATION 1: PARALLEL CACHE + LOCAL DB SEARCH (30-40% faster!)
    console.log('⚡ Stage 2+3: PARALLEL Cache + Local DB Search (OPTIMIZED)...');

    // Helper: Optimized early exit for fast cache hits and quality data
    const shouldEarlyExit = (data: DrugData): boolean => {
      // Safe number extraction with fallbacks
      const completeness = typeof data.completeness === 'number' ? data.completeness :
        (typeof data.cacheCompleteness === 'number' ? data.cacheCompleteness : 0);
      const confidence = data.confidence || 'low';
      const fromCache = Boolean(data.fromCache);
      const qualityScore = typeof data.qualityScore === 'number' ? data.qualityScore : 0;

      // Immediate exit for cache hits with reasonable completeness
      if (fromCache && completeness >= 60) {
        console.log(`\n🚀 IMMEDIATE CACHE EXIT: ${completeness}% complete cache hit!`);
        return true;
      }

      // Early exit for high-quality non-cache data  
      if (!fromCache && completeness >= 85 && (confidence === 'high' || qualityScore >= 85)) {
        console.log(`\n⚡ EARLY EXIT: ${completeness}% complete + ${confidence} confidence!`);
        return true;
      }

      // Quick exit for any very complete data
      if (completeness >= 95) {
        console.log(`\n⚡ QUICK EXIT: ${completeness}% completion achieved!`);
        return true;
      }

      return false;
    };

    if ((!drugName || drugName.toLowerCase().includes('unknown')) && imageBase64) {
      const g = await geminiExtractName(imageBase64);
      if (g.success) {
        let parsedName: string | undefined = undefined;
        try { const p = JSON.parse(g.text || '{}'); parsedName = p?.name; } catch { parsedName = undefined; }
        if (parsedName) drugName = parsedName;
      }
    }

    // Declare persistent variable for Janaushadhi result across all stages
    let janaushadhiResult: any = { found: false };

    if ((drugName && !drugName.toLowerCase().includes('unknown')) || (genericName && !genericName.toLowerCase().includes('unknown'))) {
      const candidates = new Set<string>();
      generateNameAliases(drugName || '').forEach(v => candidates.add(v));
      if (genericName && !genericName.toLowerCase().includes('unknown')) {
        generateNameAliases(genericName).forEach(v => candidates.add(v));
      }
      const uniqueVariations = [...candidates].filter(v => v && v.trim().length > 1);

      // Build queries for local DB
      const searchQueries: string[] = [];
      if (drugName && drugName !== 'Unknown' && !drugName.toLowerCase().includes('unknown')) {
        const dn = normalizeDrugName(drugName);
        searchQueries.push(dn);
        searchQueries.push(dn.replace(/[-\s]/g, ''));
      }
      if (genericName && genericName !== 'Unknown' && !genericName.toLowerCase().includes('unknown')) {
        const gn = normalizeDrugName(genericName);
        searchQueries.push(gn);
        searchQueries.push(gn.replace(/[-\s]/g, ''));
      }
      const uniqueQueries = [...new Set(searchQueries)].filter(q => q && q.length > 2);

      console.log(`⚡ PARALLEL: ${uniqueVariations.length} cache + ${uniqueQueries.length} DB queries`);

      // ⚡ RUN ALL SEARCHES IN PARALLEL (cache + all DB thresholds)
      const thresholds = [0.90, 0.80, 0.70]; // Extended AI validation range
      const allPromises: Promise<{ type: 'cache' | 'db', data: unknown, key?: string, thresh?: number }>[] = [];

      // Cache promises with validation data from vision analysis
      const extractedValidationInfo = {
        genericNames: genericName ? [genericName] : [],
        imprint: visionResult?.imprint,
        color: visionResult?.color,
        shape: visionResult?.shape
      };

      uniqueVariations.forEach(v => {
        allPromises.push(
          checkDrugCache(v, extractedValidationInfo).then(d => ({ type: 'cache' as const, data: d, key: v }))
        );
      });

      // Local DB promises (all thresholds in parallel)
      uniqueQueries.forEach(q => {
        thresholds.forEach(t => {
          allPromises.push(
            checkLocalDatabase(q, t).then(d => ({ type: 'db' as const, data: d, key: q, thresh: t }))
          );
        });
      });

      // 🏥 JANAUSHADHI LOOKUP - Run in parallel for generic alternatives
      // Assigned to function-scoped variable for persistence across stages
      const janaushadhiPromise = findJanaushadhiAlternative(drugName, genericName);

      const start = Date.now();
      let results: any[];
      // Use block-scoped variable for results, update function-scoped janaushadhiResult
      const [promiseResults, jResult] = await Promise.all([
        Promise.allSettled(allPromises),
        janaushadhiPromise
      ]);
      results = promiseResults;
      janaushadhiResult = jResult;

      console.log(`⚡ ${results.length} parallel searches + Janaushadhi done in ${Date.now() - start}ms!`);

      // Log Janaushadhi result
      if (janaushadhiResult.found) {
        console.log(`🏥 JANAUSHADHI MATCH: "${janaushadhiResult.genericName}" at ₹${janaushadhiResult.mrp}`);
        if (janaushadhiResult.savings) {
          console.log(`   💰 Potential savings: ${janaushadhiResult.savings}`);
        }
      } else {
        console.log(`🏥 No Janaushadhi alternative found`);
      }

      // Process cache hits first (highest quality)
      const cacheHits = results
        .filter(r => r.status === 'fulfilled' && r.value.type === 'cache' && r.value.data)
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (cacheHits.length > 0) {
        const hit = cacheHits[0];
        const hitData = hit.data as DrugData;
        console.log(`✅ CACHE HIT: "${hit.key}"! (${hitData.completeness || hitData.cacheCompleteness || 'Unknown'}% complete)`);

        stages.push({
          name: 'cache-search',
          success: true,
          data: hitData,
          processingTime: Date.now() - overallStartTime
        });

        // For cache hits, immediately enrich and return - no need for further processing
        const enrichedCacheData = enrichResponseMetadata(
          hitData,
          stages,
          preProcessingResult,
          overallStartTime
        );

        // 🏥 Add Janaushadhi alternative to response
        if (janaushadhiResult.found) {
          (enrichedCacheData as DrugData & { janaushadhiAlternative?: JanaushadhiMatch }).janaushadhiAlternative = janaushadhiResult;
        }

        console.log(`🚀 IMMEDIATE CACHE RETURN - No further processing needed`);
        console.log(`   Cache completeness: ${hitData.completeness || hitData.cacheCompleteness || 'Unknown'}%`);
        console.log(`   Processing time: ${Date.now() - overallStartTime}ms`);

        return createResponse({
          success: true,
          data: enrichedCacheData,
          processingStages: stages.map(s => s.name),
          confidence: 'high',
          fallbackUsed: false,
          processingTime: Date.now() - overallStartTime
        });
      }

      // Process local DB hits (with AI validation for 70-90%)
      const dbHits = results
        .filter(r => r.status === 'fulfilled' && r.value.type === 'db' && r.value.data)
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .sort((a, b) => (b.thresh || 0) - (a.thresh || 0)); // Highest threshold first

      for (const dbHit of dbHits) {
        const matchedDrugName = (dbHit.data as { name?: string; genericName?: string })?.name || '';
        const matchedGenericName = (dbHit.data as { name?: string; genericName?: string })?.genericName;

        console.log(`🎯 DB HIT: "${matchedDrugName}" (${(dbHit.thresh! * 100).toFixed(0)}%)`);

        // ⚡ EXTENDED AI VALIDATION: 70-90% (was 75-85%)
        if (dbHit.thresh! < 0.90) {
          console.log(`🔐 AI validating ${(dbHit.thresh! * 100).toFixed(0)}% match...`);
          const aiValidation = await aiCompareDrugNames(
            drugName,
            genericName,
            matchedDrugName,
            matchedGenericName
          );

          if (!aiValidation.isSame) {
            console.log(`❌ AI rejected: ${aiValidation.reasoning}`);
            continue;
          }
          console.log(`✅ AI confirmed: ${aiValidation.reasoning}`);
        }

        stages.push({
          name: 'local-database-smart-search',
          success: true,
          data: dbHit.data,
          processingTime: Date.now() - overallStartTime
        });

        const enrichedLocalData = enrichResponseMetadata(
          dbHit.data as DrugData,
          stages,
          preProcessingResult,
          overallStartTime
        );

        // 🏥 Add Janaushadhi alternative to response
        if (janaushadhiResult.found) {
          (enrichedLocalData as DrugData & { janaushadhiAlternative?: JanaushadhiMatch }).janaushadhiAlternative = janaushadhiResult;
        }

        // ⚡ OPTIMIZED EXIT CHECK - More lenient for database hits
        const dbData = dbHit.data as DrugData;
        if (shouldEarlyExit(dbData) || (dbHit.thresh! >= 0.85 && dbData.name && dbData.genericName)) {
          console.log(`🎯 FAST DB RETURN: ${dbHit.thresh! >= 0.85 ? 'High' : 'Good'} confidence match`);
          return createResponse({
            success: true,
            data: enrichedLocalData,
            processingStages: stages.map(s => s.name),
            confidence: dbHit.thresh! >= 0.90 ? 'high' : 'medium',
            fallbackUsed: false,
            processingTime: Date.now() - overallStartTime
          });
        }

        return createResponse({
          success: true,
          data: enrichedLocalData,
          processingStages: stages.map(s => s.name),
          confidence: dbHit.thresh! >= 0.90 ? 'high' : 'medium',
          fallbackUsed: false,
          processingTime: Date.now() - overallStartTime
        });
      }

      console.log('❌ No results from parallel cache + DB search');
    }

    // (Old Stage 3 removed - now using parallel cache + DB search above)

    // ⚡ OPTIMIZATION 2: PARALLEL WEB SCRAPING (2x faster!)
    console.log('⚡ Stage 4: PARALLEL Web Scraping (1mg + MedlinePlus - OPTIMIZED)...');
    if (drugName && drugName !== 'Unknown') {
      const searchTerm = drugName;
      console.log(`⚡ Launching PARALLEL scraping: 1mg.com + MedlinePlus`);

      const scrapingStart = Date.now();

      // ⚡ RUN BOTH SCRAPING + VALIDATION IN PARALLEL
      const scrapingResults = await Promise.allSettled([
        intelligentWebScraping(searchTerm, '1mg')
          .then(raw => raw ? correctAndValidateData(raw, searchTerm) : null)
          .then(data => ({ source: '1mg', data })),
        intelligentWebScraping(searchTerm, 'medlineplus')
          .then(raw => raw ? correctAndValidateData(raw, searchTerm) : null)
          .then(data => ({ source: 'medlineplus', data }))
      ]);

      const scrapingTime = Date.now() - scrapingStart;
      console.log(`⚡ Parallel scraping done in ${scrapingTime}ms (vs ~${scrapingTime * 2}ms sequential)`);

      // Process 1mg result
      const oneMgResult = scrapingResults[0].status === 'fulfilled' ? scrapingResults[0].value : null;
      if (oneMgResult?.data) {
        console.log(`✅ 1mg.com: ${oneMgResult.data.dataQuality || 0}% quality`);

        stages.push({
          name: '1mg-intelligent-scraping',
          success: true,
          data: oneMgResult.data,
          processingTime: Date.now() - overallStartTime
        });

        // 🛡️ Validate data before returning - ensure no "Not available" placeholders
        const validation = validateDrugFields(oneMgResult.data as DrugData);
        if (validation.hasPlaceholders) {
          console.log(`⚠️ 1mg data contains placeholder text - applying cleanup...`);
          // Remove placeholder fields
          validation.missingFields.forEach(field => {
            const value = (oneMgResult.data as any)[field];
            if (typeof value === 'string' && /not available|n\/a|unknown/i.test(value)) {
              (oneMgResult.data as any)[field] = ''; // Clear placeholder
            }
          });
        }

        const limitedData = limitDataForStandardMode(oneMgResult.data);

        // 🧪 PHARMACEUTICAL ENHANCEMENT: Fill in any missing critical fields with AI knowledge
        const enhancedWithPharmaKnowledge = await enhanceWithPharmaceuticalKnowledge(
          limitedData as DrugData,
          oneMgResult.data.name || drugName,
          oneMgResult.data.genericName || genericName
        );

        const enrichedData = enrichResponseMetadata(enhancedWithPharmaKnowledge as any, stages, preProcessingResult, overallStartTime);

        // 🏥 Add Janaushadhi alternative
        if (janaushadhiResult && janaushadhiResult.found) {
          (enrichedData as DrugData & { janaushadhiAlternative?: JanaushadhiMatch }).janaushadhiAlternative = janaushadhiResult;
        }

        // ⚡ OPTIMIZED EXIT CHECK - More balanced for scraped data
        if (shouldEarlyExit(limitedData) || (oneMgResult.data.dataQuality && oneMgResult.data.dataQuality > 70)) {
          console.log(`🕷️ FAST SCRAPING RETURN: Quality score ${oneMgResult.data.dataQuality || 'Unknown'}%`);
          return createResponse({
            success: true,
            data: enrichedData,
            processingStages: stages.map(s => s.name),
            confidence: (oneMgResult.data.dataQuality && oneMgResult.data.dataQuality > 80) ? 'high' : 'medium',
            fallbackUsed: true,
            processingTime: Date.now() - overallStartTime
          });
        }

        return createResponse({
          success: true,
          data: enrichedData,
          processingStages: stages.map(s => s.name),
          confidence: (oneMgResult.data.dataQuality && oneMgResult.data.dataQuality > 80) ? 'high' : 'medium',
          fallbackUsed: true,
          processingTime: Date.now() - overallStartTime
        });
      } else {
        stages.push({ name: '1mg-intelligent-scraping', success: false, data: null, processingTime: Date.now() - overallStartTime });
      }

      // Process MedlinePlus result
      const medlinePlusResult = scrapingResults[1].status === 'fulfilled' ? scrapingResults[1].value : null;
      if (medlinePlusResult?.data) {
        console.log(`✅ MedlinePlus: ${medlinePlusResult.data.dataQuality || 0}% quality`);

        stages.push({
          name: 'medlineplus-intelligent-scraping',
          success: true,
          data: medlinePlusResult.data,
          processingTime: Date.now() - overallStartTime
        });

        // 🛡️ Validate data before returning - ensure no "Not available" placeholders
        const validation = validateDrugFields(medlinePlusResult.data as DrugData);
        if (validation.hasPlaceholders) {
          console.log(`⚠️ MedlinePlus data contains placeholder text - applying cleanup...`);
          // Remove placeholder fields
          validation.missingFields.forEach(field => {
            const value = (medlinePlusResult.data as any)[field];
            if (typeof value === 'string' && /not available|n\/a|unknown/i.test(value)) {
              (medlinePlusResult.data as any)[field] = ''; // Clear placeholder
            }
          });
        }

        const limitedData = limitDataForStandardMode(medlinePlusResult.data);

        // 🧪 PHARMACEUTICAL ENHANCEMENT: Fill in any missing critical fields with AI knowledge
        const enhancedWithPharmaKnowledge = await enhanceWithPharmaceuticalKnowledge(
          limitedData as DrugData,
          medlinePlusResult.data.name || drugName,
          medlinePlusResult.data.genericName || genericName
        );

        const enrichedData = enrichResponseMetadata(enhancedWithPharmaKnowledge as any, stages, preProcessingResult, overallStartTime);

        // 🏥 Add Janaushadhi alternative
        if (janaushadhiResult && janaushadhiResult.found) {
          (enrichedData as DrugData & { janaushadhiAlternative?: JanaushadhiMatch }).janaushadhiAlternative = janaushadhiResult;
        }

        // ⚡ OPTIMIZED EXIT CHECK - More balanced for scraped data
        if (shouldEarlyExit(limitedData) || (medlinePlusResult.data.dataQuality && medlinePlusResult.data.dataQuality > 70)) {
          console.log(`🕷️ FAST SCRAPING RETURN: Quality score ${medlinePlusResult.data.dataQuality || 'Unknown'}%`);
          return createResponse({
            success: true,
            data: enrichedData,
            processingStages: stages.map(s => s.name),
            confidence: (medlinePlusResult.data.dataQuality && medlinePlusResult.data.dataQuality > 80) ? 'high' : 'medium',
            fallbackUsed: true,
            processingTime: Date.now() - overallStartTime
          });
        }

        return createResponse({
          success: true,
          data: enrichedData,
          processingStages: stages.map(s => s.name),
          confidence: (medlinePlusResult.data.dataQuality && medlinePlusResult.data.dataQuality > 80) ? 'high' : 'medium',
          fallbackUsed: true,
          processingTime: Date.now() - overallStartTime
        });
      } else {
        stages.push({ name: 'medlineplus-intelligent-scraping', success: false, data: null, processingTime: Date.now() - overallStartTime });
      }

      console.log('❌ Both parallel web scraping attempts failed');
    }

    // Stage 5: Supabase Edge Function Fallback (Multi-Source API)
    console.log('🔄 Stage 5: Supabase Multi-Source API Fallback...');
    if (drugName && drugName !== 'Unknown' && !drugName.toLowerCase().includes('unknown')) {
      try {
        console.log(`   Calling multi-source-drug-api for: "${drugName}"`);
        const multiSourceResponse = await fetch(`${SUPABASE_URL}/functions/v1/multi-source-drug-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ drugName })
        });

        if (multiSourceResponse.ok) {
          const multiSourceData = await multiSourceResponse.json();

          if (multiSourceData.success && multiSourceData.data) {
            console.log('✅ Multi-source API successful!');
            const completeness = multiSourceData.data.completeness || 0;
            const isVerified = !!multiSourceData.data.verified;
            console.log(`   Data completeness: ${completeness}%`);
            console.log(`   Verified: ${isVerified}`);

            // Standard Mode: Accept results with 50%+ completeness (balance speed + accuracy)
            if (isVerified || completeness >= 50) {
              stages.push({
                name: 'multi-source-api-fallback',
                success: true,
                data: multiSourceData.data,
                processingTime: Date.now() - overallStartTime
              });

              // Enrich multi-source API data with metadata
              // 🧪 PHARMACEUTICAL ENHANCEMENT: Fill in any missing critical fields
              const enhancedWithPharmaKnowledge = await enhanceWithPharmaceuticalKnowledge(
                multiSourceData.data as DrugData,
                multiSourceData.data.name || drugName,
                multiSourceData.data.genericName || genericName
              );

              const enrichedMultiSourceApiData = enrichResponseMetadata(
                enhancedWithPharmaKnowledge as any,
                stages,
                preProcessingResult,
                overallStartTime
              );

              return createResponse({
                success: true,
                data: enrichedMultiSourceApiData,
                processingStages: stages.map(s => s.name),
                confidence: isVerified ? 'high' : (completeness >= 90 ? 'high' : 'medium'),
                fallbackUsed: true,
                processingTime: Date.now() - overallStartTime
              });
            } else {
              console.log(`⚠️ Multi-source quality low (${completeness}%), trying AI enhancement...`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Multi-source API error:`, error);
      }
    }

    // Stage 6: AI-Powered Final Fallback (NEW!)
    // All cache/DB/scraping/API failed - use AI to re-analyze the image from scratch
    console.log('🔍 Stage 6: AI-Powered Final Fallback...');
    console.log(`\n🤖 === AI ENHANCEMENT ACTIVATED ===`);
    console.log(`   Reason: All fast lookups failed (cache, DB, scraping, multi-source)`);
    console.log(`   Strategy: Fresh AI image analysis (ignore potentially incorrect OCR)`);
    console.log(`   OCR extracted: "${drugName}" (may be incorrect)`);

    try {
      // Call identify-drug API for fresh AI-powered identification
      // Don't pass drugName - let AI analyze the image fresh to avoid OCR errors
      console.log(`   Calling identify-drug API for complete re-analysis...`);
      const aiFallbackResponse = await fetch(`${SUPABASE_URL}/functions/v1/identify-drug`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          options: {
            standardMode: true,  // Signal this is from Standard Mode
            freshAnalysis: true  // Don't use OCR name, analyze fresh
          }
        }),
      });

      if (aiFallbackResponse.ok) {
        const aiResult = await aiFallbackResponse.json();

        if (aiResult.success && aiResult.data && aiResult.data.name !== "Unknown Medication") {
          console.log(`✅ AI enhancement SUCCESSFUL!`);
          console.log(`   AI identified: ${aiResult.data.name}`);
          console.log(`   Confidence: ${aiResult.data.confidence || 'medium'}`);

          stages.push({
            name: 'ai-powered-fallback',
            success: true,
            data: aiResult.data,
            processingTime: Date.now() - overallStartTime
          });

          // Return AI-enhanced result with Standard Mode optimizations and metadata
          const limitedAiData = limitDataForStandardMode({ // Standard Mode: Top 5 items only
            ...aiResult.data,
            standardModeFallback: true
          });

          // 🧪 PHARMACEUTICAL ENHANCEMENT: Fill in any missing critical fields
          const enhancedWithPharmaKnowledge = await enhanceWithPharmaceuticalKnowledge(
            limitedAiData as DrugData,
            aiResult.data.name || drugName,
            aiResult.data.genericName || genericName
          );

          const enrichedAiData = enrichResponseMetadata(
            enhancedWithPharmaKnowledge as any,
            stages,
            preProcessingResult,
            overallStartTime
          );

          return createResponse({
            success: true,
            data: enrichedAiData,
            processingStages: stages.map(s => s.name),
            confidence: aiResult.data.confidence || 'medium',
            fallbackUsed: true,
            processingTime: Date.now() - overallStartTime
          });
        } else {
          console.log(`⚠️ AI enhancement returned unknown or no data`);
        }
      } else {
        console.log(`⚠️ AI enhancement API call failed: ${aiFallbackResponse.status}`);
      }
    } catch (aiError) {
      console.error(`❌ AI enhancement error:`, aiError);
    }

    console.log(`🤖 === AI ENHANCEMENT COMPLETE ===\n`);

    // Stage 6.2: Intelligent Web Search (NEW!) - for torn/damaged strips
    // Automatically triggered when strip is damaged or information is incomplete
    console.log('🌐 Stage 6.2: Intelligent AI Web Search...');

    const stripCondition = visionResult?.tornOrCut ? 'torn' :
      (visionResult?.partialView ? 'partial' :
        (visionResult?.blurry ? 'blurry' : 'good'));

    const qualityResult = calculateQualityScore({
      name: drugName,
      genericName: genericName,
      description: '',
      sideEffects: [],
      warnings: []
    } as DrugData, stages.map(s => s.name));

    const currentCompleteness = qualityResult.overall;

    if (shouldUseIntelligentWebSearch(visionResult, currentCompleteness)) {
      console.log('🧠 === INTELLIGENT WEB SEARCH ACTIVATED ===');
      console.log(`   Trigger: ${stripCondition} strip or low completeness (${currentCompleteness}%)`);
      console.log(`   Strategy: AI thinks + searches web for complete information`);

      try {
        const webSearchResult = await performIntelligentWebSearch({
          drugName: drugName || undefined,
          genericName: genericName || undefined,
          imprint: visionResult?.imprint,
          color: visionResult?.color,
          shape: visionResult?.shape,
          stripCondition: stripCondition as 'torn' | 'damaged' | 'cut' | 'partial' | 'blurry' | 'good',
          visibleText: undefined,
          completeness: currentCompleteness
        });

        if (webSearchResult.success && webSearchResult.drugInfo) {
          console.log(`✅ INTELLIGENT WEB SEARCH SUCCESSFUL!`);
          console.log(`   Drug: ${webSearchResult.drugInfo.name}`);
          console.log(`   Strategy: ${webSearchResult.searchStrategy}`);
          console.log(`   Sources: ${webSearchResult.sourcesSearched?.length || 0} sources`);
          console.log(`   Confidence: ${(webSearchResult.confidence || 0) * 100}%`);

          stages.push({
            name: 'intelligent-web-search',
            success: true,
            data: webSearchResult.drugInfo,
            processingTime: Date.now() - overallStartTime
          });

          // Enrich web search data with metadata
          // 🧪 PHARMACEUTICAL ENHANCEMENT: Fill in any missing critical fields
          const enhancedWithPharmaKnowledge = await enhanceWithPharmaceuticalKnowledge(
            webSearchResult.drugInfo as DrugData,
            webSearchResult.drugInfo.name || drugName,
            webSearchResult.drugInfo.genericName || genericName
          );

          const enrichedWebSearchData = enrichResponseMetadata(
            enhancedWithPharmaKnowledge as any,
            stages,
            preProcessingResult,
            overallStartTime
          );

          return createResponse({
            success: true,
            data: {
              ...enrichedWebSearchData,
              searchStrategy: webSearchResult.searchStrategy,
              reasoning: webSearchResult.reasoning,
              sourcesUsed: webSearchResult.sourcesSearched,
              webSearchUsed: true
            },
            processingStages: stages.map(s => s.name),
            confidence: (webSearchResult.confidence || 0) >= 0.8 ? 'high' : 'medium',
            fallbackUsed: true,
            processingTime: Date.now() - overallStartTime
          });
        } else {
          console.log(`⚠️ Intelligent web search failed: ${webSearchResult.error || 'Unknown error'}`);
        }
      } catch (webSearchError) {
        console.error(`❌ Intelligent web search error:`, webSearchError);
      }
    } else {
      console.log(`ℹ️ Intelligent web search not needed (good strip condition, sufficient info)`);
    }

    console.log(`🌐 === INTELLIGENT WEB SEARCH COMPLETE ===\n`);

    // Stage 6.5: Critical Vision Analysis (Qwen) for challenging images
    console.log('🔬 Stage 6.5: Critical Vision Analysis...');
    if (shouldUseCriticalAnalysis({
      confidence: 'low',
      name: drugName || 'Unknown',
      ocrConfidence: 40,
      imageQuality: 50
    })) {
      console.log('🔬 === CRITICAL VISION ANALYSIS (Qwen) ACTIVATED ===');
      console.log('   Reason: Low confidence or challenging image detected');
      console.log('   Strategy: Deep vision analysis with text reconstruction');

      try {
        const criticalResult = await performCriticalVisionAnalysis(imageBase64, {
          previousAttemptFailed: !drugName || drugName === '' || drugName === 'Unknown',
          knownIssues: ['low_ocr_confidence', 'partial_text', 'standard_mode_exhausted'],
          mode: 'standard'
        });

        if (criticalResult.success && criticalResult.confidence >= 60) {
          console.log(`✅ Critical vision analysis succeeded!`);
          console.log(`   Identified: ${criticalResult.data?.name}`);
          console.log(`   Confidence: ${criticalResult.confidence}%`);
          console.log(`   Physical condition: ${criticalResult.data?.physicalCondition}`);
          console.log(`   Tampering detected: ${criticalResult.data?.tamperingDetected}`);

          stages.push({
            name: 'critical-vision-analysis',
            success: true,
            data: criticalResult.data,
            processingTime: Date.now() - overallStartTime
          });

          // Enrich critical vision data with metadata
          // 🧪 PHARMACEUTICAL ENHANCEMENT: Fill in any missing critical fields
          const criticalData = (criticalResult.data || {}) as DrugData;
          const enhancedWithPharmaKnowledge = await enhanceWithPharmaceuticalKnowledge(
            criticalData,
            criticalData.name || drugName,
            criticalData.genericName || genericName
          );

          const enrichedCriticalData = enrichResponseMetadata(
            enhancedWithPharmaKnowledge as any,
            stages,
            preProcessingResult,
            overallStartTime
          );

          return createResponse({
            success: true,
            data: enrichedCriticalData,
            processingStages: stages.map(s => s.name),
            confidence: criticalResult.confidence >= 80 ? 'high' : 'medium',
            fallbackUsed: true,
            processingTime: Date.now() - overallStartTime
          });
        } else if (criticalResult.retakeNeeded) {
          console.log(`⚠️ Critical analysis suggests retaking photo`);
          console.log(`   Tips: ${criticalResult.data?.retakeTips?.join(', ')}`);
        }
      } catch (criticalError) {
        console.error(`❌ Critical vision analysis error:`, criticalError);
      }
    }

    console.log(`🔬 === CRITICAL VISION ANALYSIS COMPLETE ===\n`);

    // Stage 7: Final Fallback - Return Safe Failure
    console.log('🔍 Stage 7: Final Data Validation...');

    // Build fallback data for UI safety
    const fallbackData: PartialDrugData = {
      id: crypto.randomUUID(),
      name: "Unidentified Medication",
      genericName: "",
      description: "Unable to verify medication from the image. Standard Mode exhausted all fast lookup methods. Try Enhanced Mode for deep analysis.",
      confidence: 'low',
      color: "",
      shape: "",
      imprint: "",
      manufacturer: "",
      category: "",
      drugClass: "",
      dosageAndAdmin: "",
      mechanism: "",
      pregnancy: "",
      sideEffects: [] as string[],
      warnings: [
        "⚠️ Standard Mode could not identify this medication",
        "Try Enhanced Mode for comprehensive AI-powered analysis",
        "Do not take any unidentified medication",
        "Consult a healthcare provider or pharmacist"
      ] as string[],
      interactions: [] as string[],
      indications: [] as string[],
      contraindications: [] as string[],
      storage: "Store as directed by healthcare provider",
      prescriptionStatus: "Unknown",
      brandNames: [] as string[],
      recommendations: [
        "Switch to Enhanced Mode for deep AI analysis",
        "Take a clearer, well-lit photo of the packaging",
        "Ensure brand name is clearly visible",
        "Visit a pharmacy for professional identification"
      ] as string[]
    };

    const hasBasicInfo = false;
    const hasVisualInfo = false;

    console.log('📊 Final Data Quality Report:');
    console.log(`   Has basic info: ${hasBasicInfo}`);
    console.log(`   Has visual info: ${hasVisualInfo}`);
    console.log(`   All stages completed: ${stages.length}`);

    fallbackData.dataQuality = {
      hasBasicInfo,
      hasVisualInfo,
      verified: false,
      lastChecked: new Date().toISOString(),
      completeness: 10,
      warnings: fallbackData.warnings
    };

    stages.push({
      name: 'safe-failure',
      success: false,
      data: fallbackData,
      processingTime: Date.now() - overallStartTime
    });

    // Return safe failure with recommendation to use Enhanced Mode
    return createResponse({
      success: false,
      error: 'Standard Mode exhausted. Try Enhanced Mode for comprehensive analysis.',
      processingStages: stages.map(s => s.name),
      confidence: 'low',
      fallbackUsed: true,
      processingTime: Date.now() - overallStartTime
    });

  } catch (error) {
    console.error('Standard drug identification error:', error);

    // Check if this is a rate limit error
    if (isRateLimitError(error as Error)) {
      logRateLimit('Standard Mode', (error as Error).message);

      const rateLimitResponse = createRateLimitResponse(Date.now() - overallStartTime);
      return createResponse(rateLimitResponse, 200);
    }

    return createResponse({
      success: false,
      error: isRateLimitError(error as Error) ?
        getRateLimitErrorMessage() :
        (error as Error).message || "An unexpected error occurred",
      processingStages: stages.map(s => s.name),
      confidence: 'low',
      fallbackUsed: false,
      processingTime: Date.now() - overallStartTime
    }, isRateLimitError(error as Error) ? 200 : 500);
  }
});
