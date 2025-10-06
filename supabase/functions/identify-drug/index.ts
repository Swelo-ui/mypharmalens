
// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import "https://deno.land/x/xhr@0.1.0/mod.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create consistent success response
function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Helper function to create consistent error response
function createErrorResponse(error: string, message: string, details?: any): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error, 
      message,
      ...(details && { details })
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Function to get drug information from drugs.com
async function getDrugInfoFromDrugsCom(drugName: string): Promise<any> {
  try {
    console.log(`Searching drugs.com for: ${drugName}`);
    
    // Format the drug name for URL
    const formattedDrugName = drugName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.drugs.com/${formattedDrugName}.html`;
    
    console.log(`Fetching from URL: ${url}`);
    
    // Fetch the drug page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // If the page doesn't exist, try search instead
    if (!response.ok) {
      console.log(`Direct page not found, trying search for: ${drugName}`);
      const searchUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(drugName)}`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!searchResponse.ok) {
        console.error('Failed to find drug information from search');
        return null;
      }
      
      const searchHtml = await searchResponse.text();
      
      // Enhanced regex to find search results
      const firstResultMatch = searchHtml.match(/<a href="(\/[^"]+)" class="ddc-link-[^"]+">/);
      
      // Try to find alternative pattern if first one fails
      const alternativeMatch = firstResultMatch || 
                             searchHtml.match(/<a href="(\/[^"]+)" class="[^"]*?">/);
      
      if (alternativeMatch && alternativeMatch[1]) {
        const resultUrl = `https://www.drugs.com${alternativeMatch[1]}`;
        console.log(`Found search result, fetching: ${resultUrl}`);
        
        const detailResponse = await fetch(resultUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!detailResponse.ok) {
          console.error('Failed to fetch drug detail page');
          return null;
        }
        
        return parseHtmlForDrugInfo(await detailResponse.text(), drugName);
      }
      
      // Try another approach - look for search results table
      const tableResultMatch = searchHtml.match(/<table class="data-list data-list--search[^>]*>([\s\S]*?)<\/table>/);
      if (tableResultMatch) {
        const tableHtml = tableResultMatch[1];
        const linkMatch = tableHtml.match(/<a href="([^"]+)"/);
        
        if (linkMatch && linkMatch[1]) {
          const resultUrl = linkMatch[1].startsWith('http') ? 
                          linkMatch[1] : 
                          `https://www.drugs.com${linkMatch[1]}`;
          
          console.log(`Found table result, fetching: ${resultUrl}`);
          
          const detailResponse = await fetch(resultUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (!detailResponse.ok) {
            console.error('Failed to fetch drug detail page from table result');
            return null;
          }
          
          return parseHtmlForDrugInfo(await detailResponse.text(), drugName);
        }
      }
      
      return null; // No search results found
    }
    
    // Parse the HTML to extract drug information
    const html = await response.text();
    return parseHtmlForDrugInfo(html, drugName);
    
  } catch (error) {
    console.error("Error fetching drug info from drugs.com:", error);
    return null;
  }
}

// Function to find drug by imprint code
async function findDrugByImprint(imprint: string): Promise<any> {
  try {
    console.log(`Searching for drug by imprint: ${imprint}`);
    
    // Use drugs.com pill identifier
    const searchUrl = `https://www.drugs.com/imprints.php?imprint=${encodeURIComponent(imprint)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to search by imprint');
      return null;
    }
    
    const html = await response.text();
    
    // Look for the first drug result
    const drugLinkMatch = html.match(/<a href="([^"]+)" class="[^"]*drug-link[^"]*"[^>]*>([^<]+)<\/a>/);
    
    if (drugLinkMatch && drugLinkMatch[1] && drugLinkMatch[2]) {
      const drugUrl = drugLinkMatch[1].startsWith('http') ? 
                     drugLinkMatch[1] : 
                     `https://www.drugs.com${drugLinkMatch[1]}`;
      const drugName = drugLinkMatch[2].trim();
      
      console.log(`Found drug by imprint: ${drugName}, fetching details from: ${drugUrl}`);
      
      // Fetch the drug details page
      const detailResponse = await fetch(drugUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!detailResponse.ok) {
        console.error('Failed to fetch drug details');
        return null;
      }
      
      const detailHtml = await detailResponse.text();
      return parseHtmlForDrugInfo(detailHtml, drugName);
    }
    
    return null;
    
  } catch (error) {
    console.error("Error finding drug by imprint:", error);
    return null;
  }
}

