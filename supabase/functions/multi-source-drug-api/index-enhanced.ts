// Enhanced Multi-Source Drug Information API with Caching
import "@supabase/functions-js/edge-runtime.d.ts";
import type { ComprehensiveDrugInfo, ApiResponse } from './types.ts';
import { getCachedDrug, saveDrugToCache, getCacheStats } from './cache.ts';
import { scrapeFDAOpenFDA, scrapeRxList, scrapeNIHDailyMed } from './scrapers.ts';

// Declare Deno for edge runtime
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

// Import existing scrapers (you'll need to move these to a separate file)
// For now, I'll assume they exist in the same module

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function createResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Enhanced function to collect drug data from ALL sources including new ones
async function collectDrugDataEnhanced(drugName: string): Promise<{
  drugInfo: ComprehensiveDrugInfo;
  searchAttempts: string[];
  sourcesUsed: string[];
  fromCache: boolean;
}> {
  const searchAttempts: string[] = [];
  const sourcesUsed: string[] = [];
  
  // STEP 1: Check cache first
  console.log(`=== CACHE CHECK: ${drugName} ===`);
  const cachedDrug = await getCachedDrug(drugName);
  
  if (cachedDrug && cachedDrug.completeness >= 60) {
    console.log(`Cache hit with ${cachedDrug.completeness}% completeness`);
    return {
      drugInfo: cachedDrug,
      searchAttempts: ['Cache lookup'],
      sourcesUsed: Object.keys(cachedDrug.sources).map(s => 
        s.charAt(0).toUpperCase() + s.slice(1)
      ),
      fromCache: true
    };
  }
  
  // STEP 2: Cache miss or low completeness - fetch from APIs
  console.log(`=== API FETCH: ${drugName} ===`);
  console.log('Fetching from multiple sources in parallel...');
  
  const [
    drugsComResult,
    medlinePlusResult,
    fdaResult,
    rxListResult,
    dailyMedResult
  ] = await Promise.allSettled([
    scrapeDrugsCom(drugName),
    scrapeMedlinePlus(drugName),
    scrapeFDAOpenFDA(drugName),
    scrapeRxList(drugName),
    scrapeNIHDailyMed(drugName)
  ]);
  
  // Extract successful results
  const drugsComData = drugsComResult.status === 'fulfilled' ? drugsComResult.value : null;
  const medlinePlusData = medlinePlusResult.status === 'fulfilled' ? medlinePlusResult.value : null;
  const fdaData = fdaResult.status === 'fulfilled' ? fdaResult.value : null;
  const rxListData = rxListResult.status === 'fulfilled' ? rxListResult.value : null;
  const dailyMedData = dailyMedResult.status === 'fulfilled' ? dailyMedResult.value : null;
  
  // Track which sources succeeded
  if (drugsComData) {
    searchAttempts.push(`Drugs.com: ${drugName}`);
    sourcesUsed.push('Drugs.com');
  }
  if (medlinePlusData) {
    searchAttempts.push(`MedlinePlus: ${drugName}`);
    sourcesUsed.push('MedlinePlus');
  }
  if (fdaData) {
    searchAttempts.push(`FDA OpenFDA: ${drugName}`);
    sourcesUsed.push('FDA OpenFDA');
  }
  if (rxListData) {
    searchAttempts.push(`RxList: ${drugName}`);
    sourcesUsed.push('RxList');
  }
  if (dailyMedData) {
    searchAttempts.push(`NIH DailyMed: ${drugName}`);
    sourcesUsed.push('NIH DailyMed');
  }
  
  // STEP 3: Merge data from all sources
  const mergedDrug = mergeAllSourceData(
    drugsComData,
    medlinePlusData,
    fdaData,
    rxListData,
    dailyMedData,
    drugName
  );
  
  // Auto-save disabled - use manual save only
  if (mergedDrug.completeness >= 30) {
    console.log(`Auto-save disabled for ${drugName} (${mergedDrug.completeness}% completeness) - use manual save button`);
  }
  
  return {
    drugInfo: mergedDrug,
    searchAttempts,
    sourcesUsed,
    fromCache: false
  };
}

