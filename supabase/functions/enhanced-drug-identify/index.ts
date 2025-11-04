// @ts-expect-error - Remote Deno std HTTP import in Edge runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { checkDrugCache, saveDrugToCache } from './cache-integration';

// Narrow declaration for Deno env access when type information isn't available
declare const Deno: { env: { get: (key: string) => string | undefined } };

// Environment configuration
const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno?.env?.get('SUPABASE_ANON_KEY') ?? '';
const GEMINI_API_KEY = Deno?.env?.get('GEMINI_API_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  metadata?: {
    sourcesUsed?: string[];
    completeness?: number;
    searchAttempts?: string[];
    apiProcessingTime?: number;
  };
}

// Specific data shapes used across stages
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
  productType?: string; // medication/supplement/other
}

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

// Text extraction stage result shape
interface TextExtractionData {
  extractedText?: string;
  text?: string;
  lines?: string[];
}

// Helper functions
function createResponse(data: unknown, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function generateDrugId(): string {
  return crypto.randomUUID();
}

// Enhanced logging throughout the pipeline
async function stageTextExtraction(imageBase64: string): Promise<ProcessingStage> {
  console.log('=== STAGE: Text Extraction ===');
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
    
    console.log(`Text extraction completed in ${processingTime}ms`);
    console.log(`Extracted text: "${result.text?.substring(0, 100)}..."`);
    
    return {
      name: 'text-extraction',
      success: true,
      data: result,
      processingTime,
      error: undefined
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Text extraction failed after ${processingTime}ms:`, error);
    
    return {
      name: 'text-extraction',
      success: false,
      data: undefined,
      processingTime,
      error: error instanceof Error ? (error as Error).message : 'Unknown error'
    };
  }
}

async function stageGeminiAnalysis(imageBase64: string, _extractedText?: string): Promise<ProcessingStage> {
  console.log('=== STAGE: Gemini Analysis ===');
  const startTime = Date.now();
  
  try {
    const prompt = `You are an expert pharmaceutical analyst. Analyze this medication image with extreme attention to detail, especially for blurry or unclear images.

CRITICAL INSTRUCTIONS FOR BLURRY IMAGES:
- Even if the image is blurry, identify ANY visible markings, partial imprints, faint numbers, or obscure logos
- Make educated extrapolations based on visible patterns, shapes, and colors
- If confidence is low due to image quality, provide multiple possible drug names in the possibleNames array
- Document your analytical process and assumptions in blurryAnalysisNotes

ANALYSIS REQUIREMENTS:
1. Examine imprint/markings: Look for ANY text, numbers, logos, or symbols (even partial/faint ones)
2. Assess physical characteristics: Color, shape, size, texture, coating
3. Identify manufacturer clues: Logo shapes, distinctive markings, pill design patterns
4. Determine medication type: Tablet, capsule, liquid, etc.
5. Estimate dosage if possible from size/markings

For blurry images:
- Use context clues from partial visibility
- Consider common pharmaceutical patterns
- Provide educated guesses based on visible characteristics
- List multiple possibilities if uncertain

OUTPUT FORMAT (JSON only):
{
  "name": "Primary drug name (best guess)",
  "genericName": "Generic name if identifiable",
  "imprint": "Any visible text/numbers/symbols (even partial)",
  "color": "Dominant color(s)",
  "shape": "Physical shape description",
  "manufacturer": "Manufacturer if identifiable from markings/design",
  "confidence": "high/medium/low",
  "physicalDescription": "Detailed physical characteristics",
  "identificationNotes": "Key identifying features and reasoning",
  "possibleNames": ["Array of possible drug names if confidence is low"],
  "blurryAnalysisNotes": "Documentation of image quality challenges and analytical assumptions made",
  "productType": "medication/supplement/other"
}

Analyze the image and respond with JSON only:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const geminiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!geminiText) {
      throw new Error('No response from Gemini API');
    }

    // Parse JSON response
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);
    const processingTime = Date.now() - startTime;
    
    console.log(`Gemini analysis completed in ${processingTime}ms`);
    console.log(`Identified: ${analysisData.name} (${analysisData.confidence} confidence)`);
    console.log(`Physical: ${analysisData.color} ${analysisData.shape}, imprint: "${analysisData.imprint}"`);
    
    if (analysisData.possibleNames?.length > 0) {
      console.log(`Possible names: ${analysisData.possibleNames.join(', ')}`);
    }
    
    if (analysisData.blurryAnalysisNotes) {
      console.log(`Blurry analysis notes: ${analysisData.blurryAnalysisNotes}`);
    }

    return {
      name: 'gemini-analysis',
      success: true,
      data: analysisData,
      processingTime,
      error: undefined
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Gemini analysis failed after ${processingTime}ms:`, error);
    
    return {
      name: 'gemini-analysis',
      success: false,
      data: undefined,
      processingTime,
      error: error instanceof Error ? (error as Error).message : 'Unknown error'
    };
  }
}

async function stageMultiSourceEnrichment(drugName: string): Promise<ProcessingStage> {
  console.log('=== STAGE: Multi-Source Enrichment ===');
  console.log(`Enriching data for: ${drugName}`);
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

    if (!response.ok) {
      throw new Error(`Multi-source API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Multi-source enrichment failed');
    }

    const apiData = result.data;
    const processingTime = Date.now() - startTime;
    
    console.log(`Multi-source enrichment completed in ${processingTime}ms`);
    console.log(`Sources used: ${result.sourcesUsed?.join(', ') || 'Unknown'}`);
    console.log(`Data completeness: ${apiData.completeness || 0}%`);
    console.log(`Verified: ${apiData.verified}, Generic: ${apiData.genericName}`);

    // Transform API data to match our interface
    const transformedData = {
      name: apiData.name,
      genericName: apiData.genericName,
      manufacturer: apiData.manufacturer,
      category: apiData.category,
      drugClass: apiData.drugClass,
      description: apiData.description,
      dosageAndAdmin: apiData.dosageAndAdmin,
      sideEffects: apiData.sideEffects || [],
      warnings: apiData.warnings || [],
      interactions: apiData.interactions || [],
      storage: apiData.storage,
      mechanism: apiData.mechanism,
      indications: apiData.indications || [],
      contraindications: apiData.contraindications || [],
      prescriptionStatus: apiData.prescriptionStatus,
      pregnancy: apiData.pregnancy,
      brandNames: apiData.brandNames || [],
      completeness: apiData.completeness || 0,
      verified: apiData.verified || false
    };

    return {
      name: 'multi-source-enrichment',
      success: true,
      data: transformedData,
      processingTime,
      error: undefined,
      metadata: {
        sourcesUsed: result.sourcesUsed || [],
        searchAttempts: result.searchAttempts || [],
        apiProcessingTime: result.processingTime || 0
      }
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Multi-source enrichment failed after ${processingTime}ms:`, error);
    
    return {
      name: 'multi-source-enrichment',
      success: false,
      data: undefined,
      processingTime,
      error: error instanceof Error ? (error as Error).message : 'Unknown error'
    };
  }
}

async function stageImprintSearch(imprint: string, color?: string, shape?: string): Promise<ProcessingStage> {
  console.log('=== STAGE: Imprint Search ===');
  console.log(`Searching for imprint: "${imprint}", color: ${color || 'unknown'}, shape: ${shape || 'unknown'}`);
  const startTime = Date.now();
  
  try {
    if (!imprint || imprint.trim().length === 0) {
      throw new Error('No imprint provided for search');
    }

    // Construct search URL for drugs.com imprint search
    const searchParams = new URLSearchParams();
    searchParams.append('imprint', imprint.trim());
    if (color) searchParams.append('color', color);
    if (shape) searchParams.append('shape', shape);
    
    const searchUrl = `https://www.drugs.com/imprints.php?${searchParams.toString()}`;
    console.log(`Searching URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const drugInfo = await parseImprintSearchResults(html);
    const processingTime = Date.now() - startTime;
    
    console.log(`Imprint search completed in ${processingTime}ms`);
    
    if (drugInfo) {
      console.log(`Found drug: ${drugInfo.name} (${drugInfo.confidence} confidence)`);
      console.log(`Generic: ${drugInfo.genericName}, Manufacturer: ${drugInfo.manufacturer}`);
    } else {
      console.log('No drug information found in imprint search results');
    }

    return {
      name: 'imprint-search',
      success: !!drugInfo,
      data: drugInfo ?? undefined,
      processingTime,
      error: drugInfo ? undefined : 'No matching drugs found'
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Imprint search failed after ${processingTime}ms:`, error);
    
    return {
      name: 'imprint-search',
      success: false,
      data: undefined,
      processingTime,
      error: error instanceof Error ? (error as Error).message : 'Unknown error'
    };
  }
}

