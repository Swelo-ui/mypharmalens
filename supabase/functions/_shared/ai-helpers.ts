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

// Fix for "Cannot find name 'Deno'"
declare const Deno: any;

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
 * Clean HTML by removing scripts, styles, and non-drug content
 * Reduces token count significantly while preserving drug information
 */
function cleanHTMLForExtraction(html: string): string {
  return html
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove navigation and footer
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    // Remove ads and sidebars
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/class="[^"]*ad[^"]*"/gi, '')
    // Remove HTML tags but keep text
    .replace(/<[^>]+>/g, ' ')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 6000); // Limit to 6000 chars (was 50,000)
}

/**
 * Intelligent web scraping - extract drug data from HTML
 */
export async function extractDataFromHTML(
  html: string,
  drugName: string,
  source: string = 'website'
): Promise<AIResponse> {
  // Pre-clean HTML to reduce tokens (Step 1 optimization)
  const cleanedHTML = cleanHTMLForExtraction(html);

  const prompt = `Extract pharmaceutical info for "${drugName}" from this ${source} content.

CONTENT:
${cleanedHTML}

Return JSON:
{
  "name": "Drug name",
  "genericName": "Active ingredient",
  "manufacturer": "Company",
  "category": "Drug category",
  "description": "What it treats (50 words max)",
  "sideEffects": ["Top 5 effects"],
  "warnings": ["Top 3 warnings"],
  "dosage": "Typical dosage",
  "storage": "Storage instructions",
  "indications": ["Top 5 uses"],
  "contraindications": ["Top 3"]
}

Use "Not available" for missing fields. Be concise.`;

  return await callTextAI(
    prompt,
    'data-extraction',
    OPENROUTER_API_KEY,
    SUPABASE_URL,
    {
      maxTokens: 800, // Reduced from 4096
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

export async function geminiExtractName(
  imageBase64: string
): Promise<AIResponse> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
  const start = Date.now();
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'GEMINI_API_KEY missing', modelUsed: 'gemini', latency: 0, attemptedModels: [] };
  }
  const prompt = 'Extract ONLY the drug/medication name from this image. Return JSON: {"name":"drug name"}';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
        ]
      }
    ]
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - start;
    if (!res.ok) {
      return { success: false, error: `Gemini HTTP ${res.status}`, modelUsed: 'gemini', latency, attemptedModels: [] };
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      success: true,
      text,
      data: text,
      modelUsed: 'gemini-1.5-flash',
      latency,
      attemptedModels: []
    };
  } catch (e) {
    clearTimeout(timeoutId);
    return { success: false, error: e instanceof Error ? e.message : 'Gemini error', modelUsed: 'gemini', latency: 0, attemptedModels: [] };
  }
}

export async function geminiValidateData(
  drugData: Record<string, unknown>
): Promise<AIResponse> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
  const start = Date.now();
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'GEMINI_API_KEY missing', modelUsed: 'gemini', latency: 0, attemptedModels: [] };
  }
  const prompt = `Validate and correct this drug information. Ensure brand/generic consistency and active ingredients. Return JSON only.`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          { text: `${prompt}\n\n${JSON.stringify(drugData).substring(0, 8000)}` }
        ]
      }
    ]
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - start;
    if (!res.ok) {
      return { success: false, error: `Gemini HTTP ${res.status}`, modelUsed: 'gemini', latency, attemptedModels: [] };
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let data: unknown = text;
    try { data = JSON.parse(text); } catch { }
    return { success: true, text, data, modelUsed: 'gemini-1.5-flash', latency, attemptedModels: [] };
  } catch (e) {
    clearTimeout(timeoutId);
    return { success: false, error: e instanceof Error ? e.message : 'Gemini error', modelUsed: 'gemini', latency: 0, attemptedModels: [] };
  }
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
