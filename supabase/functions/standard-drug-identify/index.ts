import { checkDrugCache as checkCache } from './cache-integration.ts';
import { aiCompareDrugNames } from './ai-validator.ts';
import { performCriticalVisionAnalysis, shouldUseCriticalAnalysis } from '../_shared/critical-vision-analysis.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenRouter configuration for fallback
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_VISION_MODEL_PRIMARY = 'qwen/qwen2.5-vl-32b-instruct:free';
const OPENROUTER_VISION_MODEL_SECONDARY = 'nvidia/nemotron-nano-12b-v2-vl:free';

// OCR Cross-Validation: Compare Gemini and OpenRouter results for accuracy
async function crossValidateOCR(imageBase64: string, geminiResult: VisionResult | null): Promise<VisionResult | null> {
  console.log('\n🔍 === OCR CROSS-VALIDATION ===');
  console.log('   Strategy: Verify Gemini OCR with OpenRouter to reduce errors');
  
  if (!geminiResult || !geminiResult.name || geminiResult.name === 'Unknown') {
    console.log('   ⚠️ Gemini result invalid, skipping validation');
    return geminiResult;
  }
  
  try {
    // Get OpenRouter's opinion on the same image
    console.log('   Calling OpenRouter for cross-validation...');
    const openRouterResult = await performOpenRouterAnalysis(imageBase64);
    
    if (!openRouterResult || !openRouterResult.name || openRouterResult.name === 'Unknown') {
      console.log('   ⚠️ OpenRouter validation failed, trusting Gemini');
      return geminiResult;
    }
    
    // Compare the two results
    const geminiName = geminiResult.name.toLowerCase().trim();
    const openRouterName = openRouterResult.name.toLowerCase().trim();
    
    // Calculate similarity (simple substring check)
    const isMatch = geminiName.includes(openRouterName) || 
                    openRouterName.includes(geminiName) ||
                    geminiName === openRouterName;
    
    if (isMatch) {
      console.log(`   ✅ VALIDATED: Both APIs agree`);
      console.log(`      Gemini: "${geminiResult.name}"`);
      console.log(`      OpenRouter: "${openRouterResult.name}"`);
      return geminiResult; // Use Gemini result (it's usually more accurate)
    } else {
      console.log(`   ⚠️ MISMATCH DETECTED:`);
      console.log(`      Gemini: "${geminiResult.name}"`);
      console.log(`      OpenRouter: "${openRouterResult.name}"`);
      console.log(`   → Using OpenRouter result (disagreement detected)`);
      return openRouterResult; // Prefer OpenRouter when they disagree
    }
  } catch (error) {
    console.error('   ❌ Cross-validation error:', error);
    return geminiResult; // Fallback to Gemini on error
  } finally {
    console.log('🔍 === OCR CROSS-VALIDATION COMPLETE ===\n');
  }
}

// Standard Mode data limiter - keep only essential info (4-5 items max per section)
// Only for scraping/backup sources - NOT for cache/local DB (they're already validated)
// deno-lint-ignore no-explicit-any
function limitDataForStandardMode(data: any): any {
  if (!data) return data;
  
  const MAX_ITEMS = 5; // Standard Mode: Top 5 items only (for scraping/backup)
  
  return {
    ...data,
    // Limit array fields to top 5 most important items
    sideEffects: Array.isArray(data.sideEffects) ? data.sideEffects.slice(0, MAX_ITEMS) : [],
    warnings: Array.isArray(data.warnings) ? data.warnings.slice(0, MAX_ITEMS) : [],
    interactions: Array.isArray(data.interactions) ? data.interactions.slice(0, MAX_ITEMS) : [],
    indications: Array.isArray(data.indications) ? data.indications.slice(0, MAX_ITEMS) : [],
    contraindications: Array.isArray(data.contraindications) ? data.contraindications.slice(0, MAX_ITEMS) : [],
    brandNames: Array.isArray(data.brandNames) ? data.brandNames.slice(0, MAX_ITEMS) : [],
    // Keep scalar fields unchanged
    standardModeOptimized: true,
    note: (data.note || '') + ' [Standard Mode: Top 5 items for quick reference]'
  };
}

// Typed shapes used across OCR and fallback flows
type Confidence = 'high' | 'medium' | 'low';