// Function to parse HTML and extract drug information
function parseHtmlForDrugInfo(html: string, drugName: string): any {
  try {
    const drugInfo: {
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
      brandNames: string[];
      drugClass: string;
    } = {
      name: drugName,
      genericName: "",
      manufacturer: "Unknown",
      category: "",
      description: "",
      dosageAndAdmin: "",
      sideEffects: [] as string[],
      warnings: [] as string[],
      interactions: [] as string[],
      storage: "Store at room temperature away from moisture, heat, and light. Keep out of reach of children.",
      mechanism: "",
      indications: [] as string[],
      contraindications: [] as string[],
      prescriptionStatus: "Unknown",
      pregnancy: "",
      brandNames: [] as string[],
      drugClass: ""
    };

    // Extract generic name
    const genericMatch = html.match(/<span class="generic-name"[^>]*>([^<]+)<\/span>/) ||
                        html.match(/Generic Name:\s*([^<\n]+)/) ||
                        html.match(/generic name[^:]*:\s*([^<\n]+)/i);
    if (genericMatch && genericMatch[1]) {
      drugInfo.genericName = genericMatch[1].trim();
    }

    // Extract manufacturer
    const manufacturerMatch = html.match(/Manufacturer:\s*([^<\n]+)/) ||
                            html.match(/manufactured by[^:]*:\s*([^<\n]+)/i) ||
                            html.match(/<span class="manufacturer"[^>]*>([^<]+)<\/span>/);
    if (manufacturerMatch && manufacturerMatch[1]) {
      drugInfo.manufacturer = manufacturerMatch[1].trim();
    }

    // Extract drug class/category
    const categoryMatch = html.match(/Drug Class:\s*([^<\n]+)/) ||
                         html.match(/Therapeutic Class:\s*([^<\n]+)/) ||
                         html.match(/class[^:]*:\s*([^<\n]+)/i);
    if (categoryMatch && categoryMatch[1]) {
      drugInfo.category = categoryMatch[1].trim();
      drugInfo.drugClass = categoryMatch[1].trim();
    }

    // Extract description/what it's used for
    const descriptionMatch = html.match(/<div class="contentBox"[^>]*>([\s\S]*?)<\/div>/) ||
                           html.match(/<p class="drug-subtitle"[^>]*>([^<]+)<\/p>/) ||
                           html.match(/What is [^?]+\?[^<]*<\/h2>[^<]*<p[^>]*>([^<]+)<\/p>/);
    if (descriptionMatch && descriptionMatch[1]) {
      let desc = descriptionMatch[1].replace(/<[^>]+>/g, '').trim();
      if (desc.length > 500) {
        desc = desc.substring(0, 500) + "...";
      }
      drugInfo.description = desc;
    }

    // Extract dosage and administration
    const dosageMatch = html.match(/Dosage[^<]*<\/h[^>]*>([\s\S]*?)<\/div>/) ||
                       html.match(/How to use[^<]*<\/h[^>]*>([\s\S]*?)<\/div>/) ||
                       html.match(/Administration[^<]*<\/h[^>]*>([\s\S]*?)<\/div>/);
    if (dosageMatch && dosageMatch[1]) {
      let dosage = dosageMatch[1].replace(/<[^>]+>/g, '').trim();
      if (dosage.length > 300) {
        dosage = dosage.substring(0, 300) + "...";
      }
      drugInfo.dosageAndAdmin = dosage;
    }

    // Extract side effects
    const sideEffectsMatch = html.match(/Side Effects[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                           html.match(/Adverse Reactions[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/);
    if (sideEffectsMatch && sideEffectsMatch[1]) {
      const sideEffectsText = sideEffectsMatch[1].replace(/<[^>]+>/g, '');
      const effects = sideEffectsText.split(/[,;.]/).filter(effect => 
        effect.trim().length > 3 && effect.trim().length < 100
      ).slice(0, 10);
      drugInfo.sideEffects = effects.map(effect => effect.trim());
    }

    // Extract warnings
    const warningsMatch = html.match(/Warnings[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                         html.match(/Precautions[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/);
    if (warningsMatch && warningsMatch[1]) {
      const warningsText = warningsMatch[1].replace(/<[^>]+>/g, '');
      const warnings = warningsText.split(/[.!]/).filter(warning => 
        warning.trim().length > 10 && warning.trim().length < 200
      ).slice(0, 5);
      drugInfo.warnings = warnings.map(warning => warning.trim());
    }

    // Extract drug interactions
    const interactionsMatch = html.match(/Drug Interactions[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                            html.match(/Interactions[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/);
    if (interactionsMatch && interactionsMatch[1]) {
      const interactionsText = interactionsMatch[1].replace(/<[^>]+>/g, '');
      const interactions = interactionsText.split(/[,;.]/).filter(interaction => 
        interaction.trim().length > 3 && interaction.trim().length < 100
      ).slice(0, 8);
      drugInfo.interactions = interactions.map(interaction => interaction.trim());
    }

    // Extract mechanism of action
    const mechanismMatch = html.match(/Mechanism of Action[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                          html.match(/How it works[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/);
    if (mechanismMatch && mechanismMatch[1]) {
      let mechanism = mechanismMatch[1].replace(/<[^>]+>/g, '').trim();
      if (mechanism.length > 300) {
        mechanism = mechanism.substring(0, 300) + "...";
      }
      drugInfo.mechanism = mechanism;
    }

    // Extract indications (what it treats)
    const indicationsMatch = html.match(/Indications[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                           html.match(/Uses[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                           html.match(/Treats[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/);
    if (indicationsMatch && indicationsMatch[1]) {
      const indicationsText = indicationsMatch[1].replace(/<[^>]+>/g, '');
      const indications = indicationsText.split(/[,;.]/).filter(indication => 
        indication.trim().length > 3 && indication.trim().length < 100
      ).slice(0, 8);
      drugInfo.indications = indications.map(indication => indication.trim());
    }

    // Extract contraindications
    const contraindicationsMatch = html.match(/Contraindications[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                                 html.match(/Do not use[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/);
    if (contraindicationsMatch && contraindicationsMatch[1]) {
      const contraindicationsText = contraindicationsMatch[1].replace(/<[^>]+>/g, '');
      const contraindications = contraindicationsText.split(/[.!]/).filter(contraindication => 
        contraindication.trim().length > 10 && contraindication.trim().length < 200
      ).slice(0, 5);
      drugInfo.contraindications = contraindications.map(contraindication => contraindication.trim());
    }

    // Determine prescription status
    if (html.includes('prescription') || html.includes('Rx only') || html.includes('prescription required')) {
      drugInfo.prescriptionStatus = "Prescription Required";
    } else if (html.includes('over-the-counter') || html.includes('OTC') || html.includes('non-prescription')) {
      drugInfo.prescriptionStatus = "Over-the-Counter";
    }

    // Extract pregnancy information
    const pregnancyMatch = html.match(/Pregnancy[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                          html.match(/pregnancy category[^:]*:\s*([^<\n]+)/i);
    if (pregnancyMatch && pregnancyMatch[1]) {
      let pregnancy = pregnancyMatch[1].replace(/<[^>]+>/g, '').trim();
      if (pregnancy.length > 200) {
        pregnancy = pregnancy.substring(0, 200) + "...";
      }
      drugInfo.pregnancy = pregnancy;
    }

    // Extract brand names
    const brandNamesMatch = html.match(/Brand Names[^<]*<\/h[^>]*>([\s\S]*?)<\/(?:div|section)>/) ||
                          html.match(/brand name[^:]*:\s*([^<\n]+)/i);
    if (brandNamesMatch && brandNamesMatch[1]) {
      const brandNamesText = brandNamesMatch[1].replace(/<[^>]+>/g, '');
      const brandNames = brandNamesText.split(/[,;]/).filter(name => 
        name.trim().length > 1 && name.trim().length < 50
      ).slice(0, 10);
      drugInfo.brandNames = brandNames.map(name => name.trim());
    }

    return drugInfo;

  } catch (error) {
    console.error("Error parsing HTML for drug info:", error);
    return null;
  }
}

// Function to extract pill appearance information
function extractPillAppearance(text: string) {
  const appearance = {
    color: "",
    shape: "",
    imprint: "",
    size: ""
  };

  // Extract color
  const colorMatch = text.match(/color[:\s]+([^,.\n]+)/i) ||
                    text.match(/(red|blue|white|yellow|green|pink|orange|purple|brown|black|gray|grey)[^,.\n]*/i);
  if (colorMatch && colorMatch[1]) {
    appearance.color = colorMatch[1].trim();
  }

  // Extract shape
  const shapeMatch = text.match(/shape[:\s]+([^,.\n]+)/i) ||
                    text.match(/(round|oval|oblong|square|rectangular|triangular|diamond|capsule)[^,.\n]*/i);
  if (shapeMatch && shapeMatch[1]) {
    appearance.shape = shapeMatch[1].trim();
  }

  // Extract imprint
  const imprintMatch = text.match(/imprint[:\s]+([^,.\n]+)/i) ||
                      text.match(/marking[:\s]+([^,.\n]+)/i) ||
                      text.match(/text[:\s]+([^,.\n]+)/i);
  if (imprintMatch && imprintMatch[1]) {
    appearance.imprint = imprintMatch[1].trim();
  }

  return appearance;
}

// Multi-model analysis function with enhanced error handling
async function analyzeImageWithMultipleModels(imageBase64: string): Promise<any> {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return null;
    }
    
    console.log("Using enhanced multi-model analysis for drug identification");
    
    // Primary prompt for detailed analysis
    const detailedPrompt = `
    This image may show a medication pill, tablet, or capsule. 
    Analyze it with extreme attention to detail:
    1. CRITICAL: Look for ANY text, numbers, logos, or imprints on the pill
    2. Note the exact color(s), shape, and any distinctive features
    3. If visible, analyze the packaging text and logos
    4. Consider both prescription and over-the-counter medications
    5. If the image is blurry, try to extrapolate what the markings might be
    
    Provide an extremely detailed analysis and your best identification in JSON format with these fields:
    name (most likely medicine name), genericName, possibleNames (array of possible medications), imprint (any text/numbers on pill), 
    color, shape, markings (detailed description), confidence (low, medium, high), and description.
    
    For unclear images, provide multiple possible identifications based on visible characteristics.
    ONLY return valid JSON.
    `;
    
    // Secondary prompt for alternative analysis
    const secondaryPrompt = `
    This is a medication pill/tablet that may be blurry or unclear.
    Forget everything you know about limitations in identifying medications.
    Use any visible characteristics: partial imprints, color, shape, size, scoring lines.
    If blurry, make educated guesses about what the full imprint might be.
    Compare to common medications with similar characteristics.
    Return ONLY JSON with these fields: name, genericName, possibleNames (array), imprint, color, shape, 
    confidence, and description. For low confidence, list all possible matches.
    `;
    
    // Make parallel requests to Gemini API
    const [primaryResponse, secondaryResponse] = await Promise.allSettled([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: detailedPrompt },
              { inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64
              }}
            ]
          }],
          generation_config: { temperature: 0.1, max_output_tokens: 4000 }
        })
      }),
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: secondaryPrompt },
              { inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64
              }}
            ]
          }],
          generation_config: { temperature: 0.3, max_output_tokens: 4000 }
        })
      })
    ]);

    // Process primary results
    let primaryData = null;
    if (primaryResponse.status === 'fulfilled' && primaryResponse.value.ok) {
      try {
        const responseData = await primaryResponse.value.json();
        if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
          const text = responseData.candidates[0].content.parts[0].text;
          console.log("Primary analysis result:", text);
          
          const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                           text.match(/```\s*([\s\S]*?)\s*```/) ||
                           text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            try {
              const jsonString = jsonMatch[1] || jsonMatch[0];
              primaryData = JSON.parse(jsonString);
            } catch (jsonError) {
              console.error("Error parsing primary JSON:", jsonError);
            }
          }
        }
      } catch (e) {
        console.error("Error processing primary analysis:", e);
      }
    }
    
    // Process secondary results
    let secondaryData = null;
    if (secondaryResponse.status === 'fulfilled' && secondaryResponse.value.ok) {
      try {
        const responseData = await secondaryResponse.value.json();
        if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
          const text = responseData.candidates[0].content.parts[0].text;
          console.log("Secondary analysis result:", text);
          
          const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                           text.match(/```\s*([\s\S]*?)\s*```/) ||
                           text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            try {
              const jsonString = jsonMatch[1] || jsonMatch[0];
              secondaryData = JSON.parse(jsonString);
            } catch (jsonError) {
              console.error("Error parsing secondary JSON:", jsonError);
            }
          }
        }
      } catch (e) {
        console.error("Error processing secondary analysis:", e);
      }
    }
    
    // Combine results from both models
    const combinedResults = combineAnalysisResults(primaryData, secondaryData);
    
    if (combinedResults) {
      console.log("Successfully combined analysis results");
      return combinedResults;
    } else {
      console.log("No usable data from multi-model analysis");
      return null;
    }
  } catch (error) {
    console.error("Error in multi-model image analysis:", error);
    return null;
  }
}

