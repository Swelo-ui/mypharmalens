
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        throw new Error('Failed to find drug information');
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
          throw new Error('Failed to fetch drug detail page');
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
            throw new Error('Failed to fetch drug detail page from table result');
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
    console.error(`Error fetching drug info from drugs.com: ${error.message}`);
    return null;
  }
}

// Function to find drug information by imprint or markings
async function findDrugByImprint(imprint: string): Promise<any> {
  try {
    if (!imprint || imprint.trim().length < 2) {
      return null;
    }
    
    console.log(`Searching drugs.com for pill imprint: ${imprint}`);
    const url = `https://www.drugs.com/imprints.php?imprint=${encodeURIComponent(imprint)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Look for the first pill match in the results
    const pillMatch = html.match(/<a href="([^"]+)" class="[^"]*?pill-identifier-[^"]*?">([^<]+)<\/a>/i);
    
    if (pillMatch && pillMatch[1]) {
      const pillUrl = pillMatch[1].startsWith('http') ? 
                    pillMatch[1] : 
                    `https://www.drugs.com${pillMatch[1]}`;
      const pillName = pillMatch[2].trim();
      
      console.log(`Found pill match: ${pillName}, fetching details from: ${pillUrl}`);
      
      const detailResponse = await fetch(pillUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (detailResponse.ok) {
        return parseHtmlForDrugInfo(await detailResponse.text(), pillName);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching by imprint: ${error.message}`);
    return null;
  }
}

// Function to parse HTML and extract drug information
function parseHtmlForDrugInfo(html: string, drugName: string): any {
  try {
    console.log(`Parsing HTML for drug: ${drugName}`);
    
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
      pregnancy: ""
    };
    
    // Extract generic name
    const genericNameMatch = html.match(/<p class="drug-subtitle">(.*?)<\/p>/s);
    if (genericNameMatch && genericNameMatch[1]) {
      drugInfo.genericName = genericNameMatch[1].trim();
    }
    
    // Extract manufacturer (enhanced)
    const manufacturerMatch = html.match(/(?:Manufactured|Marketed|Supplied) by:?\s*([^<.]+)(?:<|\.)/i) || 
                            html.match(/(?:Manufactured|Marketed|Supplied) for:?\s*([^<.]+)(?:<|\.)/i);
    if (manufacturerMatch && manufacturerMatch[1]) {
      drugInfo.manufacturer = manufacturerMatch[1].trim();
    }
    
    // Extract drug category
    const categoryMatch = html.match(/<a href="\/drug-class\/[^"]+"[^>]*>([^<]+)<\/a>/i);
    if (categoryMatch && categoryMatch[1]) {
      drugInfo.category = categoryMatch[1].trim();
    }
    
    // Extract description (improved with fallbacks)
    let descriptionMatch = html.match(/<div class="contentBox">[\s\S]*?<p>([\s\S]*?)<\/p>/);
    if (!descriptionMatch) {
      // Try alternative pattern
      descriptionMatch = html.match(/<div id="drug-description"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/);
    }
    if (!descriptionMatch) {
      // Try another pattern
      descriptionMatch = html.match(/<div class="[^"]*?drug-description[^"]*?"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/);
    }
    
    if (descriptionMatch && descriptionMatch[1]) {
      drugInfo.description = descriptionMatch[1]
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')    // Replace multiple spaces
        .trim();
    }
    
    // Extract side effects (more robust pattern)
    const sideEffectsMatch = html.match(/<h2[^>]*>Side Effects<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/) ||
                           html.match(/<h3[^>]*>Side Effects<\/h3>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/) ||
                           html.match(/<h2[^>]*>Common[^<]*side effects[^<]*<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i);
    
    if (sideEffectsMatch && sideEffectsMatch[1]) {
      const sideEffectsHtml = sideEffectsMatch[1];
      const sideEffects = sideEffectsHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/g);
      
      if (sideEffects) {
        drugInfo.sideEffects = sideEffects.map(item => {
          return item
            .replace(/<li[^>]*>/, '')
            .replace(/<\/li>/, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        });
      }
    }
    
    // If no side effects found with lists, try paragraphs
    if (drugInfo.sideEffects.length === 0) {
      const sideEffectsParagraphMatch = html.match(/<h2[^>]*>Side Effects<\/h2>[\s\S]*?<p>([\s\S]*?)<\/p>/) ||
                                      html.match(/<h3[^>]*>Side Effects<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>/);
      
      if (sideEffectsParagraphMatch && sideEffectsParagraphMatch[1]) {
        const paragraphText = sideEffectsParagraphMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        drugInfo.sideEffects = paragraphText
          .split(/\.\s+|;\s+/)
          .map(effect => effect.trim())
          .filter(effect => effect.length > 5)
          .map(effect => effect + (effect.endsWith('.') ? '' : '.'));
      }
    }
    
    // Extract warnings (improved)
    const warningsMatch = html.match(/<h2[^>]*>Warnings<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                        html.match(/<h3[^>]*>Warnings<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                        html.match(/<h2[^>]*>Warning[^<]*<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    
    if (warningsMatch && warningsMatch[1]) {
      const warningsText = warningsMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      drugInfo.warnings = warningsText.split(/\.\s+/).filter(warning => warning.length > 10)
        .map(warning => warning.trim() + (warning.endsWith('.') ? '' : '.'));
    }
    
    // Extract dosage info (more patterns)
    const dosageMatch = html.match(/<h2[^>]*>Dosage<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                      html.match(/<h3[^>]*>Dosage<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                      html.match(/<h2[^>]*>Dosage and Administration<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                      html.match(/<h2[^>]*>How to [Tt]ake<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    
    if (dosageMatch && dosageMatch[1]) {
      drugInfo.dosageAndAdmin = dosageMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Extract indications (improved)
    const indicationsMatch = html.match(/<h2[^>]*>Uses<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                           html.match(/<h3[^>]*>Uses<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                           html.match(/<h2[^>]*>Indications<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                           html.match(/<h2[^>]*>What is [^<]*?<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    
    if (indicationsMatch && indicationsMatch[1]) {
      const indicationsText = indicationsMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      drugInfo.indications = indicationsText.split(/\.\s+/).filter(item => item.length > 5)
        .map(item => item.trim() + (item.endsWith('.') ? '' : '.'));
    }
    
    // Determine if prescription or OTC (more patterns)
    if (html.includes("prescription drug") || html.includes("Rx only") || html.includes("prescription only") || html.includes("Available by prescription")) {
      drugInfo.prescriptionStatus = "Prescription Only";
    } else if (html.includes("over-the-counter") || html.includes("OTC") || html.includes("without a prescription")) {
      drugInfo.prescriptionStatus = "OTC";
    }
    
    // Extract mechanism of action (improved)
    const mechanismMatch = html.match(/<h2[^>]*>Mechanism of Action<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                         html.match(/<h3[^>]*>Mechanism of Action<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                         html.match(/<h2[^>]*>How it works<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                         html.match(/<h2[^>]*>How does [^<]+?<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    
    if (mechanismMatch && mechanismMatch[1]) {
      drugInfo.mechanism = mechanismMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Extract pregnancy information
    const pregnancyMatch = html.match(/<h2[^>]*>Pregnancy[^<]*<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                         html.match(/<h3[^>]*>Pregnancy[^<]*<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    
    if (pregnancyMatch && pregnancyMatch[1]) {
      drugInfo.pregnancy = pregnancyMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    console.log(`Successfully parsed drug info for: ${drugName}`);
    return drugInfo;
  } catch (error) {
    console.error(`Error parsing HTML: ${error.message}`);
    return null;
  }
}

// Helper function to extract text from Gemini response
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
  
  return null;
}

// Function to enrich AI-identified drug data with drugs.com data
async function enrichDrugDataWithDrugsCom(aiDrugData: any): Promise<any> {
  const drugName = aiDrugData.name;
  console.log(`Enriching data for drug: ${drugName}`);
  
  // First, try by drug name
  let drugsComData = await getDrugInfoFromDrugsCom(drugName);
  
  // If no data found, try by imprint if available
  if (!drugsComData && aiDrugData.imprint) {
    console.log(`No data found by name, trying imprint: ${aiDrugData.imprint}`);
    drugsComData = await findDrugByImprint(aiDrugData.imprint);
  }
  
  if (!drugsComData) {
    console.log(`No additional data found on drugs.com for: ${drugName}`);
    return aiDrugData;
  }
  
  console.log(`Successfully enriched data for: ${drugName}`);
  
  // Merge data, preferring drugs.com data where available
  return {
    ...aiDrugData,
    genericName: drugsComData.genericName || aiDrugData.genericName,
    manufacturer: drugsComData.manufacturer || aiDrugData.manufacturer,
    category: drugsComData.category || aiDrugData.category,
    description: drugsComData.description || aiDrugData.description,
    dosageAndAdmin: drugsComData.dosageAndAdmin || aiDrugData.dosageAndAdmin,
    sideEffects: drugsComData.sideEffects.length > 0 ? drugsComData.sideEffects : aiDrugData.sideEffects,
    warnings: drugsComData.warnings.length > 0 ? drugsComData.warnings : aiDrugData.warnings,
    interactions: drugsComData.interactions.length > 0 ? drugsComData.interactions : aiDrugData.interactions,
    storage: drugsComData.storage || aiDrugData.storage,
    mechanism: drugsComData.mechanism || aiDrugData.mechanism,
    indications: drugsComData.indications.length > 0 ? drugsComData.indications : aiDrugData.indications,
    contraindications: drugsComData.contraindications.length > 0 ? drugsComData.contraindications : aiDrugData.contraindications,
    prescriptionStatus: drugsComData.prescriptionStatus !== "Unknown" ? drugsComData.prescriptionStatus : aiDrugData.prescriptionStatus,
    pregnancy: drugsComData.pregnancy || aiDrugData.pregnancy,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ 
          error: "Missing image data" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;

    console.log("Image received, preparing to call Gemini API");
    
    // Get the API key from environment variables
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Call Google Gemini API for drug identification
    console.log("Calling Gemini API...");
    
    // Prepare the request to Gemini Vision Pro model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "You are a pharmaceutical expert. Identify this medication pill/tablet from the image and provide complete information about it. Focus on identifying markings, colors, shapes, and any text visible on the pill. Try to determine the exact medication name, active ingredients, dosage strengths, and manufacturer if possible. Return the data in ONLY JSON format with these fields: name, genericName, manufacturer, category, description, dosageAndAdmin, sideEffects (array), warnings (array), interactions (array), storage, mechanism, indications (array), contraindications (array), prescriptionStatus, pregnancy, imprint (add this field with any codes, numbers or markings visible on the pill). Ensure your response is ONLY valid JSON with no additional text."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ],
        generation_config: {
          temperature: 0.1, // Lower temperature for more factual responses
          max_output_tokens: 4000
        }
      })
    });

    // Check if the API request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        return new Response(
          JSON.stringify({ 
            error: "Failed to analyze image with Gemini AI", 
            details: errorData 
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ 
            error: "Failed to analyze image with Gemini AI", 
            details: errorText 
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    const data = await response.json();
    console.log("Gemini API response received");

    // Parse the result from the Gemini API
    try {
      let drugInfo;
      let rawResponseText = "";
      
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        
        const contentText = data.candidates[0].content.parts[0].text;
        rawResponseText = contentText;
        console.log("Raw response:", contentText);
        
        // Try to extract JSON from the response content
        try {
          // First try to parse the content directly as JSON
          drugInfo = JSON.parse(contentText);
        } catch (jsonError) {
          console.log("Initial JSON parsing failed, attempting to extract JSON from text");
          
          // Try to find a JSON-like structure in the text
          const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          contentText.match(/```\s*([\s\S]*?)\s*```/) ||
                          contentText.match(/\{[\s\S]*\}/);
                          
          if (jsonMatch && jsonMatch[1]) {
            try {
              drugInfo = JSON.parse(jsonMatch[1].trim());
            } catch (nestedJsonError) {
              console.error("Failed to parse extracted JSON:", nestedJsonError.message);
              // Try to extract just the object notation, which might be more reliable
              const objectMatch = contentText.match(/\{[\s\S]*\}/);
              if (objectMatch) {
                try {
                  drugInfo = JSON.parse(objectMatch[0]);
                } catch (objectJsonError) {
                  console.error("Failed to parse object notation:", objectJsonError.message);
                  throw new Error("Could not parse valid JSON from response");
                }
              } else {
                throw new Error("No valid JSON structure found in response");
              }
            }
          } else if (jsonMatch) {
            // If we matched the full object notation
            try {
              drugInfo = JSON.parse(jsonMatch[0]);
            } catch (fullObjectError) {
              console.error("Failed to parse full object notation:", fullObjectError.message);
              throw new Error("Could not parse valid JSON from response");
            }
          } else {
            console.log("No JSON structure found, attempting to extract key information from text");
            
            // As a last resort, extract drug name and try to use that for lookup
            const extractedDrugName = extractDrugNameFromText(contentText);
            
            if (extractedDrugName) {
              console.log(`Extracted drug name from text: ${extractedDrugName}`);
              
              // Create a minimal drug object with the extracted name
              drugInfo = {
                name: extractedDrugName,
                description: contentText.substring(0, 300) + "..."
              };
              
              // Try to extract imprint/markings
              const imprintMatch = contentText.match(/imprint["\s:]+([^"'\n,;]+)/i) || 
                                 contentText.match(/marking["\s:]+([^"'\n,;]+)/i) ||
                                 contentText.match(/code["\s:]+([^"'\n,;]+)/i);
              
              if (imprintMatch && imprintMatch[1]) {
                drugInfo.imprint = imprintMatch[1].trim();
              }
            } else {
              console.log("Could not extract drug name, using generic fallback");
              drugInfo = {
                name: "Unknown Medication",
                description: "Could not identify the medication from the image. The AI analysis suggests: " + 
                            contentText.substring(0, 300) + "..."
              };
            }
          }
        }
      } else {
        console.error("Unexpected response format from Gemini API");
        throw new Error("Invalid response format from Gemini API");
      }

      // Add missing fields with defaults if needed
      const baseResponse = {
        id: crypto.randomUUID(),
        name: drugInfo.name || "Unknown Medication",
        genericName: drugInfo.genericName || drugInfo.generic_name || "",
        manufacturer: drugInfo.manufacturer || "Unknown",
        category: drugInfo.category || "",
        description: drugInfo.description || "",
        dosageAndAdmin: drugInfo.dosageAndAdmin || drugInfo.dosage_and_admin || "",
        sideEffects: Array.isArray(drugInfo.sideEffects) ? drugInfo.sideEffects : 
                    Array.isArray(drugInfo.side_effects) ? drugInfo.side_effects : [],
        warnings: Array.isArray(drugInfo.warnings) ? drugInfo.warnings : [],
        interactions: Array.isArray(drugInfo.interactions) ? drugInfo.interactions : [],
        storage: drugInfo.storage || "",
        mechanism: drugInfo.mechanism || "",
        indications: Array.isArray(drugInfo.indications) ? drugInfo.indications : [],
        contraindications: Array.isArray(drugInfo.contraindications) ? drugInfo.contraindications : [],
        prescriptionStatus: drugInfo.prescriptionStatus || drugInfo.prescription_status || "Unknown",
        pregnancy: drugInfo.pregnancy || "",
        imprint: drugInfo.imprint || "",
        verified: false,
        image: imageBase64.includes('data:') ? imageBase64 : `data:image/jpeg;base64,${base64Data}`,
        aiAnalysis: rawResponseText.substring(0, 500) // Store the first part of the AI analysis for reference
      };

      // If we got a valid drug name, enrich data from drugs.com
      let completeResponse = baseResponse;
      if (baseResponse.name && baseResponse.name !== "Unknown Medication" && baseResponse.name !== "Could not parse drug information") {
        console.log(`Valid drug name found: ${baseResponse.name}, enriching with drugs.com data`);
        completeResponse = await enrichDrugDataWithDrugsCom(baseResponse);
      } else if (baseResponse.imprint) {
        // If we have an imprint but no drug name, try searching by imprint
        console.log(`No valid drug name but imprint found: ${baseResponse.imprint}, searching by imprint`);
        const imprintResults = await findDrugByImprint(baseResponse.imprint);
        
        if (imprintResults) {
          console.log(`Found drug by imprint: ${imprintResults.name}`);
          // Update the name from the imprint search and enrich further
          baseResponse.name = imprintResults.name;
          completeResponse = await enrichDrugDataWithDrugsCom(baseResponse);
        }
      }

      // Log the response for debugging
      console.log("Successfully identified drug:", completeResponse.name);

      return new Response(
        JSON.stringify(completeResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError.message);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse drug information", 
          details: parseError.message, 
          rawResponse: data 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error("Error in identify-drug function:", error.message);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
