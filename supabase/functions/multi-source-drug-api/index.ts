// Multi-Source Drug Information API with Caching
import "@supabase/functions-js/edge-runtime.d.ts";
import { getCachedDrug, saveDrugToCache } from './cache.ts';
import { scrapeFDAOpenFDA, scrapeRxList, scrapeNIHDailyMed } from './scrapers.ts';

// Declare Deno for edge runtime
declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

// Use native DOMParser available in Deno Edge Runtime
// Fallback type declaration for DOMParser if not available
declare global {
  interface DOMParser {
    parseFromString(source: string, mimeType: string): Document;
  }
  interface Document {
    querySelector(selector: string): Element | null;
    querySelectorAll(selector: string): NodeListOf<Element>;
  }
  interface Element {
    textContent: string;
    innerHTML: string;
    getAttribute(name: string): string | null;
  }
}

// Type declarations for Deno environment

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
    fda?: string;
    rxlist?: string;
    dailymed?: string;
    gemini?: string;
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
  fromCache?: boolean;
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

function createResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Enhanced fetch with retry logic and exponential backoff
async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Fetching ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        signal: AbortSignal.timeout(20000), // 20 second timeout (increased)
      });

      if (response.ok) {
        console.log(`✅ Fetch successful (${response.status})`);
        return response;
      }
      
      // Handle specific error codes
      if (response.status === 404) {
        console.warn(`⚠️ Resource not found (404) - drug may not exist in this source`);
        throw new Error(`HTTP 404: Drug not found`);
      } else if (response.status === 429) {
        console.warn(`⚠️ Rate limited (429) - waiting longer before retry`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        throw new Error(`HTTP 429: Rate limited`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Attempt ${attempt} failed:`, (error as Error).message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`❌ All ${maxRetries} fetch attempts failed for ${url}`);
  throw lastError || new Error('All fetch attempts failed');
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .replace(/[^\w\s.,;:()-]/g, '');
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
    const descElements = doc.querySelectorAll('.ddc-drug-info .contentBox p, .drug-subtitle, .ddc-summary p') as NodeListOf<Element>;
    if (descElements.length > 0) {
      const descriptions = Array.from(descElements)
        .map((el) => cleanText(el.textContent || ''))
        .filter((text: string) => text.length > 20);
      if (descriptions.length > 0) {
        drugInfo.description = descriptions[0];
      }
    }

    // Extract side effects
    const sideEffectsSection = doc.querySelector('#side-effects .contentBox, .side-effects-list') as Element | null;
    if (sideEffectsSection) {
      const sideEffectItems = sideEffectsSection.querySelectorAll('li, p') as NodeListOf<Element>;
      drugInfo.sideEffects = Array.from(sideEffectItems)
        .map((item) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 5)
        .slice(0, 15);
    }

    // Extract warnings
    const warningsSection = doc.querySelector('#warnings .contentBox, .warnings-list') as Element | null;
    if (warningsSection) {
      const warningItems = warningsSection.querySelectorAll('li, p') as NodeListOf<Element>;
      drugInfo.warnings = Array.from(warningItems)
        .map((item) => cleanText(item.textContent || ''))
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
      const interactionItems = interactionsSection.querySelectorAll('li, p') as NodeListOf<Element>;
      drugInfo.interactions = Array.from(interactionItems)
        .map((item) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 5)
        .slice(0, 10);
    }

    // Extract brand names
    const brandNamesSection = doc.querySelector('.brand-names-list, .brand-name') as Element | null;
    if (brandNamesSection) {
      const brandItems = brandNamesSection.querySelectorAll('li, span') as NodeListOf<Element>;
      drugInfo.brandNames = Array.from(brandItems)
        .map((item) => cleanText(item.textContent || ''))
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
      const paragraphs = descSection.querySelectorAll('p') as NodeListOf<Element>;
      if (paragraphs.length > 0) {
        drugInfo.description = cleanText(paragraphs[0].textContent || '');
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
      const sideEffectItems = sideEffectsSection.querySelectorAll('li') as NodeListOf<Element>;
      drugInfo.sideEffects = Array.from(sideEffectItems)
        .map((item) => cleanText(item.textContent || ''))
        .filter((text: string) => text.length > 5)
        .slice(0, 15);
    }

    // Extract warnings/precautions
    const warningsSection = doc.querySelector('#what-special-precautions-should-i-follow + div') as Element | null;
    if (warningsSection) {
      const warningItems = warningsSection.querySelectorAll('li') as NodeListOf<Element>;
      drugInfo.warnings = Array.from(warningItems)
        .map((item) => cleanText(item.textContent || ''))
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

  const arrayFields = [
    'sideEffects', 'warnings', 'interactions', 'indications', 'contraindications', 'brandNames'
  ];

  arrayFields.forEach(field => {
    const arr = merged[field as keyof ComprehensiveDrugInfo] as unknown;
    if (Array.isArray(arr) && arr.length > 0) {
      completenessScore += 10;
    }
  });

  return Math.min(completenessScore, 100);
}

// 🆕 Enhanced merge function for ALL 5 sources
function mergeAllSourceData(
  drugsComData: Partial<ComprehensiveDrugInfo> | null,
  medlinePlusData: Partial<ComprehensiveDrugInfo> | null,
  fdaData: Partial<ComprehensiveDrugInfo> | null,
  rxListData: Partial<ComprehensiveDrugInfo> | null,
  dailyMedData: Partial<ComprehensiveDrugInfo> | null,
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

  // Priority order: FDA > Drugs.com > MedlinePlus > RxList > DailyMed
  // FDA is most authoritative for regulatory/official info
  
  const allSources = [
    { data: fdaData, name: 'FDA', key: 'fda' },
    { data: drugsComData, name: 'Drugs.com', key: 'drugscom' },
    { data: medlinePlusData, name: 'MedlinePlus', key: 'medlineplus' },
    { data: rxListData, name: 'RxList', key: 'rxlist' },
    { data: dailyMedData, name: 'DailyMed', key: 'dailymed' }
  ];
  
  // Merge each source in priority order
  for (const source of allSources) {
    if (!source.data) continue;
    
    // Track source
    if (source.data.sources) {
      merged.sources = { ...merged.sources, ...source.data.sources };
    }
    
    // Fill in missing fields (first valid value wins due to priority order)
    if (!merged.genericName && source.data.genericName) merged.genericName = source.data.genericName;
    if (!merged.manufacturer && source.data.manufacturer) merged.manufacturer = source.data.manufacturer;
    if (!merged.category && source.data.category) merged.category = source.data.category;
    if (!merged.drugClass && source.data.drugClass) merged.drugClass = source.data.drugClass;
    if (!merged.description && source.data.description) merged.description = source.data.description;
    if (!merged.dosageAndAdmin && source.data.dosageAndAdmin) merged.dosageAndAdmin = source.data.dosageAndAdmin;
    if (!merged.storage && source.data.storage) merged.storage = source.data.storage;
    if (!merged.mechanism && source.data.mechanism) merged.mechanism = source.data.mechanism;
    if (!merged.pregnancy && source.data.pregnancy) merged.pregnancy = source.data.pregnancy;
    if (merged.prescriptionStatus === 'Unknown' && source.data.prescriptionStatus) {
      merged.prescriptionStatus = source.data.prescriptionStatus;
    }
    
    // Merge arrays (combine unique items from all sources)
    if (source.data.sideEffects?.length) {
      merged.sideEffects = [...new Set([...merged.sideEffects, ...source.data.sideEffects])].slice(0, 20);
    }
    if (source.data.warnings?.length) {
      merged.warnings = [...new Set([...merged.warnings, ...source.data.warnings])].slice(0, 15);
    }
    if (source.data.interactions?.length) {
      merged.interactions = [...new Set([...merged.interactions, ...source.data.interactions])].slice(0, 15);
    }
    if (source.data.indications?.length) {
      merged.indications = [...new Set([...merged.indications, ...source.data.indications])].slice(0, 10);
    }
    if (source.data.contraindications?.length) {
      merged.contraindications = [...new Set([...merged.contraindications, ...source.data.contraindications])].slice(0, 10);
    }
    if (source.data.brandNames?.length) {
      merged.brandNames = [...new Set([...merged.brandNames, ...source.data.brandNames])].slice(0, 10);
    }
  }
  
  // Mark as verified if we have FDA data
  merged.verified = !!fdaData;
  
  // Calculate completeness
  merged.completeness = calculateCompleteness(merged);
  
  const sourceCount = allSources.filter(s => s.data !== null).length;
  console.log(`✅ Merged data from ${sourceCount}/5 sources, completeness: ${merged.completeness}%`);
  
  return merged;
}

async function collectDrugData(drugName: string): Promise<{
  drugInfo: ComprehensiveDrugInfo;
  searchAttempts: string[];
  sourcesUsed: string[];
}> {
  const searchAttempts: string[] = [];
  const sourcesUsed: string[] = [];
  
  console.log(`\n🌐 === DATA COLLECTION START === for: ${drugName}`);
  console.log('🔍 Fetching from 5 data sources in parallel...');
  console.log(`   1. Drugs.com`);
  console.log(`   2. MedlinePlus`);
  console.log(`   3. FDA OpenFDA`);
  console.log(`   4. RxList`);
  console.log(`   5. NIH DailyMed`);
  
  // 🆕 Try scraping from ALL 5 sources in parallel
  const [
    drugsComData,
    medlinePlusData,
    fdaData,
    rxListData,
    dailyMedData
  ] = await Promise.allSettled([
    scrapeDrugsCom(drugName),
    scrapeMedlinePlus(drugName),
    scrapeFDAOpenFDA(drugName),
    scrapeRxList(drugName),
    scrapeNIHDailyMed(drugName)
  ]);
  
  // Extract results
  const drugsComResult = drugsComData.status === 'fulfilled' ? drugsComData.value : null;
  const medlinePlusResult = medlinePlusData.status === 'fulfilled' ? medlinePlusData.value : null;
  const fdaResult = fdaData.status === 'fulfilled' ? fdaData.value : null;
  const rxListResult = rxListData.status === 'fulfilled' ? rxListData.value : null;
  const dailyMedResult = dailyMedData.status === 'fulfilled' ? dailyMedData.value : null;
  
  // Track successful sources
  if (drugsComResult) {
    searchAttempts.push(`Drugs.com: ${drugName}`);
    sourcesUsed.push('Drugs.com');
  }
  if (medlinePlusResult) {
    searchAttempts.push(`MedlinePlus: ${drugName}`);
    sourcesUsed.push('MedlinePlus');
  }
  if (fdaResult) {
    searchAttempts.push(`FDA OpenFDA: ${drugName}`);
    sourcesUsed.push('FDA OpenFDA');
  }
  if (rxListResult) {
    searchAttempts.push(`RxList: ${drugName}`);
    sourcesUsed.push('RxList');
  }
  if (dailyMedResult) {
    searchAttempts.push(`NIH DailyMed: ${drugName}`);
    sourcesUsed.push('NIH DailyMed');
  }
  
  console.log(`\n📊 === SCRAPING RESULTS ===`);
  console.log(`   ✅ Successful: ${sourcesUsed.length}/5`);
  console.log(`   📝 Sources: ${sourcesUsed.join(', ')}`);
  
  if (drugsComData.status === 'rejected') console.error(`   ❌ Drugs.com failed:`, drugsComData.reason);
  if (medlinePlusData.status === 'rejected') console.error(`   ❌ MedlinePlus failed:`, medlinePlusData.reason);
  if (fdaData.status === 'rejected') console.error(`   ❌ FDA OpenFDA failed:`, fdaData.reason);
  if (rxListData.status === 'rejected') console.error(`   ❌ RxList failed:`, rxListData.reason);
  if (dailyMedData.status === 'rejected') console.error(`   ❌ DailyMed failed:`, dailyMedData.reason);
  
  // 🆕 Merge data from ALL sources
  console.log(`\n🔀 === MERGING DATA ===`);
  const drugInfo = mergeAllSourceData(
    drugsComResult,
    medlinePlusResult,
    fdaResult,
    rxListResult,
    dailyMedResult,
    drugName
  );
  console.log(`   Merged completeness: ${drugInfo.completeness}%`);
  console.log(`🌐 === DATA COLLECTION END ===\n`);
  
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

// New function to generate comprehensive data when scraping fails
async function generateComprehensiveDataWithGemini(drugName: string): Promise<ComprehensiveDrugInfo | null> {
  if (!GEMINI_API_KEY) {
    console.log('Gemini API key not available, cannot generate data');
    return null;
  }

  try {
    console.log(`🤖 Generating comprehensive data with Gemini for: ${drugName}`);
    
    const prompt = `
    You are a pharmaceutical database expert. Generate complete, accurate, and medically reliable information for the medication: ${drugName}
    
    Provide comprehensive drug information in this exact JSON format:
    {
      "name": "${drugName}",
      "genericName": "Generic/chemical name",
      "manufacturer": "Primary manufacturers (list top 2-3)",
      "category": "Drug category (e.g., Analgesic, Antibiotic, Antihistamine)",
      "drugClass": "Specific pharmacological class",
      "description": "Comprehensive 4-5 sentence description explaining what this medication is, what it treats, and how it works",
      "dosageAndAdmin": "Detailed dosage and administration instructions including typical adult/pediatric doses, frequency, route of administration, and special instructions",
      "sideEffects": ["List 10-15 common side effects in order of frequency"],
      "warnings": ["List 6-10 important warnings, precautions, and contraindications"],
      "interactions": ["List 8-12 significant drug-drug, drug-food, or drug-condition interactions"],
      "storage": "Complete storage instructions including temperature, light, moisture considerations",
      "mechanism": "Detailed mechanism of action explaining how the drug works at a molecular/physiological level",
      "indications": ["List 6-10 approved medical indications and uses"],
      "contraindications": ["List 6-10 absolute and relative contraindications"],
      "prescriptionStatus": "OTC/Prescription/Controlled Substance (specify schedule if controlled)",
      "pregnancy": "Pregnancy safety category (A/B/C/D/X if applicable) and detailed guidance for pregnant/breastfeeding women",
      "brandNames": ["List 8-12 common brand names globally"]
    }
    
    CRITICAL REQUIREMENTS:
    1. Provide REAL, ACCURATE medical information only
    2. Do NOT make up or guess information
    3. Be comprehensive but precise
    4. This is for patient safety - accuracy is paramount
    5. If you're unsure about any detail, provide the most reliable general information for that drug class
    
    Respond with ONLY the JSON object, no additional text.`;

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
    const geminiText = data.candidates[0]?.content?.parts[0]?.text;

    if (geminiText) {
      try {
        const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const generatedData = JSON.parse(jsonMatch[0]) as Partial<ComprehensiveDrugInfo>;
          
          const comprehensiveInfo: ComprehensiveDrugInfo = {
            name: drugName,
            genericName: generatedData.genericName || '',
            manufacturer: generatedData.manufacturer || '',
            category: generatedData.category || '',
            drugClass: generatedData.drugClass || '',
            description: generatedData.description || '',
            dosageAndAdmin: generatedData.dosageAndAdmin || '',
            sideEffects: generatedData.sideEffects || [],
            warnings: generatedData.warnings || [],
            interactions: generatedData.interactions || [],
            storage: generatedData.storage || '',
            mechanism: generatedData.mechanism || '',
            indications: generatedData.indications || [],
            contraindications: generatedData.contraindications || [],
            prescriptionStatus: generatedData.prescriptionStatus || 'Unknown',
            pregnancy: generatedData.pregnancy || '',
            brandNames: generatedData.brandNames || [],
            sources: { gemini: 'AI Generated' },
            verified: false,
            completeness: 85 // High completeness since all fields are generated
          };

          console.log(`✅ Generated comprehensive data with ${comprehensiveInfo.completeness}% completeness`);
          return comprehensiveInfo;
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini generated data:', parseError);
      }
    }
  } catch (error) {
    console.error('Gemini data generation failed:', error);
  }

  return null;
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
          const enhancedData = JSON.parse(jsonMatch[0]) as Partial<ComprehensiveDrugInfo>;
          
          // Merge enhanced data with original, keeping source information
          const enhanced: ComprehensiveDrugInfo = {
            ...drugInfo,
            ...enhancedData,
            sources: drugInfo.sources, // Preserve source information
            verified: true,
            completeness: calculateCompleteness({ ...drugInfo, ...enhancedData })
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

  try {
    const startTime = performance.now();
    const { drugName, skipCache } = await req.json() as { drugName?: string; skipCache?: boolean };

    if (!drugName || typeof drugName !== 'string' || drugName.trim().length < 2) {
      return createResponse({ error: 'Invalid drug name' }, 400);
    }

    console.log(`\n========== Drug Lookup: ${drugName} ==========`);
    
    // NEW: Check cache first (unless skipCache is true)
    if (!skipCache) {
      console.log(`\n🔍 === CACHE CHECK START === for: ${drugName}`);
      try {
        const cachedDrug = await getCachedDrug(drugName);
        
        if (cachedDrug) {
          console.log(`📊 Cache found: completeness=${cachedDrug.completeness}%, sources=${Object.keys(cachedDrug.sources).length}`);
          
          if (cachedDrug.completeness >= 60) {
            console.log(`✅ Cache HIT! Returning cached data`);
            console.log(`   Sources: ${Object.keys(cachedDrug.sources).join(', ')}`);
            const response: ApiResponse = {
              success: true,
              data: cachedDrug,
              searchAttempts: ['Cache lookup'],
              processingTime: Math.round(performance.now() - startTime),
              sourcesUsed: Object.keys(cachedDrug.sources).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
              fromCache: true
            };
            return createResponse(response, 200);
          } else {
            console.log(`⚠️ Cache found but low quality (${cachedDrug.completeness}% < 60%)`);
          }
        } else {
          console.log(`❌ No cache entry found`);
        }
      } catch (cacheError) {
        console.error(`🔴 Cache check failed:`, cacheError);
      }
      console.log(`🔍 === CACHE CHECK END === Proceeding to API fetch...\n`);
    }

    // Fetch from multiple sources (existing + new)
    const { drugInfo, searchAttempts, sourcesUsed } = await collectDrugData(drugName);

    console.log(`\n📊 === SCRAPING RESULTS ===`);
    console.log(`   Completeness: ${drugInfo.completeness}%`);
    console.log(`   Sources succeeded: ${sourcesUsed.length}`);
    console.log(`   Has name: ${!!drugInfo.name}`);
    console.log(`   Has description: ${!!drugInfo.description}`);
    console.log(`   Has side effects: ${drugInfo.sideEffects?.length || 0} items`);
    console.log(`   Has warnings: ${drugInfo.warnings?.length || 0} items`);
    console.log(`📊 === END SCRAPING RESULTS ===\n`);

    // Only use Gemini fallback if scraping completely failed (< 15% completeness)
    // This gives priority to real scraped data from authoritative sources
    const hasMinimalData = drugInfo.completeness >= 15;
    
    if (!hasMinimalData) {
      console.log(`❌ Scraping completely failed (${drugInfo.completeness}% < 15%), using Gemini as last resort...`);
      // Use Gemini to generate comprehensive data when scraping fails
      const geminiGenerated = await generateComprehensiveDataWithGemini(drugName);
      if (geminiGenerated) {
        console.log(`✓ Gemini generated comprehensive data (${geminiGenerated.completeness}% completeness)`);
        // Merge any scraped data with Gemini data
        const mergedInfo = {
          ...geminiGenerated,
          ...drugInfo, // Keep any successfully scraped data
          sources: { ...geminiGenerated.sources, ...drugInfo.sources },
          verified: false, // Mark as AI-generated
          completeness: Math.max(geminiGenerated.completeness, drugInfo.completeness)
        };
        
        // Save the merged info to cache
        console.log(`💾 === CACHE SAVE START (Gemini-backed) ===`);
        if (mergedInfo.completeness >= 30) {
          console.log(`   Completeness: ${mergedInfo.completeness}% (>= 30%, saving...)`);
          console.log(`   Sources used: Gemini AI (primary), ${sourcesUsed.join(', ')}`);
          console.log(`   Drug name: ${drugName}`);
          
          saveDrugToCache(drugName, mergedInfo, ['Gemini AI', ...sourcesUsed])
            .then(() => {
              console.log(`✅ Successfully cached (Gemini-backed): ${drugName}`);
              console.log(`💾 === CACHE SAVE END ===\n`);
            })
            .catch(err => {
              console.error(`🔴 Cache save FAILED:`, err);
              console.log(`💾 === CACHE SAVE END (FAILED) ===\n`);
            });
        }
        
        const response: ApiResponse = {
          success: true,
          data: mergedInfo,
          searchAttempts: [...searchAttempts, 'Gemini AI Generation'],
          processingTime: Math.round(performance.now() - startTime),
          sourcesUsed: ['Gemini AI (primary)', ...sourcesUsed],
          fromCache: false
        };

        console.log(`\n🎉 === FINAL RESPONSE (Gemini-backed) ===`);
        console.log(`   Sources: ${response.sourcesUsed.length}`);
        console.log(`   Completeness: ${mergedInfo.completeness}%`);
        console.log(`   From cache: false`);
        console.log(`   Processing time: ${response.processingTime}ms`);
        console.log(`🎉 === REQUEST COMPLETE ===\n`);
        return createResponse(response, 200);
      }
    }
    
    // Enhance with Gemini (fill gaps in scraped data)
    const enhancedInfo = await enhanceDrugInfoWithGemini(drugInfo);

    // NEW: Save to cache for future use (async, don't block)
    console.log(`\n💾 === CACHE SAVE START ===`);
    if (enhancedInfo.completeness >= 30) {
      console.log(`   Completeness: ${enhancedInfo.completeness}% (>= 30%, saving...)`);
      console.log(`   Sources used: ${sourcesUsed.join(', ')}`);
      console.log(`   Drug name: ${drugName}`);
      
      saveDrugToCache(drugName, enhancedInfo, sourcesUsed)
        .then(() => {
          console.log(`✅ Successfully cached: ${drugName}`);
          console.log(`💾 === CACHE SAVE END ===\n`);
        })
        .catch(err => {
          console.error(`🔴 Cache save FAILED:`, err);
          console.error(`   Error details:`, JSON.stringify(err, null, 2));
          console.log(`💾 === CACHE SAVE END (FAILED) ===\n`);
        });
    } else {
      console.log(`   ⚠️ Completeness too low (${enhancedInfo.completeness}% < 30%), NOT saving`);
      console.log(`💾 === CACHE SAVE END (SKIPPED) ===\n`);
    }

    const response: ApiResponse = {
      success: true,
      data: enhancedInfo,
      searchAttempts,
      processingTime: Math.round(performance.now() - startTime),
      sourcesUsed,
      fromCache: false
    };

    console.log(`\n🎉 === FINAL RESPONSE ===`);
    console.log(`   Sources: ${sourcesUsed.length}`);
    console.log(`   Completeness: ${enhancedInfo.completeness}%`);
    console.log(`   From cache: ${false}`);
    console.log(`   Processing time: ${Math.round(performance.now() - startTime)}ms`);
    console.log(`🎉 === REQUEST COMPLETE ===\n`);
    return createResponse(response, 200);
  } catch (error) {
    console.error('Drug info processing error:', error);
    return createResponse({ success: false, error: 'Failed to process drug information', searchAttempts: [], processingTime: 0, sourcesUsed: [] }, 500);
  }
});