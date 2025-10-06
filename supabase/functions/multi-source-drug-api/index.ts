// Multi-Source Drug Information API
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Use native DOMParser available in Deno Edge Runtime
// Fallback type declaration for DOMParser if not available
declare global {
  interface DOMParser {
    parseFromString(source: string, mimeType: string): Document;
  }
  interface Document {
    querySelector(selector: string): Element | null;
    querySelectorAll(selector: string): NodeList;
  }
  interface Element {
    textContent: string | null;
    innerHTML: string;
    getAttribute(name: string): string | null;
  }
}

// Type declarations for Deno environment
declare global {
  namespace Deno {
    function serve(handler: (req: Request) => Response | Promise<Response>): void;
    const env: {
      get(key: string): string | undefined;
    };
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComprehensiveDrugInfo {
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  drugClass: string;
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
  brandNames: string[];
  verified: boolean;
  sources: {
    drugscom?: string;
    medlineplus?: string;
  };
  completeness: number; // 0-100 score based on available information
}

interface ApiResponse {
  success: boolean;
  data?: ComprehensiveDrugInfo;
  error?: string;
  searchAttempts: string[];
  processingTime: number;
  sourcesUsed: string[];
}

// User agents for web scraping
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function createResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Enhanced fetch with retry logic
async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .replace(/[^\w\s.,;:()\-]/g, '');
}

function extractArrayFromText(text: string, maxItems: number = 15): string[] {
  if (!text) return [];
  
  const items = text
    .split(/[•\n\r]/)
    .map(item => cleanText(item))
    .filter(item => item.length > 3 && item.length < 200)
    .slice(0, maxItems);
    
  return Array.from(new Set(items));
}

// Enhanced Drugs.com scraper
async function scrapeDrugsCom(drugName: string): Promise<Partial<ComprehensiveDrugInfo> | null> {
  try {
    const searchUrl = `https://www.drugs.com/${encodeURIComponent(drugName.toLowerCase().replace(/\s+/g, '-'))}.html`;
    console.log(`Scraping Drugs.com: ${searchUrl}`);
    
    const response = await fetchWithRetry(searchUrl);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const drugInfo: Partial<ComprehensiveDrugInfo> = {
      sources: { drugscom: searchUrl }
    };

    // Extract generic name
    const titleElement = doc.querySelector('h1.ddc-page-title, h1[data-page-title], .generic-name, .drug-title h1') as Element | null;
    if (titleElement) {
      drugInfo.genericName = cleanText(titleElement.textContent || '');
    }

    // Extract description
    const descElements = doc.querySelectorAll('.ddc-drug-info .contentBox p, .drug-subtitle, .ddc-summary p');
    if (descElements.length > 0) {
      const descriptions = Array.from(descElements)
        .map((el: Node) => cleanText((el as Element).textContent || ''))
        .filter((text: string) => text.length > 20);
      if (descriptions.length > 0) {
        drugInfo.description = descriptions[0];
      }
    }

    // Extract side effects
    const sideEffectsSection = doc.querySelector('#side-effects .contentBox, .side-effects-list') as Element | null;
    if (sideEffectsSection) {
      const sideEffectItems = sideEffectsSection.querySelectorAll('li, p');
      drugInfo.sideEffects = Array.from(sideEffectItems)
        .map((item: Element) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 5)
        .slice(0, 15);
    }

    // Extract warnings
    const warningsSection = doc.querySelector('#warnings .contentBox, .warnings-list') as Element | null;
    if (warningsSection) {
      const warningItems = warningsSection.querySelectorAll('li, p');
      drugInfo.warnings = Array.from(warningItems)
        .map((item: Element) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 10)
        .slice(0, 10);
    }

    // Extract dosage information
    const dosageSection = doc.querySelector('#dosage .contentBox, .dosage-section') as Element | null;
    if (dosageSection) {
      drugInfo.dosageAndAdmin = cleanText(dosageSection.textContent || '');
    }

    // Extract drug interactions
    const interactionsSection = doc.querySelector('#interactions .contentBox, .interactions-list') as Element | null;
    if (interactionsSection) {
      const interactionItems = interactionsSection.querySelectorAll('li, p');
      drugInfo.interactions = Array.from(interactionItems)
        .map((item: Element) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 5)
        .slice(0, 10);
    }

    // Extract brand names
    const brandNamesSection = doc.querySelector('.brand-names-list, .brand-name') as Element | null;
    if (brandNamesSection) {
      const brandItems = brandNamesSection.querySelectorAll('li, span');
      drugInfo.brandNames = Array.from(brandItems)
        .map((item: Element) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 1)
        .slice(0, 10);
    }

    console.log(`Drugs.com scraping completed for ${drugName}`);
    return drugInfo;

  } catch (error) {
    console.error(`Drugs.com scraping failed for ${drugName}:`, error);
    return null;
  }
}

// Enhanced MedlinePlus scraper
async function scrapeMedlinePlus(drugName: string): Promise<Partial<ComprehensiveDrugInfo> | null> {
  try {
    const searchUrl = `https://medlineplus.gov/druginfo/meds/a${encodeURIComponent(drugName.toLowerCase().replace(/\s+/g, ''))}.html`;
    console.log(`Scraping MedlinePlus: ${searchUrl}`);
    
    const response = await fetchWithRetry(searchUrl);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const drugInfo: Partial<ComprehensiveDrugInfo> = {
      sources: { medlineplus: searchUrl }
    };

    // Extract generic name
    const titleElement = doc.querySelector('h1.page-title, .drug-name h1, h1:first-of-type') as Element | null;
    if (titleElement) {
      drugInfo.genericName = cleanText(titleElement.textContent || '');
    }

    // Extract description
    const descSection = doc.querySelector('#why-is-this-medication-prescribed + div, .drug-description') as Element | null;
    if (descSection) {
      const paragraphs = descSection.querySelectorAll('p');
      if (paragraphs.length > 0) {
        drugInfo.description = cleanText((paragraphs[0] as Element).textContent || '');
      }
    }

    // Extract dosage information
    const dosageSection = doc.querySelector('#how-should-this-medicine-be-used + div, .dosage-info') as Element | null;
    if (dosageSection) {
      drugInfo.dosageAndAdmin = cleanText(dosageSection.textContent || '');
    }

    // Extract side effects
    const sideEffectsSection = doc.querySelector('#what-side-effects-can-this-medication-cause + div') as Element | null;
    if (sideEffectsSection) {
      const sideEffectItems = sideEffectsSection.querySelectorAll('li');
      drugInfo.sideEffects = Array.from(sideEffectItems)
        .map((item: Element) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 5)
        .slice(0, 15);
    }

    // Extract warnings/precautions
    const warningsSection = doc.querySelector('#what-special-precautions-should-i-follow + div') as Element | null;
    if (warningsSection) {
      const warningItems = warningsSection.querySelectorAll('li');
      drugInfo.warnings = Array.from(warningItems)
        .map((item: Element) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 10)
        .slice(0, 10);
    }

    // Extract storage information
    const storageSection = doc.querySelector('#how-should-i-store-this-medication + div, .storage-info') as Element | null;
    if (storageSection) {
      drugInfo.storage = cleanText(storageSection.textContent || '');
    }

    console.log(`MedlinePlus scraping completed for ${drugName}`);
    return drugInfo;

  } catch (error) {
    console.error(`MedlinePlus scraping failed for ${drugName}:`, error);
    return null;
  }
}

// Merge data from multiple sources
function mergeMultiSourceData(
  drugsComData: Partial<ComprehensiveDrugInfo> | null,
  medlinePlusData: Partial<ComprehensiveDrugInfo> | null,
  drugName: string
): ComprehensiveDrugInfo {
  
  const merged: ComprehensiveDrugInfo = {
    name: drugName,
    genericName: "",
    manufacturer: "",
    category: "",
    drugClass: "",
    description: "",
    dosageAndAdmin: "",
    sideEffects: [],
    warnings: [],
    interactions: [],
    storage: "",
    mechanism: "",
    indications: [],
    contraindications: [],
    prescriptionStatus: "Unknown",
    pregnancy: "",
    brandNames: [],
    verified: false,
    sources: {},
    completeness: 0
  };

  const sourcesUsed: string[] = [];

  // Merge Drugs.com data (prioritize for certain fields)
  if (drugsComData) {
    sourcesUsed.push('Drugs.com');
    merged.sources.drugscom = drugsComData.sources?.drugscom;
    
    // Prioritize Drugs.com for certain fields
    if (drugsComData.genericName) merged.genericName = drugsComData.genericName;
    if (drugsComData.manufacturer) merged.manufacturer = drugsComData.manufacturer;
    if (drugsComData.category) merged.category = drugsComData.category;
    if (drugsComData.drugClass) merged.drugClass = drugsComData.drugClass;
    if (drugsComData.brandNames?.length) merged.brandNames = drugsComData.brandNames;
    if (drugsComData.prescriptionStatus) merged.prescriptionStatus = drugsComData.prescriptionStatus;
    if (drugsComData.pregnancy) merged.pregnancy = drugsComData.pregnancy;
    if (drugsComData.mechanism) merged.mechanism = drugsComData.mechanism;
    if (drugsComData.indications?.length) merged.indications = drugsComData.indications;
    if (drugsComData.contraindications?.length) merged.contraindications = drugsComData.contraindications;
    if (drugsComData.interactions?.length) merged.interactions = drugsComData.interactions;
    
    // Use Drugs.com description if available and substantial
    if (drugsComData.description && drugsComData.description.length > 50) {
      merged.description = drugsComData.description;
    }
    
    // Use Drugs.com arrays if available
    if (drugsComData.sideEffects?.length) {
      merged.sideEffects = drugsComData.sideEffects.slice(0, 15);
    }
    if (drugsComData.warnings?.length) {
      merged.warnings = drugsComData.warnings.slice(0, 10);
    }
    if (drugsComData.dosageAndAdmin) {
      merged.dosageAndAdmin = drugsComData.dosageAndAdmin;
    }
    if (drugsComData.storage) {
      merged.storage = drugsComData.storage;
    }
  }

  // Merge MedlinePlus data (supplement and enhance)
  if (medlinePlusData) {
    sourcesUsed.push('MedlinePlus');
    merged.sources.medlineplus = medlinePlusData.sources?.medlineplus;
    
    // Fill in missing fields from MedlinePlus
    if (!merged.genericName && medlinePlusData.genericName) {
      merged.genericName = medlinePlusData.genericName;
    }
    if (!merged.description && medlinePlusData.description) {
      merged.description = medlinePlusData.description;
    }
    if (!merged.dosageAndAdmin && medlinePlusData.dosageAndAdmin) {
      merged.dosageAndAdmin = medlinePlusData.dosageAndAdmin;
    }
    if (!merged.storage && medlinePlusData.storage) {
      merged.storage = medlinePlusData.storage;
    }
    
    // Merge arrays (combine unique items)
    if (medlinePlusData.sideEffects?.length) {
      const combinedSideEffects = [...merged.sideEffects, ...medlinePlusData.sideEffects];
      merged.sideEffects = Array.from(new Set(combinedSideEffects)).slice(0, 15);
    }
    if (medlinePlusData.warnings?.length) {
      const combinedWarnings = [...merged.warnings, ...medlinePlusData.warnings];
      merged.warnings = Array.from(new Set(combinedWarnings)).slice(0, 10);
    }
  }

  // Calculate completeness score
  merged.completeness = calculateCompleteness(merged);
  
  console.log(`Merged data from sources: ${sourcesUsed.join(', ')}, completeness: ${merged.completeness}%`);
  
  return merged;
}

function calculateCompleteness(merged: ComprehensiveDrugInfo): number {
  let completenessScore = 0;
  const fields = [
    'genericName', 'description', 'dosageAndAdmin', 'storage', 'mechanism',
    'manufacturer', 'category', 'prescriptionStatus', 'pregnancy'
  ];

  fields.forEach(field => {
    if (merged[field as keyof ComprehensiveDrugInfo] && 
        String(merged[field as keyof ComprehensiveDrugInfo]).trim() !== '' &&
        String(merged[field as keyof ComprehensiveDrugInfo]) !== 'Unknown') {
      completenessScore += 8;
    }
  });

  const arrayFields = ['sideEffects', 'warnings', 'indications', 'contraindications', 'interactions', 'brandNames'];
  arrayFields.forEach(field => {
    const arrayValue = merged[field as keyof ComprehensiveDrugInfo] as string[];
    if (arrayValue && Array.isArray(arrayValue) && arrayValue.length > 0) {
      completenessScore += Math.min(arrayValue.length * 2, 8);
    }
  });

  return Math.min(completenessScore, 100);
}

async function searchComprehensiveDrugInfo(drugName: string): Promise<{
  drugInfo: ComprehensiveDrugInfo;
  searchAttempts: string[];
  sourcesUsed: string[];
}> {
  const searchAttempts: string[] = [];
  const sourcesUsed: string[] = [];
  
  console.log(`Starting comprehensive search for: ${drugName}`);
  
  // Try scraping from multiple sources
  const [drugsComData, medlinePlusData] = await Promise.allSettled([
    scrapeDrugsCom(drugName),
    scrapeMedlinePlus(drugName)
  ]);
  
  const drugsComResult = drugsComData.status === 'fulfilled' ? drugsComData.value : null;
  const medlinePlusResult = medlinePlusData.status === 'fulfilled' ? medlinePlusData.value : null;
  
  if (drugsComResult) {
    searchAttempts.push(`Drugs.com: ${drugName}`);
    sourcesUsed.push('Drugs.com');
  }
  
  if (medlinePlusResult) {
    searchAttempts.push(`MedlinePlus: ${drugName}`);
    sourcesUsed.push('MedlinePlus');
  }
  
  // Merge data from all sources
  const drugInfo = mergeMultiSourceData(drugsComResult, medlinePlusResult, drugName);
  
  return {
    drugInfo,
    searchAttempts,
    sourcesUsed
  };
}

// Gemini API integration
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

async function enhanceDrugInfoWithGemini(drugInfo: ComprehensiveDrugInfo): Promise<ComprehensiveDrugInfo> {
  if (!GEMINI_API_KEY) {
    console.log('Gemini API key not available, skipping enhancement');
    return drugInfo;
  }

  try {
    const prompt = `
    Please enhance and validate the following drug information. Fill in any missing fields with accurate medical information, and correct any inaccuracies. Respond with a JSON object matching the exact structure provided:

    Current drug information:
    ${JSON.stringify(drugInfo, null, 2)}

    Please provide enhanced information in this exact JSON format:
    {
      "name": "string",
      "genericName": "string", 
      "manufacturer": "string",
      "category": "string",
      "drugClass": "string",
      "description": "string (comprehensive description)",
      "dosageAndAdmin": "string (detailed dosage and administration)",
      "sideEffects": ["array of common side effects"],
      "warnings": ["array of important warnings"],
      "interactions": ["array of drug interactions"],
      "storage": "string (storage instructions)",
      "mechanism": "string (mechanism of action)",
      "indications": ["array of medical indications"],
      "contraindications": ["array of contraindications"],
      "prescriptionStatus": "string (OTC/Prescription/Controlled)",
      "pregnancy": "string (pregnancy category/safety)",
      "brandNames": ["array of brand names"]
    }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      } as GeminiRequest)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const enhancedText = data.candidates[0]?.content?.parts[0]?.text;

    if (enhancedText) {
      try {
        // Extract JSON from the response
        const jsonMatch = enhancedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const enhancedData = JSON.parse(jsonMatch[0]);
          
          // Merge enhanced data with original, keeping source information
          const enhanced: ComprehensiveDrugInfo = {
            ...drugInfo,
            ...enhancedData,
            sources: drugInfo.sources, // Preserve source information
            verified: true,
            completeness: calculateCompleteness({...drugInfo, ...enhancedData})
          };

          console.log(`Enhanced drug info with Gemini, completeness: ${enhanced.completeness}%`);
          return enhanced;
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
      }
    }
  } catch (error) {
    console.error('Gemini enhancement failed:', error);
  }

  return drugInfo;
}

// Main API handler
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();

  try {
    const { drugName } = await req.json();

    if (!drugName || typeof drugName !== 'string') {
      return createResponse({
        success: false,
        error: 'Drug name is required and must be a string',
        searchAttempts: [],
        processingTime: Date.now() - startTime,
        sourcesUsed: []
      } as ApiResponse, 400);
    }

    console.log(`Processing request for drug: ${drugName}`);

    // Search for comprehensive drug information
    const result = await searchComprehensiveDrugInfo(drugName.trim());
    
    // Enhance with Gemini if completeness is low
    let finalDrugInfo = result.drugInfo;
    if (finalDrugInfo.completeness < 70) {
      console.log(`Completeness ${finalDrugInfo.completeness}% < 70%, attempting Gemini enhancement`);
      finalDrugInfo = await enhanceDrugInfoWithGemini(finalDrugInfo);
      if (finalDrugInfo.completeness > result.drugInfo.completeness) {
        result.sourcesUsed.push('Gemini AI');
      }
    }

    // Mark as verified if we have substantial data
    finalDrugInfo.verified = finalDrugInfo.completeness >= 30;

    const response: ApiResponse = {
      success: true,
      data: finalDrugInfo,
      searchAttempts: result.searchAttempts,
      processingTime: Date.now() - startTime,
      sourcesUsed: result.sourcesUsed
    };

    console.log(`Request completed in ${response.processingTime}ms, completeness: ${finalDrugInfo.completeness}%`);
    return createResponse(response);

  } catch (error) {
    console.error('API Error:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      searchAttempts: [],
      processingTime: Date.now() - startTime,
      sourcesUsed: []
    };

    return createResponse(errorResponse, 500);
  }
});