// Helper function to parse HTML for drug information
function parseHtmlForDrugInfo(html: string, drugName: string): CombinedResult | null {
  try {
    const drugInfo: CombinedResult = {
      name: drugName,
      genericName: "",
      manufacturer: "",
      category: "",
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
      drugClass: "",
      id: generateDrugId(),
      confidence: 'low',
      color: '',
      shape: '',
      imprint: '',
      verified: false,
      possibleNames: [],
      processingStages: []
    };

    // Extract generic name
    const genericMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                        html.match(/Generic Name[:\s]*([^<\n]+)/i);
    if (genericMatch) {
      drugInfo.genericName = genericMatch[1].trim();
    }

    // Extract description
    const descMatch = html.match(/<div class="contentBox"[^>]*>([\s\S]*?)<\/div>/i) ||
                     html.match(/<p class="drug-subtitle"[^>]*>([^<]+)<\/p>/i);
    if (descMatch) {
      drugInfo.description = descMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 500);
    }

    // Extract side effects
    const sideEffectsMatch = html.match(/side effects?[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i);
    if (sideEffectsMatch) {
      const sideEffectsText = sideEffectsMatch[1].replace(/<[^>]*>/g, '');
      drugInfo.sideEffects = sideEffectsText.split(/[,;.]/).map(s => s.trim()).filter(s => s.length > 3).slice(0, 10);
    }

    // Extract warnings
    const warningsMatch = html.match(/warnings?[^<]*<[^>]*>([\s\S]*?)(?:<\/(?:div|section|ul)>|<h[2-6])/i);
    if (warningsMatch) {
      const warningsText = warningsMatch[1].replace(/<[^>]*>/g, '');
      drugInfo.warnings = warningsText.split(/[.!]/).map(w => w.trim()).filter(w => w.length > 10).slice(0, 5);
    }

    return drugInfo;
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return null;
  }
}