interface VisionResult {
  name?: string;
  genericName?: string;
  description?: string;
  confidence?: Confidence;
  color?: string;
  shape?: string;
  imprint?: string;
  ocrSource?: string;
  fullText?: string;
  fallbackUsed?: string;
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

// Import functions from enhanced-drug-identify for reuse
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

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

async function checkDrugCache(drugName: string): Promise<unknown> {
  try {
    return await checkCache(drugName);
  } catch (error) {
    console.error('Cache check error:', error);
  }
  return null;
}

async function try1mgScraping(drugName: string): Promise<unknown> {
  try {
    console.log(`🔍 Scraping 1mg.com for: ${drugName}`);
    
    const searchUrl = `https://www.1mg.com/search/all?name=${encodeURIComponent(drugName)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ 1mg.com search failed: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Extract drug information from HTML
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const descMatch = html.match(/<div class="saltInfo">([^<]+)<\/div>/);
    
    if (nameMatch || descMatch) {
      return {
        name: nameMatch?.[1]?.trim() || drugName,
        genericName: descMatch?.[1]?.trim() || '',
        description: `Information from 1mg.com for ${drugName}`,
        source: '1mg.com'
      };
    }
    
    console.log('❌ No data extracted from 1mg.com');
    return null;
  } catch (error) {
    console.error(`Error scraping 1mg.com: ${error}`);
    return null;
  }
}

async function tryDrugsComScraping(drugName: string): Promise<unknown> {
  try {
    console.log(`🔍 Scraping drugs.com for: ${drugName}`);
    
    const formattedDrugName = drugName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.drugs.com/${formattedDrugName}.html`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      const searchUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(drugName)}`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!searchResponse.ok) return null;
      
      const searchHtml = await searchResponse.text();
      const firstResultMatch = searchHtml.match(/<a href="(\/[^"]+)" class="ddc-link-[^"]+">/);
      
      if (firstResultMatch?.[1]) {
        const resultUrl = `https://www.drugs.com${firstResultMatch[1]}`;
        const detailResponse = await fetch(resultUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (detailResponse.ok) {
          return parseDrugsComHTML(await detailResponse.text(), drugName);
        }
      }
      return null;
    }
    
    const html = await response.text();
    return parseDrugsComHTML(html, drugName);
  } catch (error) {
    console.error(`Error scraping drugs.com: ${error}`);
    return null;
  }
}

