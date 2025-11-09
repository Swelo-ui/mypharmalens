/**
 * ===============================================================================
 * AI HELPERS - Wrapper functions for drug identification stages
 * ===============================================================================
 * 
 * These helpers wrap the AI fallback manager with drug-specific logic
 * and provide standardized interfaces for all AI-dependent stages.
 * 
 * ===============================================================================
 */

import { callVisionAI, callTextAI, type AIResponse } from './ai-fallback-manager.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';

// Drug data interfaces
interface DrugData {
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  sideEffects?: string[];
  warnings?: string[];
  dosage?: string;
  storage?: string;
  indications?: string[];
  contraindications?: string[];
  interactions?: string[];
  price?: string;
  availability?: string;
  drugClass?: string;
  mechanism?: string;
  dosageAndAdmin?: string;
  prescriptionStatus?: string;
  brandNames?: string[];
  pregnancy?: string;
}

interface QualityCheckResult {
  verified: boolean;
  qualityScore: number;
  issues: string[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  completeness: number;
  dataIntegrity?: string;
}

// ============================================================================
// VISION & OCR HELPERS
// ============================================================================

/**
 * Extract drug information from image using intelligent vision AI fallback
 */
export async function extractDrugFromImage(
  imageBase64: string,
  prompt: string
): Promise<AIResponse> {
  return await callVisionAI(
    prompt,
    imageBase64,
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 2048,
      temperature: 0.1,
      responseFormat: 'json'
    }
  );
}

/**
 * Extract text from pharmaceutical packaging using OCR AI fallback
 */
export async function extractTextFromImage(
  imageBase64: string
): Promise<AIResponse> {
  const prompt = `Extract ALL visible text from this pharmaceutical product image.

Include:
- Brand name and generic name
- Dosage and strength (mg, ml, etc.)
- Manufacturer name
- Batch number and expiry date
- Imprint codes (numbers/letters on pills)
- Any other visible text

Output format: Plain text, list all extracted text clearly.`;

  return await callVisionAI(
    prompt,
    imageBase64,
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 1024,
      temperature: 0.1,
      responseFormat: 'text'
    }
  );
}

/**
 * Critical vision analysis for challenging images (blurry, torn, reflective)
 */
export async function performCriticalVisionAI(
  imageBase64: string,
  knownIssues: string[] = []
): Promise<AIResponse> {
  const issuesText = knownIssues.length > 0 
    ? `\n\nKNOWN IMAGE ISSUES: ${knownIssues.join(', ')}`
    : '';

  const prompt = `You are an expert pharmaceutical analyst. Analyze this medication image with extreme attention to detail, especially for challenging images.

CRITICAL INSTRUCTIONS FOR DIFFICULT IMAGES:
- Even if blurry/torn/damaged, identify ANY visible markings
- Make educated extrapolations based on visible patterns
- If confidence is low, provide multiple possible drug names
- Document your analytical process

ANALYSIS REQUIREMENTS:
1. Imprint/Markings: Find ANY text, numbers, logos (even partial/faint)
2. Physical: Note color, shape, size, texture, coating
3. Manufacturer Clues: Logo shapes or distinctive designs
${issuesText}

OUTPUT FORMAT (JSON only):
{
  "name": "Primary drug name (best guess)",
  "genericName": "Generic name if identifiable",
  "imprint": "Any visible text/numbers/symbols",
  "color": "Dominant color(s)",
  "shape": "Physical shape description",
  "manufacturer": "Manufacturer if identifiable",
  "confidence": "high|medium|low",
  "physicalDescription": "Detailed physical characteristics",
  "identificationNotes": "Key identifying features and reasoning",
  "possibleNames": ["Array of possible drug names if confidence is low"],
  "imageQualityAnalysis": "Analysis of image quality challenges",
  "productType": "medication|supplement|other"
}`;

  return await callVisionAI(
    prompt,
    imageBase64,
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 2048,
      temperature: 0.1,
      responseFormat: 'json'
    }
  );
}

// ============================================================================
// WEB SCRAPING & DATA EXTRACTION HELPERS
// ============================================================================