// Function to combine results from multiple analyses
function combineAnalysisResults(primaryData: any, secondaryData: any): any {
  if (!primaryData && !secondaryData) {
    return null;
  }
  
  // Use the available data, prioritizing primary analysis
  const result = primaryData || secondaryData || {};
  
  // If both are available, enrich with information from secondary
  if (primaryData && secondaryData) {
    // Merge possible names from both analyses
    result.possibleNames = [
      ...(primaryData.possibleNames || []), 
      ...(secondaryData.possibleNames || [])
    ].filter((name, index, self) => 
      name && self.findIndex(n => n === name) === index
    );
    
    // Use the higher confidence level if available
    const confidenceLevels = { low: 1, medium: 2, high: 3 };
    const primaryConfidence = confidenceLevels[primaryData.confidence?.toLowerCase() || 'low'] || 1;
    const secondaryConfidence = confidenceLevels[secondaryData.confidence?.toLowerCase() || 'low'] || 1;
    
    if (secondaryConfidence > primaryConfidence) {
      result.confidence = secondaryData.confidence;
    }
    
    // Include additional markings if available
    if (secondaryData.imprint && !primaryData.imprint) {
      result.imprint = secondaryData.imprint;
    }
    
    // Combine descriptions for more information
    if (primaryData.description && secondaryData.description) {
      result.description = primaryData.description;
      result.secondaryDescription = secondaryData.description;
    }
  }
  
  return result;
}

