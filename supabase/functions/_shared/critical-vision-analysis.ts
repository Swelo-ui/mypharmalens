/**
 * Critical Vision Analysis using OpenRouter Qwen
 * For challenging medicine packaging images
 */

import { CRITICAL_MEDICINE_VISION_PROMPT } from './critical-vision-prompt.ts';

declare const Deno: { env: { get: (key: string) => string | undefined } };

const OPENROUTER_API_KEY = Deno?.env?.get('OPENROUTER_API_KEY') ?? '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? '';

// Use Qwen's most capable vision model for critical analysis
const QWEN_VISION_MODEL = 'qwen/qwen-2-vl-72b-instruct';

interface CriticalVisionData {
  // Core identification (matches frontend DrugCard & DrugDetails)
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  description: string;
  
  // Dosage and administration (matches frontend format)
  dosageAndAdmin: string;
  strength: string;
  dosageForm: string;
  
  // Safety arrays (matches frontend DrugDetails format)
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  indications: string[];
  contraindications: string[];
  
  // Storage and usage
  storage: string;
  mechanism: string;
  pregnancy: string;
  prescriptionStatus: string;
  
  // Physical characteristics
  imprint: string;
  color: string;
  shape: string;
  composition: string;
  activeIngredients: string[];
  drugClass: string;
  brandNames: string[];
  
  // Dates and regulatory
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  mrp: string;
  
  // Quality metrics
  imageQuality: number;
  imageChallenges: string[];
  confidence: string;
  confidenceScore: number;
  verified: boolean;
  
  // Blister pack specifics
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
  damagedSlots: number;
  slotConditionMap: string[];
  usageEstimated: string;
  physicalCondition: string;
  
  // Tampering and safety
  tamperingDetected: boolean;
  tamperingSigns: string[];
  safeToUse: boolean;
  safetyWarnings: string[];
  riskLevel: string;
  
  // OCR data
  ocrConfidence: number;
  rawOcrText: string;
  cleanedText: string;
  partialReads: Array<{ text: string; confidence: number; likely: string }>;
  inferenceUsed: boolean;
  
  // Alternatives and recommendations
  alternatives: Array<{ product_name: string; confidence: number; reasoning: string }>;
  retakeNeeded: boolean;
  retakeTips: string[];
  retakeReason: string;
  
  // Metadata
  analysisMethod: string;
  processingMode: string;
  modelUsed: string;
  detectedLanguages: string[];
  disclaimer: string;
  
  [key: string]: unknown; // Allow additional dynamic properties
}

interface CriticalVisionResult {
  success: boolean;
  data?: CriticalVisionData;
  error?: string;
  confidence: number;
  retakeNeeded: boolean;
  processingTime: number;
}

/**
 * Performs critical medicine vision analysis using Qwen
 * Handles: blurry, cut, torn, reflective, partial images
 */
export async function performCriticalVisionAnalysis(
  imageBase64: string,
  context?: {
    previousAttemptFailed?: boolean;
    knownIssues?: string[];
    mode?: 'standard' | 'enhanced';
  }
): Promise<CriticalVisionResult> {
  const startTime = Date.now();
  
  console.log('🔬 === CRITICAL VISION ANALYSIS (Qwen) ===');
  console.log(`   Mode: ${context?.mode || 'standard'}`);
  console.log(`   Previous failure: ${context?.previousAttemptFailed || false}`);
  console.log(`   Known issues: ${context?.knownIssues?.join(', ') || 'none'}`);
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OpenRouter API key missing');
    return {
      success: false,
      error: 'OpenRouter API key not configured',
      confidence: 0,
      retakeNeeded: false,
      processingTime: Date.now() - startTime
    };
  }
  
  try {
    // Build context-aware prompt
    let contextualPrompt = CRITICAL_MEDICINE_VISION_PROMPT;
    
    if (context?.previousAttemptFailed) {
      contextualPrompt += `\n\n⚠️ IMPORTANT: Previous identification attempt failed. This image may be extremely challenging. Use maximum inference and reconstruction capabilities.`;
    }
    
    if (context?.knownIssues && context.knownIssues.length > 0) {
      contextualPrompt += `\n\n📋 Known Image Issues: ${context.knownIssues.join(', ')}\nFocus analysis on working around these specific challenges.`;
    }
    
    console.log('📤 Sending to Qwen Vision API...');
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SUPABASE_URL,
        'X-Title': 'PharmaLens Critical Vision Analysis'
      },
      body: JSON.stringify({
        model: QWEN_VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: contextualPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.2, // Low temperature for analytical precision
        max_tokens: 4000,  // Large token limit for comprehensive JSON output
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Qwen response');
    }
    
    // Parse JSON response
    let analysisData;
    try {
      analysisData = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Qwen JSON response');
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    // Extract key metrics
    const confidence = analysisData.confidence_analysis?.overall_confidence || 0;
    const retakeNeeded = analysisData.confidence_analysis?.retake_needed || confidence < 50;
    
    console.log('✅ Critical vision analysis complete');
    console.log(`   Overall confidence: ${confidence}%`);
    console.log(`   Identified: ${analysisData.ocr_extraction?.product_name || 'Unknown'}`);
    console.log(`   Category: ${analysisData.classification?.primary_category || 'unknown'}`);
    console.log(`   Condition: ${analysisData.physical_condition?.condition_status || 'unclear'}`);
    console.log(`   Tampering detected: ${analysisData.physical_condition?.tampering_detected || false}`);
    console.log(`   Retake needed: ${retakeNeeded}`);
    console.log(`   Processing time: ${processingTime}ms`);
    
    // Transform to PharmaLens format
    const pharmaLensData = transformQwenToPharmaLensFormat(analysisData);
    
    return {
      success: true,
      data: pharmaLensData,
      confidence,
      retakeNeeded,
      processingTime
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Critical vision analysis failed after ${processingTime}ms:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      confidence: 0,
      retakeNeeded: true,
      processingTime
    };
  }
}