// Helper function to parse imprint search results
function parseImprintSearchResults(html: string): ImprintSearchData | null {
  try {
    console.log('Parsing imprint search results from drugs.com...');
    
    // Initialize result object
    const result: ImprintSearchData = {
      name: "",
      genericName: "",
      manufacturer: "",
      color: "",
      shape: "",
      description: "",
      imprint: "",
      confidence: "medium"
    };

    // Pattern 1: Look for drug result containers
    const drugResultPattern = /<div[^>]*class="[^"]*ddc-result[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const drugResults = [...html.matchAll(drugResultPattern)];

    if (drugResults.length > 0) {
      // Process the first (most relevant) result
      const firstResult = drugResults[0][1];
      
      // Extract drug name from title or heading
      const namePatterns = [
        /<h[1-6][^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h[1-6]>/i,
        /<a[^>]*class="[^"]*drug-name[^"]*"[^>]*>([^<]+)<\/a>/i,
        /<strong[^>]*>([^<]+)<\/strong>/i,
        /<b[^>]*>([^<]+)<\/b>/i
      ];
      
      for (const pattern of namePatterns) {
        const match = firstResult.match(pattern);
        if (match) {
          result.name = match[1].trim();
          break;
        }
      }

      // Extract generic name
      const genericPatterns = [
        /generic[^:]*:\s*([^<\n]+)/i,
        /\(([^)]+)\)/i // Often in parentheses
      ];
      
      for (const pattern of genericPatterns) {
        const match = firstResult.match(pattern);
        if (match && match[1] !== result.name) {
          result.genericName = match[1].trim();
          break;
        }
      }

      // Extract manufacturer
      const manufacturerPatterns = [
        /manufacturer[^:]*:\s*([^<\n]+)/i,
        /by\s+([^<\n,]+)/i,
        /mfg[^:]*:\s*([^<\n]+)/i
      ];
      
      for (const pattern of manufacturerPatterns) {
        const match = firstResult.match(pattern);
        if (match) {
          result.manufacturer = match[1].trim();
          break;
        }
      }

      // Extract color information
      const colorPatterns = [
        /color[^:]*:\s*([^<\n]+)/i,
        /(white|blue|red|yellow|green|pink|orange|purple|brown|black|gray|grey)\s*(tablet|pill|capsule)?/i
      ];
      
      for (const pattern of colorPatterns) {
        const match = firstResult.match(pattern);
        if (match) {
          result.color = match[1].trim();
          break;
        }
      }

      // Extract shape information
      const shapePatterns = [
        /shape[^:]*:\s*([^<\n]+)/i,
        /(round|oval|oblong|square|rectangular|triangular|diamond|capsule|tablet)/i
      ];
      
      for (const pattern of shapePatterns) {
        const match = firstResult.match(pattern);
        if (match) {
          result.shape = match[1].trim();
          break;
        }
      }

      // Extract imprint information
      const imprintPatterns = [
        /imprint[^:]*:\s*([^<\n]+)/i,
        /marking[^:]*:\s*([^<\n]+)/i,
        /code[^:]*:\s*([^<\n]+)/i
      ];
      
      for (const pattern of imprintPatterns) {
        const match = firstResult.match(pattern);
        if (match) {
          result.imprint = match[1].trim();
          break;
        }
      }
    }

    // Pattern 2: Alternative parsing for different HTML structures
    if (!result.name) {
      // Look for pill identification results in table format
      const tableRowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const tableRows = [...html.matchAll(tableRowPattern)];
      
      for (const row of tableRows) {
        const rowContent = row[1];
        const cellPattern = /<td[^>]*>([^<]*)<\/td>/gi;
        const cells = [...rowContent.matchAll(cellPattern)];
        
        if (cells.length >= 3) {
          // Typical format: [Imprint] [Color] [Shape] [Drug Name]
          if (cells[3] && cells[3][1].trim()) {
            result.name = cells[3][1].trim();
            if (cells[0]) result.imprint = cells[0][1].trim();
            if (cells[1]) result.color = cells[1][1].trim();
            if (cells[2]) result.shape = cells[2][1].trim();
            break;
          }
        }
      }
    }

    // Pattern 3: Look for direct drug links
    if (!result.name) {
      const drugLinkPattern = /<a[^>]*href="[^"]*\/([^/]+)\.html"[^>]*>([^<]+)<\/a>/gi;
      const drugLinks = [...html.matchAll(drugLinkPattern)];
      
      if (drugLinks.length > 0) {
        result.name = drugLinks[0][2].trim();
      }
    }

    // Clean up and validate results
    if (result.name) {
      // Remove common prefixes/suffixes
      result.name = result.name.replace(/^(pill|tablet|capsule)\s+/i, '');
      result.name = result.name.replace(/\s+(pill|tablet|capsule)$/i, '');
      
      // Set confidence based on completeness
      const completeness = [result.name, result.color, result.shape, result.imprint]
        .filter(field => field && field.length > 0).length;
      
      if (completeness >= 3) {
        result.confidence = "high";
      } else if (completeness >= 2) {
        result.confidence = "medium";
      } else {
        result.confidence = "low";
      }

      console.log(`Parsed imprint result: ${result.name} (${result.confidence} confidence)`);
      return result;
    }

    console.log('No valid drug information found in imprint search results');
    return null;

  } catch (error) {
    console.error('Error parsing imprint search results:', error);
    return null;
  }
}