// Enhanced merge function supporting 5 sources
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

  const allSources = [drugsComData, medlinePlusData, fdaData, rxListData, dailyMedData];
  
  // Priority order: FDA > Drugs.com > MedlinePlus > RxList > DailyMed
  // FDA is most authoritative for regulatory info
  // Drugs.com/MedlinePlus for consumer info
  
  // Merge each source
  for (const sourceData of allSources) {
    if (!sourceData) continue;
    
    // Merge sources tracking
    if (sourceData.sources) {
      merged.sources = { ...merged.sources, ...sourceData.sources };
    }
    
    // Fill in missing fields (first valid value wins)
    if (!merged.genericName && sourceData.genericName) merged.genericName = sourceData.genericName;
    if (!merged.manufacturer && sourceData.manufacturer) merged.manufacturer = sourceData.manufacturer;
    if (!merged.category && sourceData.category) merged.category = sourceData.category;
    if (!merged.drugClass && sourceData.drugClass) merged.drugClass = sourceData.drugClass;
    if (!merged.description && sourceData.description) merged.description = sourceData.description;
    if (!merged.dosageAndAdmin && sourceData.dosageAndAdmin) merged.dosageAndAdmin = sourceData.dosageAndAdmin;
    if (!merged.storage && sourceData.storage) merged.storage = sourceData.storage;
    if (!merged.mechanism && sourceData.mechanism) merged.mechanism = sourceData.mechanism;
    if (!merged.prescriptionStatus || merged.prescriptionStatus === 'Unknown') {
      if (sourceData.prescriptionStatus) merged.prescriptionStatus = sourceData.prescriptionStatus;
    }
    if (!merged.pregnancy && sourceData.pregnancy) merged.pregnancy = sourceData.pregnancy;
    
    // Merge arrays (combine unique items)
    if (sourceData.sideEffects?.length) {
      merged.sideEffects = [...new Set([...merged.sideEffects, ...sourceData.sideEffects])].slice(0, 20);
    }
    if (sourceData.warnings?.length) {
      merged.warnings = [...new Set([...merged.warnings, ...sourceData.warnings])].slice(0, 15);
    }
    if (sourceData.interactions?.length) {
      merged.interactions = [...new Set([...merged.interactions, ...sourceData.interactions])].slice(0, 15);
    }
    if (sourceData.indications?.length) {
      merged.indications = [...new Set([...merged.indications, ...sourceData.indications])].slice(0, 10);
    }
    if (sourceData.contraindications?.length) {
      merged.contraindications = [...new Set([...merged.contraindications, ...sourceData.contraindications])].slice(0, 10);
    }
    if (sourceData.brandNames?.length) {
      merged.brandNames = [...new Set([...merged.brandNames, ...sourceData.brandNames])].slice(0, 10);
    }
  }
  
  // Calculate completeness
  merged.completeness = calculateCompleteness(merged);
  
  // Mark as verified if we have data from FDA
  merged.verified = !!fdaData && merged.completeness >= 50;
  
  const sourceCount = allSources.filter(s => s !== null).length;
  console.log(`Merged data from ${sourceCount} sources, completeness: ${merged.completeness}%`);
  
  return merged;
}

function calculateCompleteness(drug: ComprehensiveDrugInfo): number {
  let score = 0;
  
  // Critical fields (8 points each)
  const criticalFields = [
    'genericName', 'description', 'dosageAndAdmin', 'prescriptionStatus'
  ];
  criticalFields.forEach(field => {
    if (drug[field as keyof ComprehensiveDrugInfo] && 
        String(drug[field as keyof ComprehensiveDrugInfo]).trim() !== '' &&
        String(drug[field as keyof ComprehensiveDrugInfo]) !== 'Unknown') {
      score += 8;
    }
  });
  
  // Important fields (6 points each)
  const importantFields = [
    'manufacturer', 'category', 'drugClass', 'storage', 'mechanism', 'pregnancy'
  ];
  importantFields.forEach(field => {
    if (drug[field as keyof ComprehensiveDrugInfo] && 
        String(drug[field as keyof ComprehensiveDrugInfo]).trim() !== '') {
      score += 6;
    }
  });
  
  // Array fields (8 points each if present)
  const arrayFields = [
    'sideEffects', 'warnings', 'interactions', 'indications', 'contraindications', 'brandNames'
  ];
  arrayFields.forEach(field => {
    const arr = drug[field as keyof ComprehensiveDrugInfo];
    if (Array.isArray(arr) && arr.length > 0) {
      score += 8;
    }
  });
  
  return Math.min(score, 100);
}

// Placeholder functions - these should be imported from existing code
function scrapeDrugsCom(drugName: string): Promise<Partial<ComprehensiveDrugInfo> | null> {
  // Import from original index.ts
  console.log(`[Placeholder] Scraping Drugs.com for ${drugName}`);
  return Promise.resolve(null);
}

function scrapeMedlinePlus(drugName: string): Promise<Partial<ComprehensiveDrugInfo> | null> {
  // Import from original index.ts
  console.log(`[Placeholder] Scraping MedlinePlus for ${drugName}`);
  return Promise.resolve(null);
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

    console.log(`\n========== Drug Lookup Request: ${drugName} ==========`);
    
    // Get cache stats for monitoring
    const stats = await getCacheStats();
    console.log(`Cache stats: ${stats.totalEntries} entries, ${stats.highCompleteness} high-quality, avg ${stats.averageCompleteness}%`);
    
    // Collect drug data (with caching)
    const { drugInfo, searchAttempts, sourcesUsed, fromCache } = await collectDrugDataEnhanced(drugName);

    const response: ApiResponse = {
      success: true,
      data: drugInfo,
      searchAttempts,
      processingTime: Math.round(performance.now() - startTime),
      sourcesUsed,
      fromCache
    };

    console.log(`Response: ${response.fromCache ? 'FROM CACHE' : 'FROM API'}, ${sourcesUsed.length} sources, ${drugInfo.completeness}% complete`);
    return createResponse(response, 200);
    
  } catch (error) {
    console.error('Drug info processing error:', error);
    return createResponse({ 
      success: false, 
      error: 'Failed to process drug information', 
      searchAttempts: [], 
      processingTime: 0, 
      sourcesUsed: [],
      fromCache: false
    }, 500);
  }
});