interface QwenAnalysisData {
  ocr_extraction?: {
    product_name?: string;
    generic_name?: string;
    manufacturer_name?: string;
    strength?: string;
    dosage_form?: string;
    batch_number?: string;
    composition_full?: string;
    mfg_date?: string;
    exp_date?: string;
    mrp?: string;
    storage_instructions?: string;
    warnings?: string;
    ocr_confidence?: number;
    raw_ocr_text?: string;
    cleaned_text?: string;
    partial_reads?: Array<{ text: string; confidence: number; likely: string }>;
    inference_used?: boolean;
    detected_languages?: string[];
  };
  regions_detected?: {
    packaging_type?: string;
    total_capsule_slots?: number;
    filled_slots?: number;
    empty_slots?: number;
    damaged_slots?: number;
    slot_map?: string[];
  };
  classification?: {
    primary_category?: string;
    therapeutic_class?: string;
    active_ingredients?: string[];
    probable_indications?: string[];
  };
  physical_condition?: {
    condition_status?: string;
    usage_estimated?: string;
    tampering_detected?: boolean;
    tampering_signs?: string[];
  };
  image_quality?: {
    readability_score?: number;
    image_challenges?: string[];
    retake_recommendation?: string;
  };
  safety_warnings?: {
    specific_warnings?: string[];
    safe_to_use?: boolean;
    risk_level?: string;
  };
  confidence_analysis?: {
    overall_confidence?: number;
    alternative_identifications?: Array<{
      product_name: string;
      confidence: number;
      reasoning: string;
    }>;
    retake_needed?: boolean;
    retake_tips?: string[];
  };
  disclaimer?: string;
}

/**
 * Transform Qwen's detailed analysis to PharmaLens standard format
 */
