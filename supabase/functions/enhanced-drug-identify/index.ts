// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import "https://deno.land/x/xhr@0.1.0/mod.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrugIdentificationResult {
  success: boolean;
  data?: any;
  error?: string;
  processingStages: string[];
  confidence: 'high' | 'medium' | 'low';
  fallbackUsed: boolean;
  processingTime: number;
}

interface ProcessingStage {
  name: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  metadata?: {
    sourcesUsed?: string[];
    completeness?: number;
    searchAttempts?: string[];
  };
}

// Helper functions
function createResponse(data: any, status: number = 200): Response {
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

// Stage 1: Enhanced Text Extraction
async function stageTextExtraction(imageBase64: string): Promise<ProcessingStage> {
  const startTime = Date.now();
  
  try {
    console.log('Stage 1: Enhanced text extraction...');
    
    // Call our enhanced text extraction function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enhanced-text-extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ imageBase64 })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        name: 'text-extraction',
        success: result.success,
        data: result,
        processingTime: Date.now() - startTime
      };
    } else {
      throw new Error(`Text extraction failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Text extraction stage failed:', error);
    return {
      name: 'text-extraction',
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

// Stage 2: Gemini Vision Analysis
async function stageGeminiAnalysis(imageBase64: string, extractedText?: string): Promise<ProcessingStage> {
  const startTime = Date.now();
  
  try {
    console.log('Stage 2: Gemini vision analysis...');
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const contextText = extractedText ? `\n\nExtracted text from image: "${extractedText}"` : '';
    
    const prompt = `
    You are a pharmaceutical identification expert. Analyze this product image comprehensively.
    
    IMPORTANT: First determine if this is a pharmaceutical medication or a non-pharmaceutical product (cosmetic, lotion, supplement, etc.).
    
    ANALYSIS REQUIREMENTS:
    1. Identify the product name (brand and/or generic)
    2. Determine product type (medication, cosmetic, lotion, supplement, etc.)
    3. Extract all visible markings, imprints, numbers, letters
    4. Describe physical characteristics (color, shape, size)
    5. Identify manufacturer if visible
    6. Determine dosage/volume information if available
    7. Assess confidence level of identification
    
    ${contextText}
    
    Return analysis in this exact JSON format:
    {
      "name": "product name",
      "productType": "medication|cosmetic|lotion|supplement|other",
      "genericName": "generic name if different",
      "imprint": "all visible markings",
      "color": "color description",
      "shape": "shape description",
      "manufacturer": "manufacturer if identifiable",
      "dosage": "dosage/volume if visible",
      "confidence": "high|medium|low",
      "physicalDescription": "detailed physical description",
      "identificationNotes": "any additional notes for identification"
    }
    
    Return ONLY valid JSON, no additional text.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { 
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64
              }
            }
          ]
        }],
        generation_config: { 
          temperature: 0.1, 
          max_output_tokens: 2000 
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract JSON from response
    const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     contentText.match(/```\s*([\s\S]*?)\s*```/) ||
                     contentText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      const analysisResult = JSON.parse(jsonString);
      
      return {
        name: 'gemini-analysis',
        success: true,
        data: analysisResult,
        processingTime: Date.now() - startTime
      };
    } else {
      throw new Error('No valid JSON found in Gemini response');
    }

  } catch (error) {
    console.error('Gemini analysis stage failed:', error);
    return {
      name: 'gemini-analysis',
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

// Stage 3: Multi-Source Drug Information Enrichment
async function stageMultiSourceEnrichment(drugName: string): Promise<ProcessingStage> {
  const startTime = Date.now();
  
  try {
    console.log(`Stage 3: Multi-source enrichment for: ${drugName}`);
    
    if (!drugName || drugName.toLowerCase().includes('unknown')) {
      throw new Error('No valid drug name for enrichment');
    }

    // Call the new multi-source drug API
    const apiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/multi-source-drug-api`;
    const apiKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'apikey': apiKey
      },
      body: JSON.stringify({
        drugName: drugName,
        options: {
          includeAllSources: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Multi-source API failed: ${response.status} ${response.statusText}`);
    }

    const apiResult = await response.json();
    
    if (!apiResult.success || !apiResult.data) {
      throw new Error(apiResult.error || 'No data returned from multi-source API');
    }

    const enrichedData = apiResult.data;
    
    // Transform the comprehensive data to match our expected format
    const transformedData = {
      name: enrichedData.name || drugName,
      genericName: enrichedData.genericName || '',
      manufacturer: enrichedData.manufacturer || '',
      category: enrichedData.category || enrichedData.drugClass || '',
      drugClass: enrichedData.drugClass || enrichedData.category || '',
      description: enrichedData.description || '',
      dosageAndAdmin: enrichedData.dosageAndAdmin || '',
      sideEffects: enrichedData.sideEffects || [],
      warnings: enrichedData.warnings || [],
      interactions: enrichedData.interactions || [],
      storage: enrichedData.storage || '',
      mechanism: enrichedData.mechanism || '',
      indications: enrichedData.indications || [],
      contraindications: enrichedData.contraindications || [],
      prescriptionStatus: enrichedData.prescriptionStatus || 'Unknown',
      pregnancy: enrichedData.pregnancy || '',
      brandNames: enrichedData.brandNames || [],
      verified: enrichedData.verified || false,
      completeness: enrichedData.completeness || 0,
      sources: enrichedData.sources || {}
    };
    
    console.log(`Multi-source enrichment completed with ${enrichedData.completeness}% completeness from sources: ${apiResult.sourcesUsed?.join(', ') || 'unknown'}`);
    
    return {
      name: 'multi-source-enrichment',
      success: true,
      data: transformedData,
      processingTime: Date.now() - startTime,
      metadata: {
        sourcesUsed: apiResult.sourcesUsed || [],
        completeness: enrichedData.completeness || 0,
        searchAttempts: apiResult.searchAttempts || []
      }
    };

  } catch (error) {
    console.error('Multi-source enrichment stage failed:', error);
    return {
      name: 'multi-source-enrichment',
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

// Stage 4: Imprint Database Search (Fallback)
async function stageImprintSearch(imprint: string): Promise<ProcessingStage> {
  const startTime = Date.now();
  
  try {
    console.log(`Stage 4: Imprint search for: ${imprint}`);
    
    if (!imprint || imprint.length < 2) {
      throw new Error('No valid imprint for search');
    }

    // This would integrate with pill identification databases
    // For now, we'll simulate the search
    const searchUrl = `https://www.drugs.com/imprints.php?imprint=${encodeURIComponent(imprint)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.ok) {
      const html = await response.text();
      // Parse imprint search results
      const imprintData = parseImprintSearchResults(html);
      
      return {
        name: 'imprint-search',
        success: !!imprintData,
        data: imprintData,
        processingTime: Date.now() - startTime
      };
    } else {
      throw new Error('Imprint search failed');
    }

  } catch (error) {
    console.error('Imprint search stage failed:', error);
    return {
      name: 'imprint-search',
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

// Helper function to parse HTML for drug information
function parseHtmlForDrugInfo(html: string, drugName: string): any {
  try {
    const drugInfo: any = {
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
      drugClass: ""
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
function parseImprintSearchResults(html: string): any {
  try {
    // This would parse actual imprint search results
    // For now, return null to indicate no results
    return null;
  } catch (error) {
    console.error('Error parsing imprint results:', error);
    return null;
  }
}

// Combine results from all successful stages
function combineStageResults(stages: ProcessingStage[]): any {
  const successfulStages = stages.filter(stage => stage.success);
  
  if (successfulStages.length === 0) {
    return null;
  }

  const combinedResult: any = {
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
    processingStages: successfulStages.map(s => s.name)
  };

  // Apply data from each successful stage
  successfulStages.forEach(stage => {
    if (stage.data) {
      // Gemini analysis data
      if (stage.name === 'gemini-analysis') {
        const data = stage.data;
        combinedResult.name = data.name || combinedResult.name;
        combinedResult.genericName = data.genericName || combinedResult.genericName;
        combinedResult.imprint = data.imprint || combinedResult.imprint;
        combinedResult.color = data.color || combinedResult.color;
        combinedResult.shape = data.shape || combinedResult.shape;
        combinedResult.manufacturer = data.manufacturer || combinedResult.manufacturer;
        combinedResult.description = data.physicalDescription || data.identificationNotes || combinedResult.description;
        
        // Handle non-pharmaceutical products
        if (data.productType && data.productType !== 'medication') {
          combinedResult.category = data.productType;
          combinedResult.drugClass = data.productType;
          combinedResult.prescriptionStatus = "Non-pharmaceutical product";
          combinedResult.description = `This appears to be a ${data.productType} product: ${data.name}. ${combinedResult.description}`;
          
          // For non-pharmaceutical products, we don't need Drugs.com enrichment
          if (data.confidence === 'high') combinedResult.confidence = 'high';
          else if (data.confidence === 'medium') combinedResult.confidence = 'medium';
          
          return; // Skip Drugs.com enrichment for non-pharmaceutical products
        }
        
        if (data.confidence === 'high') combinedResult.confidence = 'high';
        else if (data.confidence === 'medium' && combinedResult.confidence === 'low') combinedResult.confidence = 'medium';
      }

      // Multi-source enrichment data with comprehensive validation
      if (stage.name === 'multi-source-enrichment') {
        const data = stage.data;
        
        // Validate and merge data with quality checks
        if (data.genericName && data.genericName.length > 2) {
          combinedResult.genericName = data.genericName;
        }
        
        if (data.manufacturer && data.manufacturer.length > 2) {
          combinedResult.manufacturer = data.manufacturer;
        }
        
        if (data.category && data.category.length > 2) {
          combinedResult.category = data.category;
        }
        
        if (data.drugClass && data.drugClass.length > 2) {
          combinedResult.drugClass = data.drugClass;
        }
        
        if (data.description && data.description.length > 20) {
          combinedResult.description = data.description;
        }
        
        if (data.dosageAndAdmin && data.dosageAndAdmin.length > 10) {
          combinedResult.dosageAndAdmin = data.dosageAndAdmin;
        }
        
        if (data.sideEffects && Array.isArray(data.sideEffects) && data.sideEffects.length > 0) {
          combinedResult.sideEffects = data.sideEffects.filter(effect => effect && effect.length > 2);
        }
        
        if (data.warnings && Array.isArray(data.warnings) && data.warnings.length > 0) {
          combinedResult.warnings = data.warnings.filter(warning => warning && warning.length > 5);
        }
        
        if (data.interactions && Array.isArray(data.interactions) && data.interactions.length > 0) {
          combinedResult.interactions = data.interactions.filter(interaction => interaction && interaction.length > 5);
        }
        
        if (data.storage && data.storage.length > 10) {
          combinedResult.storage = data.storage;
        }
        
        if (data.mechanism && data.mechanism.length > 10) {
          combinedResult.mechanism = data.mechanism;
        }
        
        if (data.indications && Array.isArray(data.indications) && data.indications.length > 0) {
          combinedResult.indications = data.indications.filter(indication => indication && indication.length > 3);
        }
        
        if (data.contraindications && Array.isArray(data.contraindications) && data.contraindications.length > 0) {
          combinedResult.contraindications = data.contraindications.filter(contraindication => contraindication && contraindication.length > 5);
        }
        
        if (data.prescriptionStatus && data.prescriptionStatus !== 'Unknown') {
          combinedResult.prescriptionStatus = data.prescriptionStatus;
        }
        
        if (data.pregnancy && data.pregnancy.length > 5) {
          combinedResult.pregnancy = data.pregnancy;
        }
        
        if (data.brandNames && Array.isArray(data.brandNames) && data.brandNames.length > 0) {
          combinedResult.brandNames = data.brandNames.filter(brand => brand && brand.length > 1);
        }
        
        // Set verification status based on completeness and data quality
        if (data.completeness && data.completeness >= 50) {
          combinedResult.verified = true;
          
          // Upgrade confidence based on completeness
          if (data.completeness >= 80 && combinedResult.confidence !== 'high') {
            combinedResult.confidence = 'high';
          } else if (data.completeness >= 50 && combinedResult.confidence === 'low') {
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

      // Imprint search data
      if (stage.name === 'imprint-search') {
        const data = stage.data;
        if (data) {
          combinedResult.name = data.name || combinedResult.name;
          combinedResult.genericName = data.genericName || combinedResult.genericName;
          combinedResult.manufacturer = data.manufacturer || combinedResult.manufacturer;
          combinedResult.verified = true;
        }
      }
    }
  });

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
    const extractedText = textExtractionStage.success ? textExtractionStage.data?.extractedText : undefined;
    const geminiStage = await stageGeminiAnalysis(imageBase64, extractedText);
    stages.push(geminiStage);

    // Stage 3: Multi-Source Enrichment (if we have a drug name and it's a pharmaceutical product)
    const drugName = geminiStage.success ? geminiStage.data?.name : undefined;
    const productType = geminiStage.success ? geminiStage.data?.productType : undefined;
    
    if (drugName && 
        !drugName.toLowerCase().includes('unknown') && 
        (!productType || productType === 'medication')) {
      const multiSourceStage = await stageMultiSourceEnrichment(drugName);
      stages.push(multiSourceStage);
    }

    // Stage 4: Imprint Search (fallback if other stages failed or low confidence)
    const hasHighConfidenceResult = stages.some(stage => 
      stage.success && stage.data?.confidence === 'high'
    );

    if (!hasHighConfidenceResult) {
      const imprint = geminiStage.success ? geminiStage.data?.imprint : 
                     textExtractionStage.success ? textExtractionStage.data?.extractedText : undefined;
      
      if (imprint) {
        const imprintStage = await stageImprintSearch(imprint);
        stages.push(imprintStage);
      }
    }

    // Combine results from all stages
    const combinedResult = combineStageResults(stages);

    if (combinedResult) {
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