function parseDrugsComHTML(html: string, drugName: string): unknown {
  try {
    const drugInfo = {
      id: crypto.randomUUID(),
      name: drugName,
      genericName: "",
      brandNames: [] as string[],
      manufacturer: "",
      category: "",
      description: "",
      dosageAndAdmin: "",
      sideEffects: [] as string[],
      warnings: [] as string[],
      interactions: [] as string[],
      storage: "Store at room temperature away from moisture, heat, and light. Keep out of reach of children.",
      mechanism: "",
      indications: [] as string[],
      contraindications: [] as string[],
      prescriptionStatus: "Unknown",
      pregnancy: "",
      drugClass: "",
      color: "",
      shape: "",
      imprint: ""
    };
    
    // Extract generic name
    const genericNameMatch = html.match(/<p class="drug-subtitle">(.*?)<\/p>/s);
    if (genericNameMatch?.[1]) {
      drugInfo.genericName = genericNameMatch[1].trim();
    }
    
    // Extract description
    const descriptionMatch = html.match(/<div class="contentBox">[\s\S]*?<p>([\s\S]*?)<\/p>/);
    if (descriptionMatch?.[1]) {
      drugInfo.description = descriptionMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Extract side effects
    const sideEffectsMatch = html.match(/<h2[^>]*>Side Effects<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
    if (sideEffectsMatch?.[1]) {
      const sideEffects = sideEffectsMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/g);
      if (sideEffects) {
        drugInfo.sideEffects = sideEffects.map((item: string) => {
          return item
            .replace(/<li[^>]*>/, '')
            .replace(/<\/li>/, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        });
      }
    }
    
    // Extract drug class
    const drugClassMatch = html.match(/<strong>Drug class:<\/strong>\s*([^<]+)(?:<|$)/i);
    if (drugClassMatch?.[1]) {
      drugInfo.drugClass = drugClassMatch[1].trim();
    }
    
    // Extract indications
    const indicationsMatch = html.match(/<h2[^>]*>Uses<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    if (indicationsMatch?.[1]) {
      const indicationsText = indicationsMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      drugInfo.indications = indicationsText.split(/\.\s+/).filter((item: string) => item.length > 5)
        .map((item: string) => item.trim() + (item.endsWith('.') ? '' : '.'));
    }
    
    console.log(`Successfully parsed drugs.com data for: ${drugName}`);
    return drugInfo;
  } catch (error) {
    console.error(`Error parsing drugs.com HTML: ${error}`);
    return null;
  }
}

// OpenRouter OCR removed - using performOpenRouterAnalysis() instead for unified vision fallback

// OpenRouter Vision fallback (dual model support)
async function performOpenRouterAnalysis(imageBase64: string, useSecondary: boolean = false): Promise<VisionResult | null> {
  const modelToUse = useSecondary ? OPENROUTER_VISION_MODEL_SECONDARY : OPENROUTER_VISION_MODEL_PRIMARY;
  const modelName = useSecondary ? 'Nvidia Nemotron' : 'Qwen 2.5-VL';
  
  try {
    console.log(`🔄 Using OpenRouter Vision (${modelName}) as fallback...`);
    
    const prompt = `You are a fast pharmaceutical drug identifier. Extract key info from this medicine image.

CRITICAL: Also detect if the image has challenging conditions that need advanced analysis.

INSTRUCTIONS (Speed-optimized):
1. Brand Name: Exact name on package (e.g., "Naxdom 500")
2. Generic/Active Ingredient: From composition section
3. Confidence: high/medium/low based on text clarity
4. **Image Challenges**: Detect if image has:
   - "torn" or "cut" - Strip/blister is torn, cut, or damaged
   - "blurry" - Text is unclear or out of focus
   - "reflective" - Foil or packaging has glare/reflection
   - "partial" - Only partial view of medicine/packaging
   - "damaged" - Packaging is physically damaged
5. **needsCriticalAnalysis**: Set to true if ANY of above challenges exist OR confidence is low

OUTPUT (JSON only):
{
  "name": "Brand name",
  "genericName": "Active ingredient",
  "confidence": "high/medium/low",
  "imageChallenges": ["torn", "blurry", etc.],
  "needsCriticalAnalysis": true/false,
  "imageQuality": 0-100,
  "tornOrCut": true/false,
  "blurry": true/false,
  "reflective": true/false,
  "partialView": true/false
}

Be FAST and ACCURATE. Detect challenging conditions. Return ONLY JSON:`;

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
        max_tokens: 512 // Standard Mode: Fast response
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
    
    // If primary model failed, try secondary
    if (!useSecondary && OPENROUTER_API_KEY) {
      console.log('🔄 Primary OpenRouter model failed, trying Nvidia Nemotron...');
      return await performOpenRouterAnalysis(imageBase64, true);
    }
    
    return null;
  }
}

async function performGeminiAnalysis(imageBase64: string): Promise<VisionResult | null> {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found!');
      // Try OpenRouter as immediate fallback
      if (OPENROUTER_API_KEY) {
        console.log('🔄 Gemini key missing, trying OpenRouter...');
        return await performOpenRouterAnalysis(imageBase64);
      }
      return null;
    }
    
    console.log('🤖 Calling Gemini API for OCR...');
    console.log(`   API Key present: ${!!apiKey}`);
    console.log(`   Image data length: ${imageBase64.length} chars`);
    
    const prompt = `STANDARD MODE: Fast drug OCR. Extract essential info ONLY.

CRITICAL: Also detect if the image has challenging conditions that need advanced analysis.

RULES:
1. Brand name: Exact text from package (e.g., "Naxdom 500")
2. Generic: Active ingredient from composition
3. NO guessing - return "Unknown" if unclear
4. **Image Challenges**: Detect if image has:
   - "torn" or "cut" - Strip/blister is torn, cut, or damaged
   - "blurry" - Text is unclear or out of focus
   - "reflective" - Foil or packaging has glare/reflection
   - "partial" - Only partial view of medicine/packaging
   - "damaged" - Packaging is physically damaged
5. **needsCriticalAnalysis**: Set to true if ANY of above challenges exist OR confidence is low

OUTPUT (JSON):
{
  "name": "Brand name",
  "genericName": "Active ingredient",
  "confidence": "high/medium/low",
  "imageChallenges": ["torn", "blurry", etc.],
  "needsCriticalAnalysis": true/false,
  "imageQuality": 0-100,
  "tornOrCut": true/false,
  "blurry": true/false,
  "reflective": true/false,
  "partialView": true/false
}

Be FAST. Detect challenging conditions. Return JSON only:`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64
            }}
          ]
        }],
        generation_config: { temperature: 0.1, max_output_tokens: 500 } // Standard Mode: Fast response
      })
    });
    
    console.log(`   Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Gemini response received`);
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`   Raw Gemini text (first 200 chars): ${text.substring(0, 200)}`);
        
        // Try to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log(`✅ Gemini OCR Success:`);
            console.log(`   Name: "${parsed.name}"`);
            console.log(`   Generic: "${parsed.genericName}"`);
            console.log(`   Confidence: ${parsed.confidence}`);
            return parsed;
          } catch (parseError) {
            console.error(`❌ JSON parse error: ${parseError}`);
            console.error(`   Attempted to parse: ${jsonMatch[0].substring(0, 100)}...`);
          }
        } else {
          console.error(`❌ No JSON found in Gemini response`);
          console.error(`   Full response: ${text}`);
        }
      } else {
        console.error(`❌ No text in Gemini response`);
        console.error(`   Response structure:`, JSON.stringify(data, null, 2).substring(0, 500));
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Gemini API error: ${response.status}`);
      console.error(`   Error: ${errorText.substring(0, 200)}`);
      
      // Check if quota exhausted - use OpenRouter fallback
      if (response.status === 429 && (errorText.includes('quota') || errorText.includes('exceeded')) && OPENROUTER_API_KEY) {
        console.warn('⚠️ Gemini quota exhausted, falling back to OpenRouter...');
        return await performOpenRouterAnalysis(imageBase64);
      }
    }
  } catch (error) {
    console.error('❌ Gemini analysis exception:', error);
    console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Try OpenRouter as final fallback before giving up
  if (OPENROUTER_API_KEY) {
    console.log('🔄 Gemini OCR failed - attempting OpenRouter fallback...');
    return await performOpenRouterAnalysis(imageBase64);
  }
  
  console.log('⚠️ All vision APIs failed - returning null');
  return null;
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
    console.log(`🔍 STANDARD MODE DRUG IDENTIFICATION`);
    console.log('='.repeat(80));
    console.log('🔍 Fast search using local database, cache, and fallback mechanisms');
    console.log('='.repeat(80));

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

    // Stage 1: Gemini OCR + Text Extraction
    console.log('🔍 Stage 1: Gemini OCR + Text Extraction...');
    const geminiResult = await performGeminiAnalysis(imageBase64);
    stages.push({
      name: 'gemini-ocr',
      success: !!geminiResult,
      data: geminiResult,
      processingTime: Date.now() - overallStartTime
    });

    // Stage 1.2: OCR Cross-Validation (NEW!) - Reduce errors by validating with OpenRouter
    const validatedResult = await crossValidateOCR(imageBase64, geminiResult);
    if (validatedResult && validatedResult !== geminiResult) {
      stages.push({
        name: 'ocr-cross-validation',
        success: true,
        data: { message: 'OCR validated and corrected', validated: validatedResult },
        processingTime: Date.now() - overallStartTime
      });
    }

    let drugName = validatedResult?.name || 'Unknown';
    let genericName = validatedResult?.genericName || '';
    console.log(`📝 Validated - Brand: "${drugName}", Generic: "${genericName}"`);

    // 🔍 DEBUG: Log ALL challenge detection fields
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
          
          // Return immediately with critical vision results
          const result: DrugIdentificationResult = {
            success: true,
            data: {
              ...criticalStage.data,
              criticalAnalysisUsed: true,
              challengingImageHandled: true
            },
            processingStages: stages.map(s => s.name),
            confidence: criticalStage.confidence >= 80 ? 'high' : 'medium',
            fallbackUsed: true,
            processingTime: Date.now() - overallStartTime
          };
          
          console.log(`\n✅ Critical Vision Analysis handled challenging image successfully!`);
          console.log(`=`.repeat(80));
          return createResponse(result);
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

              return createResponse({
                success: true,
                data: multiSourceData.data,
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

    // Stage 2: Cache Check with Name Variations (Fastest - check first!)
    console.log('🔍 Stage 2: Enhanced Cache Check with Name Variations...');
    if ((drugName && !drugName.toLowerCase().includes('unknown')) || (genericName && !genericName.toLowerCase().includes('unknown'))) {
      // Build candidates from brand and (if available) generic
      const candidates = new Set<string>();
      const addVariations = (base: string) => {
        if (!base) return;
        candidates.add(base);
        candidates.add(`${base} Syrup`);
        candidates.add(`${base} Tablet`);
        candidates.add(`${base} Capsule`);
        candidates.add(base.replace(/\s+(Syrup|Tablet|Capsule|Drops|Injection)$/i, ''));
      };
      addVariations(drugName);
      if (genericName && !genericName.toLowerCase().includes('unknown')) {
        addVariations(genericName);
      }

      const uniqueVariations = [...candidates].filter(v => v && v.trim().length > 1);
      console.log(`   Trying ${uniqueVariations.length} brand/generic variations:`);
      uniqueVariations.forEach((v, i) => console.log(`      ${i + 1}. "${v}"`));

      for (const variation of uniqueVariations) {
        console.log(`   Checking cache for: "${variation}"`);
        const cachedResult = await checkDrugCache(variation);
        if (cachedResult) {
          console.log(`✅ Cache HIT with variation: "${variation}"!`);
          stages.push({
            name: 'cache-search',
            success: true,
            data: cachedResult,
            processingTime: Date.now() - overallStartTime
          });

          return createResponse({
            success: true,
            data: cachedResult, // Cache hit: Return full validated data
            processingStages: stages.map(s => s.name),
            confidence: 'high',
            fallbackUsed: false,
            processingTime: Date.now() - overallStartTime
          });
        }
      }
      console.log('❌ Cache miss for all brand/generic variations');
    }

    // Stage 3: Smart Local Database Search (Brand + Generic + Variations)
    console.log('🔍 Stage 3: Smart Local Database Search...');
    console.log(`   Available data - Brand: "${drugName}", Generic: "${genericName}"`);
    
    // Build intelligent search queries
    const searchQueries: string[] = [];
    
    // 1. Try brand name
    if (drugName && drugName !== 'Unknown' && !drugName.toLowerCase().includes('unknown')) {
      searchQueries.push(drugName);
      
      // Brand name variations
      searchQueries.push(drugName.replace(/[-\s]/g, '')); // "Paragreen-650" → "Paragreen650"
      searchQueries.push(drugName.replace(/[0-9]+/g, '').trim()); // "Paragreen-650" → "Paragreen"
      searchQueries.push(drugName.replace(/[\s-]+/g, ' ').trim()); // Normalize spaces
    }
    
    // 2. Try generic name
    if (genericName && genericName !== 'Unknown' && !genericName.toLowerCase().includes('unknown')) {
      searchQueries.push(genericName);
      
      // Generic name variations
      searchQueries.push(genericName.replace(/[-\s]/g, '')); // Handle spacing
      
      // Try first word of generic if it's multi-word (e.g., "Paracetamol and Caffeine" → "Paracetamol")
      const firstWord = genericName.split(/\s+/)[0];
      if (firstWord && firstWord.length > 3) {
        searchQueries.push(firstWord);
      }
    }
    
    // Remove duplicates and empty strings
    const uniqueQueries = [...new Set(searchQueries)].filter(q => q && q.length > 2);
    
    console.log(`   📋 Generated ${uniqueQueries.length} smart search queries:`);
    uniqueQueries.forEach((q, i) => console.log(`      ${i + 1}. "${q}"`));
    
    // Try each query with decreasing threshold for fuzzy matching
    const thresholds = [0.85, 0.75, 0.65]; // High precision → Medium → More lenient
    
    for (const threshold of thresholds) {
      console.log(`\n   🔍 Trying threshold: ${threshold * 100}%`);
      
      for (const query of uniqueQueries) {
        console.log(`      Searching: "${query}" at ${threshold * 100}% similarity`);
        const localResult = await checkLocalDatabase(query, threshold);
        
        if (localResult) {
          console.log(`      🎯 POTENTIAL MATCH FOUND with "${query}" at ${threshold * 100}% threshold!`);
          const matchedDrugName = (localResult as { name?: string; genericName?: string } | null)?.name || '';
          const matchedGenericName = (localResult as { name?: string; genericName?: string } | null)?.genericName;
          console.log(`      Database match: "${matchedDrugName}" (Generic: "${matchedGenericName || 'N/A'}")`);
          
          // CRITICAL: Use AI to validate if this is truly the SAME drug (especially for lower thresholds)
          if (threshold < 0.85) {
            console.log(`\n      🔐 AI VALIDATION REQUIRED (fuzzy match at ${threshold * 100}%)`);
            const aiValidation = await aiCompareDrugNames(
              drugName,
              genericName,
              matchedDrugName,
              matchedGenericName
            );
            
            // Only accept database match if AI confirms it's the SAME drug
            if (!aiValidation.isSame) {
              console.log(`      ❌ AI REJECTED LOCAL DB MATCH!`);
              console.log(`         Reason: ${aiValidation.reasoning}`);
              console.log(`         This prevents incorrect drug information from being returned`);
              console.log(`         Continuing to next search option...\n`);
              continue; // Try next query/threshold instead of returning wrong data
            }
            
            console.log(`      ✅ AI VALIDATED LOCAL DB MATCH!`);
            console.log(`         AI Confidence: ${(aiValidation.confidence * 100).toFixed(1)}%`);
            console.log(`         Reasoning: ${aiValidation.reasoning}`);
          } else {
            console.log(`      ✅ HIGH THRESHOLD MATCH (${threshold * 100}%) - AI validation skipped`);
          }
          
          console.log(`      🎉 ✅ RETURNING VALIDATED MATCH: ${matchedDrugName}`);
          
          stages.push({
            name: 'local-database-smart-search',
            success: true,
            data: localResult,
            processingTime: Date.now() - overallStartTime
          });

          return createResponse({
            success: true,
            data: localResult, // Local DB hit: Return AI-validated data
            processingStages: stages.map(s => s.name),
            confidence: threshold >= 0.85 ? 'high' : 'medium',
            fallbackUsed: false,
            processingTime: Date.now() - overallStartTime
          });
        }
      }
      
      console.log(`   ❌ No matches at ${threshold * 100}% threshold`);
    }
    
    console.log('\n   ❌ Local database search exhausted - no matches found');
    console.log(`      Tried ${uniqueQueries.length} queries across ${thresholds.length} thresholds`);
    console.log(`      Total attempts: ${uniqueQueries.length * thresholds.length}`);

    // Stage 4: Fallback Mechanism - 1mg.com + Drugs.com Web Scraping
    console.log('🔄 Stage 4: Fallback - Web Scraping (1mg.com + Drugs.com)...');
    if (drugName && drugName !== 'Unknown') {
      const searchTerm = drugName;
      
      // Try 1mg.com first (Indian database)
      console.log(`   Trying 1mg.com for: "${searchTerm}"`);
      const oneMgResult = await try1mgScraping(searchTerm);
      
      if (oneMgResult) {
        console.log('✅ 1mg.com scraping successful!');
        stages.push({
          name: '1mg-fallback',
          success: true,
          data: oneMgResult,
          processingTime: Date.now() - overallStartTime
        });

        return createResponse({
          success: true,
          data: limitDataForStandardMode(oneMgResult), // Standard Mode: Top 5 items only
          processingStages: stages.map(s => s.name),
          confidence: 'medium',
          fallbackUsed: true,
          processingTime: Date.now() - overallStartTime
        });
      }
      
      // Try Drugs.com as backup
      console.log(`   Trying drugs.com for: "${searchTerm}"`);
      const drugsComResult = await tryDrugsComScraping(searchTerm);
      
      if (drugsComResult) {
        console.log('✅ Drugs.com scraping successful!');
        stages.push({
          name: 'drugs-com-fallback',
          success: true,
          data: drugsComResult,
          processingTime: Date.now() - overallStartTime
        });

        return createResponse({
          success: true,
          data: limitDataForStandardMode(drugsComResult), // Standard Mode: Top 5 items only
          processingStages: stages.map(s => s.name),
          confidence: 'medium',
          fallbackUsed: true,
          processingTime: Date.now() - overallStartTime
        });
      }
      
      console.log('❌ Both 1mg.com and Drugs.com scraping failed');
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

              return createResponse({
                success: true,
                data: multiSourceData.data,
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
          
          // Return AI-enhanced result with Standard Mode optimizations
          return createResponse({
            success: true,
            data: limitDataForStandardMode({ // Standard Mode: Top 5 items only
              ...aiResult.data,
              standardModeFallback: true
            }),
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
          
          return createResponse({
            success: true,
            data: criticalResult.data,
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
    
    return createResponse({
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
      processingStages: stages.map(s => s.name),
      confidence: 'low',
      fallbackUsed: false,
      processingTime: Date.now() - overallStartTime
    }, 500);
  }
});