function transformQwenToPharmaLensFormat(qwenData: QwenAnalysisData): CriticalVisionData {
  // Extract warnings as array
  const warningsText = qwenData.ocr_extraction?.warnings || qwenData.safety_warnings?.specific_warnings?.join('. ') || '';
  const warningsArray = qwenData.safety_warnings?.specific_warnings || 
                       (warningsText ? [warningsText] : []);
  
  // Build description from available data
  const description = qwenData.ocr_extraction?.composition_full || 
                     `${qwenData.classification?.therapeutic_class || 'Medication'} - ${qwenData.classification?.primary_category || 'Unknown category'}`;
  
  return {
    // Core identification (matches frontend format)
    id: crypto.randomUUID(),
    name: qwenData.ocr_extraction?.product_name || 'Unknown Medication',
    genericName: qwenData.ocr_extraction?.generic_name || '',
    manufacturer: qwenData.ocr_extraction?.manufacturer_name || '',
    category: qwenData.classification?.primary_category || 'unknown',
    description: description,
    
    // Dosage and administration (matches frontend format)
    dosageAndAdmin: `${qwenData.ocr_extraction?.strength || ''} ${qwenData.ocr_extraction?.dosage_form || ''}`.trim() || 
                   'Consult physician for dosage',
    strength: qwenData.ocr_extraction?.strength || '',
    dosageForm: qwenData.ocr_extraction?.dosage_form || '',
    
    // Safety arrays (matches frontend DrugDetails format)
    sideEffects: [], // Qwen doesn't provide this, will be empty
    warnings: warningsArray,
    interactions: [], // Qwen doesn't provide this, will be empty
    indications: qwenData.classification?.probable_indications || [],
    contraindications: [], // Qwen doesn't provide this, will be empty
    
    // Storage and usage
    storage: qwenData.ocr_extraction?.storage_instructions || '',
    mechanism: '', // Not provided by Qwen
    pregnancy: '', // Not provided by Qwen
    prescriptionStatus: '', // Not provided by Qwen
    
    // Physical characteristics
    imprint: qwenData.ocr_extraction?.batch_number || '',
    color: extractColorFromAnalysis(qwenData),
    shape: qwenData.regions_detected?.packaging_type || '',
    composition: qwenData.ocr_extraction?.composition_full || '',
    activeIngredients: qwenData.classification?.active_ingredients || [],
    drugClass: qwenData.classification?.therapeutic_class || '',
    brandNames: [], // Not provided by Qwen
    
    // Dates and regulatory
    batchNumber: qwenData.ocr_extraction?.batch_number || '',
    mfgDate: qwenData.ocr_extraction?.mfg_date || '',
    expDate: qwenData.ocr_extraction?.exp_date || '',
    mrp: qwenData.ocr_extraction?.mrp || '',
    
    // Quality metrics
    confidence: (qwenData.confidence_analysis?.overall_confidence ?? 0) >= 80 ? 'high' : 
                (qwenData.confidence_analysis?.overall_confidence ?? 0) >= 50 ? 'medium' : 'low',
    confidenceScore: qwenData.confidence_analysis?.overall_confidence ?? 0,
    verified: (qwenData.confidence_analysis?.overall_confidence ?? 0) >= 70,
    
    // Quality and condition
    imageQuality: qwenData.image_quality?.readability_score || 0,
    imageChallenges: qwenData.image_quality?.image_challenges || [],
    physicalCondition: qwenData.physical_condition?.condition_status || 'unknown',
    tamperingDetected: qwenData.physical_condition?.tampering_detected || false,
    tamperingSigns: qwenData.physical_condition?.tampering_signs || [],
    safeToUse: qwenData.safety_warnings?.safe_to_use || false,
    
    // Blister pack specifics
    totalSlots: qwenData.regions_detected?.total_capsule_slots || 0,
    filledSlots: qwenData.regions_detected?.filled_slots || 0,
    emptySlots: qwenData.regions_detected?.empty_slots || 0,
    damagedSlots: qwenData.regions_detected?.damaged_slots || 0,
    slotConditionMap: qwenData.regions_detected?.slot_map || [],
    usageEstimated: qwenData.physical_condition?.usage_estimated || '0%',
    
    // Alternatives
    alternatives: qwenData.confidence_analysis?.alternative_identifications || [],
    
    // OCR data
    ocrConfidence: qwenData.ocr_extraction?.ocr_confidence || 0,
    rawOcrText: qwenData.ocr_extraction?.raw_ocr_text || '',
    cleanedText: qwenData.ocr_extraction?.cleaned_text || '',
    partialReads: qwenData.ocr_extraction?.partial_reads || [],
    inferenceUsed: qwenData.ocr_extraction?.inference_used || false,
    
    // Safety
    safetyWarnings: qwenData.safety_warnings?.specific_warnings || [],
    riskLevel: qwenData.safety_warnings?.risk_level || 'unknown',
    disclaimer: qwenData.disclaimer || '',
    
    // Retake recommendation
    retakeNeeded: qwenData.confidence_analysis?.retake_needed || false,
    retakeTips: qwenData.confidence_analysis?.retake_tips || [],
    retakeReason: qwenData.image_quality?.retake_recommendation || '',
    
    // Metadata
    analysisMethod: 'critical-vision-qwen',
    processingMode: 'advanced',
    modelUsed: QWEN_VISION_MODEL,
    detectedLanguages: qwenData.ocr_extraction?.detected_languages || ['English'],
    
    // Full Qwen response for debugging
    _qwenRawData: qwenData
  };
}

/**
 * Extract color information from analysis
 */
function extractColorFromAnalysis(qwenData: QwenAnalysisData): string {
  // Try to extract color from various fields
  const text = qwenData.ocr_extraction?.cleaned_text || '';
  const colors = ['red', 'blue', 'green', 'yellow', 'white', 'orange', 'pink', 'purple', 'brown', 'black'];
  
  for (const color of colors) {
    if (text.toLowerCase().includes(color)) {
      return color;
    }
  }
  
  return '';
}

interface PreviousResult {
  confidence?: string;
  name?: string;
  imageQuality?: number;
  ocrConfidence?: number;
  blurry?: boolean;
  imprint?: string;
  error?: string;
}

/**
 * Check if critical analysis is recommended based on previous results
 */
export function shouldUseCriticalAnalysis(previousResult?: PreviousResult): boolean {
  if (!previousResult) return true; // Always use for first attempt
  
  const triggers = [
    previousResult.confidence === 'low',
    previousResult.name === 'Unknown Medication',
    (previousResult.imageQuality ?? 100) < 50,
    (previousResult.ocrConfidence ?? 100) < 60,
    previousResult.blurry === true,
    previousResult.imprint === '' && previousResult.name !== '',
    previousResult.error !== undefined
  ];
  
  return triggers.some(trigger => trigger === true);
}