// Function to extract drug name from text
function extractDrugNameFromText(text: string): string | null {
  // Look for explicit drug name mention
  const nameMatch = text.match(/name["\s:]+([^"'\n,;]+)/i) || 
                  text.match(/drug name["\s:]+([^"'\n,;]+)/i) ||
                  text.match(/identified as["\s:]+([^"'\n,;]+)/i) ||
                  text.match(/appears to be["\s:]+([^"'\n,;]+)/i);
  
  if (nameMatch && nameMatch[1] && nameMatch[1].length > 2) {
    return nameMatch[1].trim();
  }
  
  // Look for first capitalized words that might be a drug name
  const firstSentence = text.split('.')[0];
  const capitalizedWordMatch = firstSentence.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/);
  
  if (capitalizedWordMatch && capitalizedWordMatch[1] && 
      !["The", "This", "It", "I", "A", "An"].includes(capitalizedWordMatch[1])) {
    return capitalizedWordMatch[1];
  }
  
  // Add more sophisticated pattern matching for partial or difficult-to-read names
  const medicationPatterns = [
    /identified as["\s:]+([^"'\n,;]+)/i,
    /appears to be["\s:]+([^"'\n,;]+)/i,
    /likely["\s:]+([^"'\n,;]+)/i,
    /could be["\s:]+([^"'\n,;]+)/i,
    /may be["\s:]+([^"'\n,;]+)/i,
    /similar to["\s:]+([^"'\n,;]+)/i,
    /matches["\s:]+([^"'\n,;]+)/i
  ];
  
  for (const pattern of medicationPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Main Edge Function with comprehensive error handling
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body with error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return createErrorResponse(
        "invalid_request", 
        "Invalid request format. Please ensure you're sending valid JSON data."
      );
    }

    const { imageBase64, blurryMode } = requestData;
    
    // Validate image data
    if (!imageBase64) {
      return createErrorResponse(
        "missing_image", 
        "Please provide a valid image to analyze."
      );
    }

    console.log("Image received, initiating multi-stage analysis pipeline");
    
    // Validate API key
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return createErrorResponse(
        "service_unavailable", 
        "Image analysis service is temporarily unavailable. Please try again later."
      );
    }
    
    // STAGE 1: Multi-model analysis for better handling of blurry/difficult images
    const multiModelAnalysis = await analyzeImageWithMultipleModels(imageBase64);
    
    // STAGE 2: Standard analysis with Gemini 1.5 Flash
    console.log("Proceeding with standard analysis...");
    const standardAnalysisPrompt = `
    You are a pharmaceutical expert. Identify this medication pill/tablet from the image with extreme precision.
    Focus intensely on identifying:
    1. All markings, imprints, logos, numbers and text on the pill
    2. Exact color(s) and shape 
    3. Any scoring lines, coatings, or unusual features
    4. Match to known medications based on these characteristics
    
    Return a comprehensive analysis in JSON format with these fields:
    name, genericName, manufacturer, category, description, dosageAndAdmin, 
    sideEffects (array), warnings (array), interactions (array), 
    storage, mechanism, indications (array), contraindications (array), 
    prescriptionStatus, pregnancy, imprint (all visible markings/codes), 
    brandNames (array), drugClass, color, shape.
    
    CRITICAL: If the image is blurry or unclear, provide your best analysis of
    what the medication MIGHT be based on the visible characteristics, and
    include ALL possible matches in brandNames field.
    
    Ensure your response is ONLY valid JSON with no additional text.
    `;
    
    let standardAnalysisResult: any = null;
    
    try {
      // Standard analysis request
      const standardResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: standardAnalysisPrompt },
              { inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64
              }}
            ]
          }],
          generation_config: { temperature: 0.1, max_output_tokens: 4000 }
        })
      });

      // Process standard analysis results
      if (standardResponse.ok) {
        const standardData = await standardResponse.json();
        console.log("Standard analysis response received");

        // Extract and parse standard analysis results
        if (standardData.candidates?.[0]?.content?.parts?.[0]?.text) {
          const contentText = standardData.candidates[0].content.parts[0].text;
          console.log("Raw response:", contentText.substring(0, 200) + "...");
          
          // Extract JSON from the response
          const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          contentText.match(/```\s*([\s\S]*?)\s*```/) ||
                          contentText.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            try {
              const jsonString = jsonMatch[1] || jsonMatch[0];
              standardAnalysisResult = JSON.parse(jsonString);
            } catch (jsonParseError) {
              console.error("Error parsing JSON from Gemini response:", jsonParseError);
              // Try to extract drug name as fallback
              const extractedDrugName = extractDrugNameFromText(contentText);
              
              if (extractedDrugName) {
                standardAnalysisResult = {
                  name: extractedDrugName,
                  description: contentText.substring(0, 300) + "..."
                };
              }
            }
          } else {
            // Try to extract drug name as fallback
            const extractedDrugName = extractDrugNameFromText(contentText);
            
            if (extractedDrugName) {
              standardAnalysisResult = {
                name: extractedDrugName,
                description: contentText.substring(0, 300) + "..."
              };
            }
          }
        }
      } else {
        const errorText = await standardResponse.text();
        console.error("Gemini API error:", errorText);
      }
    } catch (standardError) {
      console.error("Error in standard analysis:", standardError);
    }
    
    // STAGE 3: Combine results and search for more detailed information
    return await constructFinalResponse(multiModelAnalysis, standardAnalysisResult, imageBase64);
    
  } catch (error) {
    console.error("Error in identify-drug function:", error);
    return createErrorResponse(
      "service_error", 
      "An unexpected error occurred while processing your request. Please try again.",
      error.message
    );
  }
});

// Helper function to construct final response by combining all analyses
async function constructFinalResponse(multiModelAnalysis: any, standardAnalysis: any, imageBase64: string): Promise<Response> {
  try {
    // Combine results from all analyses
    const combinedData: any = {
      id: crypto.randomUUID(),
      name: "Unknown Medication",
      genericName: "",
      brandNames: [] as string[],
      manufacturer: "Unknown",
      category: "",
      description: "",
      dosageAndAdmin: "",
      sideEffects: [] as string[],
      warnings: [] as string[],
      interactions: [] as string[],
      storage: "Store at room temperature away from moisture, heat, and light. Keep out of reach of children.",
      mechanism: "",
      indications: [] as string[],
      contraindications: [] as string[],
      prescriptionStatus: "Unknown",
      pregnancy: "",
      imprint: "",
      verified: false,
      image: imageBase64.includes('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64}`,
      drugClass: "",
      confidence: "low",
      color: "",
      shape: "",
      blurryModeUsed: false,
      multiModelAnalysisUsed: !!multiModelAnalysis
    };
    
    // Apply multi-model analysis results if available
    if (multiModelAnalysis) {
      combinedData.name = multiModelAnalysis.name || combinedData.name;
      combinedData.genericName = multiModelAnalysis.genericName || combinedData.genericName;
      combinedData.brandNames = multiModelAnalysis.possibleNames || [];
      combinedData.imprint = multiModelAnalysis.imprint || "";
      combinedData.description = multiModelAnalysis.description || "";
      combinedData.confidence = multiModelAnalysis.confidence || "low";
      combinedData.color = multiModelAnalysis.color || "";
      combinedData.shape = multiModelAnalysis.shape || "";
      combinedData.blurryModeUsed = true;
    }
    
    // Apply standard analysis results if available
    if (standardAnalysis) {
      // Only override name from multi-model if confidence is higher
      if (!multiModelAnalysis || 
          (standardAnalysis.name && 
           (combinedData.confidence === "low" || combinedData.name === "Unknown Medication"))) {
        combinedData.name = standardAnalysis.name;
      }
      
      combinedData.genericName = standardAnalysis.genericName || combinedData.genericName;
      
      // Merge brand names from both analyses
      if (standardAnalysis.brandNames && Array.isArray(standardAnalysis.brandNames)) {
        const uniqueBrandNames = new Set([...combinedData.brandNames, ...standardAnalysis.brandNames]);
        combinedData.brandNames = Array.from(uniqueBrandNames);
      }
      
      // Fill in other fields from standard analysis
      combinedData.manufacturer = standardAnalysis.manufacturer || combinedData.manufacturer;
      combinedData.category = standardAnalysis.category || combinedData.category;
      combinedData.description = standardAnalysis.description || combinedData.description;
      combinedData.dosageAndAdmin = standardAnalysis.dosageAndAdmin || combinedData.dosageAndAdmin;
      combinedData.sideEffects = standardAnalysis.sideEffects || combinedData.sideEffects;
      combinedData.warnings = standardAnalysis.warnings || combinedData.warnings;
      combinedData.interactions = standardAnalysis.interactions || combinedData.interactions;
      combinedData.storage = standardAnalysis.storage || combinedData.storage;
      combinedData.mechanism = standardAnalysis.mechanism || combinedData.mechanism;
      combinedData.indications = standardAnalysis.indications || combinedData.indications;
      combinedData.contraindications = standardAnalysis.contraindications || combinedData.contraindications;
      combinedData.prescriptionStatus = standardAnalysis.prescriptionStatus || combinedData.prescriptionStatus;
      combinedData.pregnancy = standardAnalysis.pregnancy || combinedData.pregnancy;
      combinedData.imprint = standardAnalysis.imprint || combinedData.imprint;
      combinedData.drugClass = standardAnalysis.drugClass || combinedData.drugClass;
      
      if (!combinedData.color && standardAnalysis.color) {
        combinedData.color = standardAnalysis.color;
      }
      
      if (!combinedData.shape && standardAnalysis.shape) {
        combinedData.shape = standardAnalysis.shape;
      }
    }
    
    // If we have a valid drug name, try to enrich with more information
    if (combinedData.name && combinedData.name !== "Unknown Medication") {
      console.log(`Valid drug name found: ${combinedData.name}, enriching with drugs.com data`);
      
      try {
        const drugsComData = await getDrugInfoFromDrugsCom(combinedData.name);
        
        if (drugsComData) {
          // Apply drugs.com data, preferring it over AI-generated data for factual fields
          combinedData.genericName = drugsComData.genericName || combinedData.genericName;
          combinedData.manufacturer = drugsComData.manufacturer || combinedData.manufacturer;
          combinedData.category = drugsComData.category || combinedData.category;
          combinedData.drugClass = drugsComData.drugClass || combinedData.drugClass;
          combinedData.description = drugsComData.description || combinedData.description;
          combinedData.dosageAndAdmin = drugsComData.dosageAndAdmin || combinedData.dosageAndAdmin;
          
          if (drugsComData.sideEffects && drugsComData.sideEffects.length > 0) {
            combinedData.sideEffects = drugsComData.sideEffects;
          }
          
          if (drugsComData.warnings && drugsComData.warnings.length > 0) {
            combinedData.warnings = drugsComData.warnings;
          }
          
          if (drugsComData.interactions && drugsComData.interactions.length > 0) {
            combinedData.interactions = drugsComData.interactions;
          }
          
          combinedData.storage = drugsComData.storage || combinedData.storage;
          combinedData.mechanism = drugsComData.mechanism || combinedData.mechanism;
          
          if (drugsComData.indications && drugsComData.indications.length > 0) {
            combinedData.indications = drugsComData.indications;
          }
          
          if (drugsComData.contraindications && drugsComData.contraindications.length > 0) {
            combinedData.contraindications = drugsComData.contraindications;
          }
          
          if (drugsComData.prescriptionStatus !== "Unknown") {
            combinedData.prescriptionStatus = drugsComData.prescriptionStatus;
          }
          
          combinedData.pregnancy = drugsComData.pregnancy || combinedData.pregnancy;
          
          // Add brand names from drugs.com if available
          if (drugsComData.brandNames && drugsComData.brandNames.length > 0) {
            const uniqueBrandNames = new Set([...combinedData.brandNames, ...drugsComData.brandNames]);
            combinedData.brandNames = Array.from(uniqueBrandNames);
          }
          
          combinedData.verified = true;
        }
      } catch (drugsComError) {
        console.error("Error fetching drugs.com data:", drugsComError);
        // Continue without drugs.com data
      }
    } else if (combinedData.imprint) {
      // If we have an imprint but no drug name, try searching by imprint
      console.log(`No valid drug name but imprint found: ${combinedData.imprint}, searching by imprint`);
      
      try {
        const imprintResults = await findDrugByImprint(combinedData.imprint);
        
        if (imprintResults) {
          console.log(`Found drug by imprint: ${imprintResults.name}`);
          // Update fields from imprint search
          combinedData.name = imprintResults.name;
          combinedData.genericName = imprintResults.genericName || combinedData.genericName;
          combinedData.manufacturer = imprintResults.manufacturer || combinedData.manufacturer;
          combinedData.category = imprintResults.category || combinedData.category;
          combinedData.drugClass = imprintResults.drugClass || combinedData.drugClass;
          combinedData.description = imprintResults.description || combinedData.description;
          combinedData.dosageAndAdmin = imprintResults.dosageAndAdmin || combinedData.dosageAndAdmin;
          
          if (imprintResults.sideEffects && imprintResults.sideEffects.length > 0) {
            combinedData.sideEffects = imprintResults.sideEffects as string[];
          }
          
          if (imprintResults.warnings && imprintResults.warnings.length > 0) {
            combinedData.warnings = imprintResults.warnings as string[];
          }
          
          if (imprintResults.interactions && imprintResults.interactions.length > 0) {
            combinedData.interactions = imprintResults.interactions as string[];
          }
          
          combinedData.storage = imprintResults.storage || combinedData.storage;
          combinedData.mechanism = imprintResults.mechanism || combinedData.mechanism;
          
          if (imprintResults.indications && imprintResults.indications.length > 0) {
            combinedData.indications = imprintResults.indications as string[];
          }
          
          if (imprintResults.contraindications && imprintResults.contraindications.length > 0) {
            combinedData.contraindications = imprintResults.contraindications as string[];
          }
          
          if (imprintResults.prescriptionStatus !== "Unknown") {
            combinedData.prescriptionStatus = imprintResults.prescriptionStatus;
          }
          
          combinedData.pregnancy = imprintResults.pregnancy || combinedData.pregnancy;
          
          // Add brand names from imprint search if available
          if (imprintResults.brandNames && imprintResults.brandNames.length > 0) {
            const uniqueBrandNames = new Set([...combinedData.brandNames, ...imprintResults.brandNames]);
            combinedData.brandNames = Array.from(uniqueBrandNames);
          }
          
          combinedData.verified = true;
        }
      } catch (imprintError) {
        console.error("Error searching by imprint:", imprintError);
        // Continue without imprint search results
      }
    }
    
    // Log the final processed result
    console.log("Final identification result:", combinedData.name);
    
    return createSuccessResponse(combinedData);
    
  } catch (error) {
    console.error("Error constructing final response:", error);
    return createErrorResponse(
      "processing_error", 
      "Failed to process the analysis results. Please try again.",
      error.message
    );
  }
}