/**
 * Intelligent web scraping - extract drug data from HTML
 */
export async function extractDataFromHTML(
  html: string,
  drugName: string,
  source: string = 'website'
): Promise<AIResponse> {
  const prompt = `You are an expert web scraper. Extract pharmaceutical information for "${drugName}" from this ${source} HTML content.

HTML Content (truncated to first 50000 chars):
${html.substring(0, 50000)}

Extract the following information in JSON format:
{
  "name": "Drug name",
  "genericName": "Active ingredient",
  "manufacturer": "Company",
  "category": "Drug category",
  "description": "What it treats",
  "sideEffects": ["Effect 1", "Effect 2"],
  "warnings": ["Warning 1", "Warning 2"],
  "dosage": "Typical dosage",
  "storage": "Storage instructions",
  "price": "Price if available",
  "availability": "Available/Out of stock",
  "indications": ["Use 1", "Use 2"],
  "contraindications": ["Contraindication 1"]
}

IMPORTANT:
- Only extract information that is clearly present in the HTML
- Use "Not available" for missing fields
- Ignore advertisements and unrelated content
- Focus on pharmaceutical data only`;

  return await callTextAI(
    prompt,
    'data-extraction',
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 4096,
      temperature: 0.1,
      responseFormat: 'json'
    }
  );
}

/**
 * Correct and clean scraped drug data
 */
export async function correctScrapedData(
  rawData: DrugData,
  drugName: string
): Promise<AIResponse> {
  const prompt = `You are a pharmaceutical data quality expert. Review and correct this scraped drug information for "${drugName}".

RAW DATA:
${JSON.stringify(rawData, null, 2).substring(0, 8000)}

Perform these corrections:
1. Remove HTML tags, special characters, asterisks (**)
2. Fix formatting issues (extra spaces, line breaks)
3. Standardize field names and values
4. Remove duplicate information
5. Ensure arrays contain proper items (not nested objects)
6. Validate and fix dosage formats

Return corrected data in clean JSON format:
{
  "name": "Clean drug name",
  "genericName": "Clean generic name",
  "manufacturer": "Company name",
  "category": "Drug category",
  "description": "Clean description",
  "sideEffects": ["Clean effect 1", "Clean effect 2"],
  "warnings": ["Clean warning 1"],
  "dosage": "Clean dosage info",
  "storage": "Clean storage info",
  "indications": ["Clean indication 1"],
  "contraindications": ["Clean contraindication 1"],
  "interactions": ["Clean interaction 1"]
}

RULES:
- Keep information accurate and pharmaceutical
- Remove marketing language
- Use medical terminology properly
- Ensure completeness while maintaining accuracy`;

  return await callTextAI(
    prompt,
    'data-extraction',
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 4096,
      temperature: 0.1,
      responseFormat: 'json'
    }
  );
}

// ============================================================================
// DATA GENERATION & BACKUP HELPERS
// ============================================================================

/**
 * Generate comprehensive drug information (backup/fallback)
 */
export async function generateDrugData(
  drugName: string,
  knownInfo: Partial<DrugData> = {}
): Promise<AIResponse> {
  const knownInfoText = Object.keys(knownInfo).length > 0
    ? `\n\nKNOWN INFORMATION:\n${JSON.stringify(knownInfo, null, 2)}`
    : '';

  const prompt = `You are a pharmaceutical database expert. Generate comprehensive drug information for: "${drugName}"
${knownInfoText}

Provide detailed information in this JSON format:
{
  "name": "Drug name",
  "genericName": "Active ingredient",
  "category": "Drug category (e.g., Analgesic, Antibiotic)",
  "drugClass": "Pharmacological class",
  "description": "What this drug is and what it treats",
  "mechanism": "How it works in the body",
  "indications": ["Condition 1", "Condition 2"],
  "dosageAndAdmin": "Typical dosage and administration",
  "sideEffects": ["Side effect 1", "Side effect 2"],
  "warnings": ["Warning 1", "Warning 2"],
  "contraindications": ["Contraindication 1"],
  "interactions": ["Drug interaction 1"],
  "storage": "Storage instructions",
  "manufacturer": "Company name (if known)",
  "prescriptionStatus": "OTC or Prescription",
  "brandNames": ["Brand 1", "Brand 2"],
  "pregnancy": "Pregnancy category or safety info"
}

Be accurate and comprehensive. If unsure about any field, use "Not available" or empty array.
Use known information provided above to fill fields accurately.`;

  return await callTextAI(
    prompt,
    'data-extraction',
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 3072,
      temperature: 0.1,
      responseFormat: 'json'
    }
  );
}

