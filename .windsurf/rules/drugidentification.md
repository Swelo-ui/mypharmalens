---
trigger: always_on
---

/**
 * ====================================================================================
 * Deno Edge Function: Advanced Drug Identification Pipeline
 * ====================================================================================
 *
 * This function identifies pharmaceutical products from an image using a robust,
 * multi-stage pipeline. It is designed for high accuracy, resilience, and
 * comprehensive data retrieval, even with challenging or blurry images.
 *
 * Pipeline Stages:
 * 1. Text Extraction: (Optional) Extracts text from the image using a specialized service.
 * 2. Gemini Vision Analysis: Analyzes the image for visual characteristics (imprint,
 *    color, shape) and makes an initial identification, with special handling for
 *    blurry images.
 * 3. Multi-Source Enrichment: Takes the identified drug name and enriches it with
 *    comprehensive data (side effects, warnings, etc.) from a dedicated API.
 * 4. Imprint Search (Fallback): If confidence is low, performs a direct web scrape
 *    of drugs.com using the identified imprint as a fallback mechanism.
 * 5. Result Combination: Intelligently merges data from all successful stages into a
 *    single, comprehensive response object.
 *
 * Prerequisites:
 * - Deno Deploy environment.
 * - Environment variables set:
 *   - SUPABASE_URL: Your Supabase project URL.
 *   - SUPABASE_ANON_KEY: Your Supabase anonymous key.
 *   - GEMINI_API_KEY: Your Google AI Gemini API key.
 * - Deployed Supabase Edge Functions:
 *   - 'enhanced-text-extraction': A function that performs OCR on an image.
 *   - 'multi-source-drug-api': A function that aggregates drug data from multiple sources.
 *
 * ====================================================================================
 */

// @ts-expect-error - Deno std library is available in the Deno Deploy environment.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Narrow declaration for Deno env access for type safety.
declare const Deno: { env: { get: (key: string) => string | undefined } };

// --- CONFIGURATION ---
const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno?.env?.get('SUPABASE_ANON_KEY') ?? '';
const GEMINI_API_KEY = Deno?.env?.get('GEMINI_API_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- TYPE DEFINITIONS ---

// The final shape of the API response.
interface DrugIdentificationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  processingStages: string[];
  confidence: 'high' | 'medium' | 'low';
  fallbackUsed: boolean;
  processingTime: number;
}

// A standardized object for tracking the outcome of each pipeline stage.
interface ProcessingStage {
  name: string;
  success: boolean;
  data?: unknown;
  error?: string;
  processingTime: number;
  metadata?: {
    sourcesUsed?: string[];
    completeness?: number;
    searchAttempts?: string[];
    apiProcessingTime?: number;
  };
}

// Shape of the expected JSON data from the Gemini Vision analysis stage.
interface GeminiAnalysisData {
  name?: string;
  genericName?: string;
  imprint?: string;
  color?: string;
  shape?: string;
  manufacturer?: string;
  confidence?: 'high' | 'medium' | 'low';
  physicalDescription?: string;
  identificationNotes?: string;
  possibleNames?: string[];
  blurryAnalysisNotes?: string;
  productType?: 'medication' | 'supplement' | 'other';
}

// Shape of the data returned by the multi-source enrichment API.
interface MultiSourceData {
  name?: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  drugClass?: string;
  description?: string;
  dosageAndAdmin?: string;
  sideEffects?: string[];
  warnings?: string[];
  interactions?: string[];
  storage?: string;
  mechanism?: string;
  indications?: string[];
  contraindications?: string[];
  prescriptionStatus?: string;
  pregnancy?: string;
  brandNames?: string[];
  completeness?: number;
  verified?: boolean;
}

// Shape of the data extracted from the drugs.com imprint search scraper.
interface ImprintSearchData {
  name?: string;
  genericName?: string;
  manufacturer?: string;
  color?: string;
  shape?: string;
  description?: string;
  imprint?: string;
  confidence: 'high' | 'medium' | 'low';
}

// Shape of the final, combined data object sent to the client.
interface CombinedResult {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  description: string;
  dosageAndAdmin: string;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  storage: string;
  mechanism: string;
  indications: string[];
  contraindications: string[];
  prescriptionStatus: string;
  pregnancy: string;
  imprint: string;
  verified: boolean;
  drugClass: string;
  confidence: 'high' | 'medium' | 'low';
  color: string;
  shape: string;
  brandNames: string[];
  possibleNames: string[];
  processingStages: string[];
}

// Shape of the data from the text extraction stage.
interface TextExtractionData {
  extractedText?: string;
  text?: string;
  lines?: string[];
}


