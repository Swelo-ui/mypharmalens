// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import "https://deno.land/x/xhr@0.1.0/mod.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrugInfo {
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
  sourceUrl: string;
}

interface ApiResponse {
  success: boolean;
  data?: DrugInfo;
  error?: string;
  searchAttempts: string[];
  processingTime: number;
}

// Helper function to create response
function createResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Enhanced user agent rotation for better scraping success
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Retry mechanism with exponential backoff
async function fetchWithRetry(url: string, options: any, maxRetries: number = 3): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt} for: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (response.ok) {
        return response;
      } else if (response.status === 429) {
        // Rate limited, wait longer
        const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
        console.log(`Rate limited, waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// Enhanced HTML parsing with multiple extraction strategies
function parseHtmlForDrugInfo(html: string, drugName: string, sourceUrl: string): DrugInfo {
  const drugInfo: DrugInfo = {
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
    verified: true,
    sourceUrl
  };

  try {
    // Extract generic name - multiple strategies
    const genericPatterns = [
      /<h1[^>]*class="[^"]*generic[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<span[^>]*class="[^"]*generic[^"]*"[^>]*>([^<]+)<\/span>/i,
      /Generic Name[:\s]*<[^>]*>([^<]+)<\/[^>]*>/i,
      /Generic Name[:\s]*([^<\n]+)/i,
      /<title>([^|<]+)\s*\|/i
    ];

    for (const pattern of genericPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        drugInfo.genericName = match[1].trim().replace(/\([^)]*\)/g, '').trim();
        break;
      }
    }

    // Extract brand names
    const brandPatterns = [
      /Brand Names?[:\s]*<[^>]*>([\s\S]*?)<\/[^>]*>/i,
      /Brand Names?[:\s]*([^<\n]+)/i,
      /<div[^>]*class="[^"]*brand[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    ];

    for (const pattern of brandPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const brandText = match[1].replace(/<[^>]*>/g, '');
        drugInfo.brandNames = brandText.split(/[,;]/).map(b => b.trim()).filter(b => b.length > 0);
        break;
      }
    }

    // Extract description - multiple strategies
    const descPatterns = [
      /<div[^>]*class="[^"]*drug-subtitle[^"]*"[^>]*>([^<]+)<\/div>/i,
      /<p[^>]*class="[^"]*drug-subtitle[^"]*"[^>]*>([^<]+)<\/p>/i,
      /<div[^>]*class="[^"]*contentBox[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*drug-summary[^"]*"[^>]*>([\s\S]*?)<\/section>/i
    ];

    for (const pattern of descPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        drugInfo.description = match[1].replace(/<[^>]*>/g, '').trim().substring(0, 1000);
        if (drugInfo.description.length > 50) break;
      }
    }

    // Extract manufacturer
    const manufacturerPatterns = [
      /Manufacturer[:\s]*<[^>]*>([^<]+)<\/[^>]*>/i,
      /Manufacturer[:\s]*([^<\n]+)/i,
      /Marketed by[:\s]*<[^>]*>([^<]+)<\/[^>]*>/i,
      /Marketed by[:\s]*([^<\n]+)/i,
      /<span[^>]*class="[^"]*manufacturer[^"]*"[^>]*>([^<]+)<\/span>/i
    ];

    for (const pattern of manufacturerPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        drugInfo.manufacturer = match[1].trim();
        break;
      }
    }

    // Extract drug class/category
    const classPatterns = [
      /Drug Class[:\s]*<[^>]*>([^<]+)<\/[^>]*>/i,
      /Drug Class[:\s]*([^<\n]+)/i,
      /Therapeutic Class[:\s]*<[^>]*>([^<]+)<\/[^>]*>/i,
      /Therapeutic Class[:\s]*([^<\n]+)/i,
      /<span[^>]*class="[^"]*drug-class[^"]*"[^>]*>([^<]+)<\/span>/i
    ];

    for (const pattern of classPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        drugInfo.drugClass = match[1].trim();
        drugInfo.category = match[1].trim();
        break;
      }
    }

    // Extract side effects
    const sideEffectsPatterns = [
      /side effects?[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i,
      /<div[^>]*id="[^"]*side-effects[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*side-effects[^"]*"[^>]*>([\s\S]*?)<\/section>/i
    ];

    for (const pattern of sideEffectsPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const sideEffectsText = match[1].replace(/<[^>]*>/g, '');
        drugInfo.sideEffects = sideEffectsText
          .split(/[,;.]/)
          .map(s => s.trim())
          .filter(s => s.length > 3 && s.length < 100)
          .slice(0, 15);
        if (drugInfo.sideEffects.length > 0) break;
      }
    }

    // Extract warnings
    const warningsPatterns = [
      /warnings?[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i,
      /<div[^>]*id="[^"]*warnings[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*warnings[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      /black box warning[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i
    ];

    for (const pattern of warningsPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const warningsText = match[1].replace(/<[^>]*>/g, '');
        drugInfo.warnings = warningsText
          .split(/[.!]/)
          .map(w => w.trim())
          .filter(w => w.length > 10 && w.length < 200)
          .slice(0, 10);
        if (drugInfo.warnings.length > 0) break;
      }
    }

    // Extract dosage and administration
    const dosagePatterns = [
      /dosage[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i,
      /administration[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i,
      /<div[^>]*id="[^"]*dosage[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /how to use[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i
    ];

    for (const pattern of dosagePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        drugInfo.dosageAndAdmin = match[1].replace(/<[^>]*>/g, '').trim().substring(0, 500);
        if (drugInfo.dosageAndAdmin.length > 20) break;
      }
    }

    // Extract interactions
    const interactionPatterns = [
      /drug interactions?[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i,
      /interactions?[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i,
      /<div[^>]*id="[^"]*interactions[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    ];

    for (const pattern of interactionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const interactionsText = match[1].replace(/<[^>]*>/g, '');
        drugInfo.interactions = interactionsText
          .split(/[,;.]/)
          .map(i => i.trim())
          .filter(i => i.length > 5 && i.length < 100)
          .slice(0, 10);
        if (drugInfo.interactions.length > 0) break;
      }
    }

    // Extract prescription status
    const prescriptionPatterns = [
      /prescription required/i,
      /rx only/i,
      /over.the.counter/i,
      /otc/i,
      /prescription drug/i
    ];

    for (const pattern of prescriptionPatterns) {
      if (pattern.test(html)) {
        if (pattern.source.includes('prescription') || pattern.source.includes('rx')) {
          drugInfo.prescriptionStatus = "Prescription Required";
        } else {
          drugInfo.prescriptionStatus = "Over-the-Counter";
        }
        break;
      }
    }

    // Extract pregnancy information
    const pregnancyPatterns = [
      /pregnancy category[:\s]*([A-Z])/i,
      /pregnancy[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i,
      /pregnancy and breastfeeding[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i
    ];

    for (const pattern of pregnancyPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        drugInfo.pregnancy = match[1].replace(/<[^>]*>/g, '').trim().substring(0, 200);
        break;
      }
    }

    console.log(`Successfully parsed drug info for: ${drugName}`);
    return drugInfo;

  } catch (error) {
    console.error('Error parsing HTML:', error);
    return drugInfo;
  }
}

// Search for drug information with multiple strategies
async function searchDrugInfo(drugName: string): Promise<{ drugInfo: DrugInfo | null; searchAttempts: string[] }> {
  const searchAttempts: string[] = [];
  
  if (!drugName || drugName.trim().length < 2) {
    throw new Error('Invalid drug name provided');
  }

  const cleanDrugName = drugName.trim().toLowerCase();
  
  // Strategy 1: Direct URL access
  const directUrl = `https://www.drugs.com/${cleanDrugName.replace(/\s+/g, '-')}.html`;
  searchAttempts.push(`Direct URL: ${directUrl}`);
  
  try {
    console.log(`Trying direct URL: ${directUrl}`);
    const response = await fetchWithRetry(directUrl, {});
    
    if (response.ok) {
      const html = await response.text();
      const drugInfo = parseHtmlForDrugInfo(html, drugName, directUrl);
      return { drugInfo, searchAttempts };
    }
  } catch (error) {
    console.log(`Direct URL failed: ${error.message}`);
  }

  // Strategy 2: Search page
  const searchUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(drugName)}`;
  searchAttempts.push(`Search URL: ${searchUrl}`);
  
  try {
    console.log(`Trying search: ${searchUrl}`);
    const searchResponse = await fetchWithRetry(searchUrl, {});
    
    if (searchResponse.ok) {
      const searchHtml = await searchResponse.text();
      
      // Look for first search result
      const resultPatterns = [
        /<a href="(\/[^"]+\.html)" class="ddc-link-[^"]+">/,
        /<a href="(\/[^"]+\.html)"[^>]*class="[^"]*result[^"]*">/,
        /<a href="(\/[^"]+\.html)"[^>]*>/
      ];

      for (const pattern of resultPatterns) {
        const match = searchHtml.match(pattern);
        if (match && match[1]) {
          const resultUrl = `https://www.drugs.com${match[1]}`;
          searchAttempts.push(`Search result: ${resultUrl}`);
          
          try {
            console.log(`Trying search result: ${resultUrl}`);
            const resultResponse = await fetchWithRetry(resultUrl, {});
            
            if (resultResponse.ok) {
              const html = await resultResponse.text();
              const drugInfo = parseHtmlForDrugInfo(html, drugName, resultUrl);
              return { drugInfo, searchAttempts };
            }
          } catch (error) {
            console.log(`Search result failed: ${error.message}`);
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.log(`Search failed: ${error.message}`);
  }

  // Strategy 3: Alternative search with modified drug name
  if (cleanDrugName.includes(' ')) {
    const alternativeNames = [
      cleanDrugName.replace(/\s+/g, ''),  // Remove spaces
      cleanDrugName.split(' ')[0],       // First word only
      cleanDrugName.replace(/\s+/g, '_') // Underscores instead of spaces
    ];

    for (const altName of alternativeNames) {
      const altUrl = `https://www.drugs.com/${altName}.html`;
      searchAttempts.push(`Alternative URL: ${altUrl}`);
      
      try {
        console.log(`Trying alternative: ${altUrl}`);
        const response = await fetchWithRetry(altUrl, {});
        
        if (response.ok) {
          const html = await response.text();
          const drugInfo = parseHtmlForDrugInfo(html, drugName, altUrl);
          return { drugInfo, searchAttempts };
        }
      } catch (error) {
        console.log(`Alternative URL failed: ${error.message}`);
        continue;
      }
    }
  }

  return { drugInfo: null, searchAttempts };
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request
    const { drugName, options = {} } = await req.json();

    if (!drugName) {
      return createResponse({
        success: false,
        error: "Drug name is required",
        searchAttempts: [],
        processingTime: Date.now() - startTime
      }, 400);
    }

    console.log(`Starting Drugs.com search for: ${drugName}`);

    // Search for drug information
    const { drugInfo, searchAttempts } = await searchDrugInfo(drugName);

    const response: ApiResponse = {
      success: !!drugInfo,
      data: drugInfo || undefined,
      error: drugInfo ? undefined : "Drug information not found",
      searchAttempts,
      processingTime: Date.now() - startTime
    };

    if (drugInfo) {
      console.log(`Successfully found drug info for: ${drugName}`);
    } else {
      console.log(`No drug info found for: ${drugName}`);
    }

    return createResponse(response);

  } catch (error) {
    console.error('Drugs.com API error:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || "Unknown error occurred",
      searchAttempts: [],
      processingTime: Date.now() - startTime
    };

    return createResponse(response, 500);
  }
});