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
    You are a pharmaceutical identification expert. Analyze this medication image comprehensively.
    
    ANALYSIS REQUIREMENTS:
    1. Identify the medication name (brand and/or generic)
    2. Extract all visible markings, imprints, numbers, letters
    3. Describe physical characteristics (color, shape, size)
    4. Identify manufacturer if visible
    5. Determine dosage information if available
    6. Assess confidence level of identification
    
    ${contextText}
    
    Return analysis in this exact JSON format:
    {
      "name": "medication name",
      "genericName": "generic name if different",
      "imprint": "all visible markings",
      "color": "color description",
      "shape": "shape description",
      "manufacturer": "manufacturer if identifiable",
      "dosage": "dosage if visible",
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

// Stage 3: Drugs.com Data Enrichment
async function stageDrugsComEnrichment(drugName: string): Promise<ProcessingStage> {
  const startTime = Date.now();
  
  try {
    console.log(`Stage 3: Drugs.com enrichment for: ${drugName}`);
    
    if (!drugName || drugName.toLowerCase().includes('unknown')) {
      throw new Error('No valid drug name for enrichment');
    }

    const formattedDrugName = drugName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.drugs.com/${formattedDrugName}.html`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      // Try search if direct URL fails
      const searchUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(drugName)}`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!searchResponse.ok) {
        throw new Error('Failed to search drugs.com');
      }

      const searchHtml = await searchResponse.text();
      const firstResultMatch = searchHtml.match(/<a href="(\/[^"]+)" class="ddc-link-[^"]+">/);
      
      if (firstResultMatch && firstResultMatch[1]) {
        const resultUrl = `https://www.drugs.com${firstResultMatch[1]}`;
        const detailResponse = await fetch(resultUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (detailResponse.ok) {
          const html = await detailResponse.text();
          const enrichedData = parseHtmlForDrugInfo(html, drugName);
          
          return {
            name: 'drugs-com-enrichment',
            success: true,
            data: enrichedData,
            processingTime: Date.now() - startTime
          };
        }
      }
      
      throw new Error('No search results found');
    } else {
      const html = await response.text();
      const enrichedData = parseHtmlForDrugInfo(html, drugName);
      
      return {
        name: 'drugs-com-enrichment',
        success: true,
        data: enrichedData,
        processingTime: Date.now() - startTime
      };
    }

  } catch (error) {
    console.error('Drugs.com enrichment stage failed:', error);
    return {
      name: 'drugs-com-enrichment',
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
        
        if (data.confidence === 'high') combinedResult.confidence = 'high';
        else if (data.confidence === 'medium' && combinedResult.confidence === 'low') combinedResult.confidence = 'medium';
      }

      // Drugs.com enrichment data
      if (stage.name === 'drugs-com-enrichment') {
        const data = stage.data;
        combinedResult.genericName = data.genericName || combinedResult.genericName;
        combinedResult.manufacturer = data.manufacturer || combinedResult.manufacturer;
        combinedResult.category = data.category || combinedResult.category;
        combinedResult.drugClass = data.drugClass || combinedResult.drugClass;
        combinedResult.description = data.description || combinedResult.description;
        combinedResult.dosageAndAdmin = data.dosageAndAdmin || combinedResult.dosageAndAdmin;
        combinedResult.sideEffects = data.sideEffects || combinedResult.sideEffects;
        combinedResult.warnings = data.warnings || combinedResult.warnings;
        combinedResult.interactions = data.interactions || combinedResult.interactions;
        combinedResult.storage = data.storage || combinedResult.storage;
        combinedResult.mechanism = data.mechanism || combinedResult.mechanism;
        combinedResult.indications = data.indications || combinedResult.indications;
        combinedResult.contraindications = data.contraindications || combinedResult.contraindications;
        combinedResult.prescriptionStatus = data.prescriptionStatus || combinedResult.prescriptionStatus;
        combinedResult.pregnancy = data.pregnancy || combinedResult.pregnancy;
        combinedResult.brandNames = data.brandNames || combinedResult.brandNames;
        combinedResult.verified = true;
        
        if (combinedResult.confidence === 'low') combinedResult.confidence = 'medium';
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

    // Stage 3: Drugs.com Enrichment (if we have a drug name)
    const drugName = geminiStage.success ? geminiStage.data?.name : undefined;
    if (drugName && !drugName.toLowerCase().includes('unknown')) {
      const drugsComStage = await stageDrugsComEnrichment(drugName);
      stages.push(drugsComStage);
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