// Combine results from all successful stages
function combineStageResults(stages: ProcessingStage[]): CombinedResult | null {
  const successfulStages = stages.filter(stage => stage.success);
  
  if (successfulStages.length === 0) {
    return null;
  }

  console.log(`Combining results from ${successfulStages.length} successful stages: ${successfulStages.map(s => s.name).join(', ')}`);

  const combinedResult: CombinedResult = {
    id: generateDrugId(),
    name: "Unknown Medication",
    genericName: "",
    manufacturer: "",
    category: "",
    description: "",
    dosageAndAdmin: "",
    sideEffects: [],
    warnings: [],
    interactions: [],
    storage: "Store at room temperature away from moisture, heat, and light. Keep out of reach of children.",
    mechanism: "",
    indications: [],
    contraindications: [],
    prescriptionStatus: "Unknown",
    pregnancy: "",
    imprint: "",
    verified: false,
    drugClass: "",
    confidence: "low",
    color: "",
    shape: "",
    brandNames: [],
    possibleNames: [],
    processingStages: successfulStages.map(s => s.name)
  };

  // Priority-based data merging with improved logic
  let primarySource: 'multi-source' | 'gemini' | 'imprint' | null = null;
  let geminiData: GeminiAnalysisData | undefined = undefined;
  let multiSourceData: MultiSourceData | undefined = undefined;
  let imprintData: ImprintSearchData | undefined = undefined;

  // Extract data from each stage
  successfulStages.forEach(stage => {
    if (stage.name === 'gemini-analysis') geminiData = stage.data as GeminiAnalysisData;
    if (stage.name === 'multi-source-enrichment') multiSourceData = stage.data as MultiSourceData;
    if (stage.name === 'imprint-search') imprintData = stage.data as ImprintSearchData;
  });

  // Determine primary source based on confidence and completeness
  const ms = multiSourceData as MultiSourceData | undefined;
  if (ms && (ms.completeness ?? 0) >= 70) {
    primarySource = 'multi-source';
    console.log('Using multi-source as primary source (high completeness)');
  } else if ((geminiData as GeminiAnalysisData | undefined)?.confidence === 'high') {
    primarySource = 'gemini';
    console.log('Using Gemini as primary source (high confidence)');
  } else if ((imprintData as ImprintSearchData | undefined)?.confidence === 'high') {
    primarySource = 'imprint';
    console.log('Using imprint search as primary source (high confidence)');
  } else if (multiSourceData) {
    primarySource = 'multi-source';
    console.log('Using multi-source as primary source (fallback)');
  } else if (geminiData) {
    primarySource = 'gemini';
    console.log('Using Gemini as primary source (fallback)');
  } else if (imprintData) {
    primarySource = 'imprint';
    console.log('Using imprint search as primary source (fallback)');
  }

  // Apply data from each successful stage with priority-based merging
  successfulStages.forEach(stage => {
    if (stage.data) {
      // Gemini analysis data - prioritize for visual characteristics
      if (stage.name === 'gemini-analysis') {
        const data = stage.data as GeminiAnalysisData;
        
        // Always use Gemini for visual characteristics (it analyzes the actual image)
        combinedResult.imprint = data.imprint || combinedResult.imprint;
        combinedResult.color = data.color || combinedResult.color;
        combinedResult.shape = data.shape || combinedResult.shape;
        
        // Use Gemini name if high confidence or no better source
        if (data.confidence === 'high' || primarySource === 'gemini') {
          combinedResult.name = data.name || combinedResult.name;
        }
        
        // Merge possible names from Gemini
        if (data.possibleNames && Array.isArray(data.possibleNames)) {
          combinedResult.possibleNames = [...combinedResult.possibleNames, ...data.possibleNames];
        }
        
        // Use other Gemini data if primary source or no conflicts
        if (primarySource === 'gemini' || !combinedResult.genericName) {
          combinedResult.genericName = data.genericName || combinedResult.genericName;
        }
        if (primarySource === 'gemini' || !combinedResult.manufacturer) {
          combinedResult.manufacturer = data.manufacturer || combinedResult.manufacturer;
        }
        
        // Handle non-pharmaceutical products
        if (data.productType && data.productType !== 'medication') {
          combinedResult.category = data.productType;
          combinedResult.drugClass = data.productType;
          combinedResult.prescriptionStatus = "Non-pharmaceutical product";
          combinedResult.description = `This appears to be a ${data.productType} product: ${data.name}. ${data.physicalDescription || data.identificationNotes || ''}`;
          
          // For non-pharmaceutical products, set confidence based on Gemini
          combinedResult.confidence = data.confidence || 'medium';
          return; // Skip further enrichment for non-pharmaceutical products
        }
        
        // Merge physical description and notes
        const physicalInfo = [data.physicalDescription, data.identificationNotes, data.blurryAnalysisNotes]
          .filter(info => info && info.length > 5).join(' ');
        if (physicalInfo && (!combinedResult.description || combinedResult.description.length < physicalInfo.length)) {
          combinedResult.description = physicalInfo;
        }
        
        // Set base confidence from Gemini
        if (data.confidence === 'high') combinedResult.confidence = 'high';
        else if (data.confidence === 'medium' && combinedResult.confidence === 'low') combinedResult.confidence = 'medium';
      }

      // Multi-source enrichment data with softer validation
      if (stage.name === 'multi-source-enrichment') {
        const data = stage.data as MultiSourceData;
        
        console.log(`Processing multi-source data with ${data.completeness || 0}% completeness`);
        
        // Use multi-source name if it's the primary source or Gemini confidence is low
        if (primarySource === 'multi-source' || (geminiData && geminiData.confidence !== 'high')) {
          if (data.name && data.name.length > 1) {
            combinedResult.name = data.name;
          }
        }
        
        // Validate and merge data with softer validation rules
        if (data.genericName && data.genericName.length > 1) {
          combinedResult.genericName = data.genericName;
        }
        
        if (data.manufacturer && data.manufacturer.length > 1) {
          combinedResult.manufacturer = data.manufacturer;
        }
        
        if (data.category && data.category.length > 1) {
          combinedResult.category = data.category;
        }
        
        if (data.drugClass && data.drugClass.length > 1) {
          combinedResult.drugClass = data.drugClass;
        }
        
        // Softer validation for description (reduced from 20 to 10 characters)
        if (data.description && data.description.length > 10) {
          combinedResult.description = data.description;
        }
        
        // Softer validation for dosage (reduced from 10 to 5 characters)
        if (data.dosageAndAdmin && data.dosageAndAdmin.length > 5) {
          combinedResult.dosageAndAdmin = data.dosageAndAdmin;
        }
        
        // Arrays with more lenient filtering
        if (data.sideEffects && Array.isArray(data.sideEffects) && data.sideEffects.length > 0) {
          combinedResult.sideEffects = data.sideEffects.filter(effect => effect && effect.length > 1);
        }
        
        if (data.warnings && Array.isArray(data.warnings) && data.warnings.length > 0) {
          combinedResult.warnings = data.warnings.filter(warning => warning && warning.length > 3);
        }
        
        if (data.interactions && Array.isArray(data.interactions) && data.interactions.length > 0) {
          combinedResult.interactions = data.interactions.filter(interaction => interaction && interaction.length > 3);
        }
        
        if (data.storage && data.storage.length > 5) {
          combinedResult.storage = data.storage;
        }
        
        if (data.mechanism && data.mechanism.length > 5) {
          combinedResult.mechanism = data.mechanism;
        }
        
        if (data.indications && Array.isArray(data.indications) && data.indications.length > 0) {
          combinedResult.indications = data.indications.filter(indication => indication && indication.length > 2);
        }
        
        if (data.contraindications && Array.isArray(data.contraindications) && data.contraindications.length > 0) {
          combinedResult.contraindications = data.contraindications.filter(contraindication => contraindication && contraindication.length > 3);
        }
        
        if (data.prescriptionStatus && data.prescriptionStatus !== 'Unknown') {
          combinedResult.prescriptionStatus = data.prescriptionStatus;
        }
        
        if (data.pregnancy && data.pregnancy.length > 3) {
          combinedResult.pregnancy = data.pregnancy;
        }
        
        if (data.brandNames && Array.isArray(data.brandNames) && data.brandNames.length > 0) {
          const validBrandNames = data.brandNames.filter(brand => brand && brand.length > 0);
          combinedResult.brandNames = [...new Set([...combinedResult.brandNames, ...validBrandNames])];
        }
        
        // Set verification status based on completeness with lower threshold
        if (data.completeness && data.completeness >= 30) {
          combinedResult.verified = true;
          
          // Upgrade confidence based on completeness with adjusted thresholds
          if (data.completeness >= 70 && combinedResult.confidence !== 'high') {
            combinedResult.confidence = 'high';
          } else if (data.completeness >= 40 && combinedResult.confidence === 'low') {
            combinedResult.confidence = 'medium';
          }
        }
        
        // Store metadata about sources used
        if (stage.metadata && stage.metadata.sourcesUsed) {
          combinedResult.processingStages = [
            ...combinedResult.processingStages,
            ...stage.metadata.sourcesUsed.map((source: string) => `${stage.name}-${source.toLowerCase()}`)
          ];
        }
      }

      // Imprint search data - use as supplementary or fallback
      if (stage.name === 'imprint-search') {
        const data = stage.data as ImprintSearchData;
        if (data) {
          console.log(`Processing imprint search data with ${data.confidence} confidence`);
          
          // Use imprint data if it's the primary source or has high confidence
          if (primarySource === 'imprint' || data.confidence === 'high') {
            combinedResult.name = data.name || combinedResult.name;
            combinedResult.genericName = data.genericName || combinedResult.genericName;
            combinedResult.manufacturer = data.manufacturer || combinedResult.manufacturer;
            combinedResult.verified = true;
            
            // Upgrade confidence if imprint has high confidence
            if (data.confidence === 'high') {
              combinedResult.confidence = 'high';
            }
          }
          
          // Always merge visual characteristics from imprint if missing
          if (!combinedResult.color && data.color) {
            combinedResult.color = data.color;
          }
          if (!combinedResult.shape && data.shape) {
            combinedResult.shape = data.shape;
          }
          if (!combinedResult.imprint && data.imprint) {
            combinedResult.imprint = data.imprint;
          }
        }
      }
    }
  });

  // Final cleanup and validation
  combinedResult.brandNames = [...new Set(combinedResult.brandNames)]; // Remove duplicates
  combinedResult.possibleNames = [...new Set(combinedResult.possibleNames)]; // Remove duplicates
  
  // If we have possible names but no definitive name, use the first possible name
  if (combinedResult.name === "Unknown Medication" && combinedResult.possibleNames.length > 0) {
    combinedResult.name = combinedResult.possibleNames[0];
    console.log(`Using first possible name as primary: ${combinedResult.name}`);
  }

  console.log(`Final combined result: ${combinedResult.name} (${combinedResult.confidence} confidence, verified: ${combinedResult.verified})`);
  return combinedResult;
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const overallStartTime = Date.now();
  const stages: ProcessingStage[] = [];

  try {
    // Parse request
    const { imageBase64, options = {} } = await req.json();

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

    console.log('Starting enhanced drug identification pipeline...');

    // Stage 1: Text Extraction
    const textExtractionStage = await stageTextExtraction(imageBase64);
    stages.push(textExtractionStage);

    // Stage 2: Gemini Analysis
    const texData = textExtractionStage.success ? (textExtractionStage.data as TextExtractionData | undefined) : undefined;
    const extractedText = texData?.extractedText ?? texData?.text;
    const geminiStage = await stageGeminiAnalysis(imageBase64, extractedText);
    stages.push(geminiStage);

    // NEW: Check cache after Gemini analysis
    const gemData = geminiStage.success ? (geminiStage.data as GeminiAnalysisData | undefined) : undefined;
    const drugName = gemData?.name;
    const productType = gemData?.productType;
    
    // Check cache first if we have a drug name
    if (drugName && !drugName.toLowerCase().includes('unknown')) {
      console.log(`🔍 Checking cache for: ${drugName}`);
      const cachedDrug = await checkDrugCache(drugName);
      
      if (cachedDrug) {
        console.log(`✅ Cache HIT! Returning cached data for ${drugName}`);
        const result: DrugIdentificationResult = {
          success: true,
          data: cachedDrug,
          processingStages: ['text-extraction', 'gemini-analysis', 'cache-hit'],
          confidence: cachedDrug.confidence as 'high' | 'medium' | 'low',
          fallbackUsed: false,
          processingTime: Date.now() - overallStartTime
        };
        return createResponse(result);
      }
      console.log(`❌ Cache miss, continuing with API enrichment...`);
    }

    // Stage 3: Multi-Source Enrichment (if we have a drug name and it's a pharmaceutical product)
    
    if (drugName && 
        !drugName.toLowerCase().includes('unknown') && 
        (!productType || productType === 'medication')) {
      const multiSourceStage = await stageMultiSourceEnrichment(drugName);
      stages.push(multiSourceStage);
    }

    // Stage 4: Imprint Search (fallback if other stages failed or low confidence)
    const hasHighConfidenceResult = stages.some(stage => {
      if (!stage.success || !stage.data) return false;
      const d = stage.data as { confidence?: 'high' | 'medium' | 'low' };
      return d.confidence === 'high';
    });

    if (!hasHighConfidenceResult) {
      const imprint = gemData?.imprint ?? extractedText;
      
      if (imprint) {
        const imprintStage = await stageImprintSearch(imprint);
        stages.push(imprintStage);
      }
    }

    // Combine results from all stages
    const combinedResult = combineStageResults(stages);

    if (combinedResult) {
      // NEW: Save successful identification to cache (async, don't block response)
      if (combinedResult.name && combinedResult.name !== 'Unknown Medication' && !combinedResult.name.toLowerCase().includes('unknown')) {
        console.log(`💾 Saving ${combinedResult.name} to cache...`);
        saveDrugToCache(combinedResult).catch(err => 
          console.error('⚠️ Cache save failed (non-critical):', err)
        );
      }
      
      const result: DrugIdentificationResult = {
        success: true,
        data: combinedResult,
        processingStages: stages.map(s => s.name),
        confidence: combinedResult.confidence,
        fallbackUsed: stages.some(s => s.name === 'imprint-search' && s.success),
        processingTime: Date.now() - overallStartTime
      };

      console.log(`Drug identification completed: ${combinedResult.name} (${result.confidence} confidence)`);
      return createResponse(result);
    } else {
      // All stages failed
      const result: DrugIdentificationResult = {
        success: false,
        error: "Unable to identify medication from image",
        processingStages: stages.map(s => s.name),
        confidence: 'low',
        fallbackUsed: true,
        processingTime: Date.now() - overallStartTime
      };

      return createResponse(result);
    }

  } catch (error) {
    console.error('Enhanced drug identification error:', error);
    
    const result: DrugIdentificationResult = {
      success: false,
      error: error.message || "Unknown error occurred",
      processingStages: stages.map(s => s.name),
      confidence: 'low',
      fallbackUsed: false,
      processingTime: Date.now() - overallStartTime
    };

    return createResponse(result, 500);
  }
});