// --- HELPER FUNCTIONS ---

/**
 * Creates a standardized JSON response object.
 * @param data The payload to serialize.
 * @param status The HTTP status code.
 * @returns A Response object.
 */
function createResponse(data: unknown, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Generates a unique ID for a drug identification record.
 * @returns A UUID string.
 */
function generateDrugId(): string {
  return crypto.randomUUID();
}


// --- PIPELINE STAGES ---

/**
 * Stage 1: Calls an external service to perform OCR on the image.
 * @param imageBase64 The base64-encoded image string.
 * @returns A ProcessingStage object with the outcome.
 */
async function stageTextExtraction(imageBase64: string): Promise<ProcessingStage> {
  console.log('=== STAGE 1: Text Extraction ===');
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/enhanced-text-extraction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
      throw new Error(`Text extraction failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;
    
    console.log(`Text extraction completed in ${processingTime}ms. Extracted: "${result.text?.substring(0, 50)}..."`);
    
    return { name: 'text-extraction', success: true, data: result, processingTime };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Text extraction failed after ${processingTime}ms:`, error);
    return { name: 'text-extraction', success: false, processingTime, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Stage 2: Uses Gemini Vision to analyze the image and make an initial identification.
 * @param imageBase64 The base64-encoded image string.
 * @returns A ProcessingStage object with the outcome.
 */
async function stageGeminiAnalysis(imageBase64: string): Promise<ProcessingStage> {
  console.log('=== STAGE 2: Gemini Vision Analysis ===');
  const startTime = Date.now();
  
  try {
    const prompt = `You are an expert pharmaceutical analyst. Analyze this medication image with extreme attention to detail, especially for blurry or unclear images.

CRITICAL INSTRUCTIONS FOR BLURRY IMAGES:
- Even if blurry, identify ANY visible markings, partial imprints, faint numbers, or obscure logos.
- Make educated extrapolations based on visible patterns, shapes, and colors.
- If confidence is low due to image quality, provide multiple possible drug names in the 'possibleNames' array.
- Document your analytical process and assumptions in 'blurryAnalysisNotes'.

ANALYSIS REQUIREMENTS:
1.  **Imprint/Markings:** Find ANY text, numbers, logos, or symbols (even partial/faint).
2.  **Physical Characteristics:** Note color, shape, size, texture, and coating.
3.  **Manufacturer Clues:** Look for logo shapes or distinctive pill designs.

OUTPUT FORMAT (JSON only):
{
  "name": "Primary drug name (best guess)",
  "genericName": "Generic name if identifiable",
  "imprint": "Any visible text/numbers/symbols (even partial)",
  "color": "Dominant color(s)",
  "shape": "Physical shape description",
  "manufacturer": "Manufacturer if identifiable",
  "confidence": "high|medium|low",
  "physicalDescription": "Detailed physical characteristics",
  "identificationNotes": "Key identifying features and reasoning",
  "possibleNames": ["Array of possible drug names if confidence is low"],
  "blurryAnalysisNotes": "Documentation of image quality challenges and analytical assumptions made",
  "productType": "medication|supplement|other"
}

Analyze the image and respond with valid JSON only.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);

    const result = await response.json();
    const geminiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!geminiText) throw new Error('No response text from Gemini API');

    const analysisData = JSON.parse(geminiText);
    const processingTime = Date.now() - startTime;
    
    console.log(`Gemini analysis completed in ${processingTime}ms. Identified: ${analysisData.name} (${analysisData.confidence})`);
    
    return { name: 'gemini-analysis', success: true, data: analysisData, processingTime };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Gemini analysis failed after ${processingTime}ms:`, error);
    return { name: 'gemini-analysis', success: false, processingTime, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Stage 3: Enriches a known drug name with comprehensive data from a multi-source API.
 * @param drugName The name of the drug to look up.
 * @returns A ProcessingStage object with the outcome.
 */
async function stageMultiSourceEnrichment(drugName: string): Promise<ProcessingStage> {
  console.log(`=== STAGE 3: Multi-Source Enrichment for "${drugName}" ===`);
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/multi-source-drug-api`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ drugName }),
    });

    if (!response.ok) throw new Error(`Multi-source API error: ${response.status} ${response.statusText}`);

    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Multi-source enrichment failed');

    const processingTime = Date.now() - startTime;
    console.log(`Multi-source enrichment completed in ${processingTime}ms. Completeness: ${result.data.completeness || 0}%`);

    return {
      name: 'multi-source-enrichment',
      success: true,
      data: result.data,
      processingTime,
  