// ============================================================================
// VALIDATION & QA HELPERS
// ============================================================================

/**
 * Validate if two drug names refer to the same medication
 */
export async function validateDrugMatch(
  name1: string,
  name2: string,
  similarity: number
): Promise<AIResponse> {
  const prompt = `You are a pharmaceutical expert. Compare these two drug names and determine if they refer to the SAME medication:

Drug Name 1: "${name1}"
Drug Name 2: "${name2}"
String Similarity: ${similarity.toFixed(1)}%

Consider:
- Brand names vs generic names (e.g., "Paracetamol" = "Tylenol")
- Different dosage forms (e.g., "Tablet" vs "Capsule" = DIFFERENT)
- Spelling variations (e.g., "Paracetamol" = "Para-cetamol")
- Manufacturer names (e.g., "Amoxicillin (GSK)" = "Amoxicillin (Dr. Reddy's)")
- Active ingredient matching

Respond in JSON:
{
  "match": true/false,
  "confidence": "high|medium|low",
  "reason": "Brief explanation (2-3 sentences)",
  "recommendation": "accept|reject|manual_review"
}

Rules:
- match=true: Same drug, different spelling/brand
- match=false: Different drugs or different forms
- manual_review: Uncertain, needs human verification`;

  return await callTextAI(
    prompt,
    'validation',
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 512,
      temperature: 0.1,
      responseFormat: 'json'
    }
  );
}

/**
 * Perform final quality assurance on drug data
 */
export async function performQualityCheck(
  drugData: DrugData
): Promise<AIResponse> {
  const prompt = `You are a pharmaceutical quality assurance expert. Review this drug information for accuracy and completeness.

Drug Data:
${JSON.stringify(drugData, null, 2).substring(0, 8000)}

Perform the following checks:
1. Name consistency (brand vs generic)
2. Dosage format validity (e.g., "500mg" not "500")
3. Side effects are realistic for this drug class
4. Warnings match the drug category
5. Manufacturer name is plausible
6. Completeness score (% of fields filled)
7. Data coherence (fields don't contradict each other)

Respond in JSON:
{
  "verified": true/false,
  "qualityScore": 0-100,
  "issues": ["Issue 1", "Issue 2"],
  "recommendations": ["Fix 1", "Fix 2"],
  "confidence": "high|medium|low",
  "completeness": 0-100,
  "dataIntegrity": "excellent|good|fair|poor"
}

Be thorough but fair in your assessment.`;

  return await callTextAI(
    prompt,
    'reasoning',
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 1024,
      temperature: 0.1,
      responseFormat: 'json'
    }
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if AI response was successful and parse data
 */
export function parseAIResponse<T = DrugData>(response: AIResponse): { success: boolean; data?: T; error?: string } {
  if (response.success) {
    return {
      success: true,
      data: response.data as T
    };
  } else {
    return {
      success: false,
      error: response.error
    };
  }
}

/**
 * Log AI usage for debugging
 */
export function logAIUsage(stage: string, response: AIResponse): void {
  if (response.success) {
    console.log(`✅ ${stage}: ${response.modelUsed} in ${response.latency}ms`);
    if (response.attemptedModels.length > 1) {
      console.log(`   Fallback chain: ${response.attemptedModels.join(' → ')}`);
    }
  } else {
    console.error(`❌ ${stage}: All AI models failed`);
    console.error(`   Attempted: ${response.attemptedModels.join(', ')}`);
    console.error(`   Error: ${response.error}`);
  }
}
