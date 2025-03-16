
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
      
      // Extract the first search result URL (simplified parsing)
      const firstResultMatch = searchHtml.match(/<a href="(\/[^"]+)" class="ddc-link-[^"]+">/);
      if (firstResultMatch && firstResultMatch[1]) {
        const resultUrl = `https://www.drugs.com${firstResultMatch[1]}`;
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
    
    // Extract description
    const descriptionMatch = html.match(/<div class="contentBox">[\s\S]*?<p>([\s\S]*?)<\/p>/);
    if (descriptionMatch && descriptionMatch[1]) {
      drugInfo.description = descriptionMatch[1]
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')    // Replace multiple spaces
        .trim();
    }
    
    // Extract side effects
    const sideEffectsMatch = html.match(/<h2[^>]*>Side Effects<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
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
    
    // Extract warnings
    const warningsMatch = html.match(/<h2[^>]*>Warnings<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    if (warningsMatch && warningsMatch[1]) {
      const warningsText = warningsMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      drugInfo.warnings = warningsText.split(/\.\s+/).filter(warning => warning.length > 10)
        .map(warning => warning.trim() + (warning.endsWith('.') ? '' : '.'));
    }
    
    // Extract dosage info
    const dosageMatch = html.match(/<h2[^>]*>Dosage<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    if (dosageMatch && dosageMatch[1]) {
      drugInfo.dosageAndAdmin = dosageMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Extract indications
    const indicationsMatch = html.match(/<h2[^>]*>Uses<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    if (indicationsMatch && indicationsMatch[1]) {
      const indicationsText = indicationsMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      drugInfo.indications = indicationsText.split(/\.\s+/).filter(item => item.length > 5)
        .map(item => item.trim() + (item.endsWith('.') ? '' : '.'));
    }
    
    // Determine if prescription or OTC
    if (html.includes("prescription drug") || html.includes("Rx only")) {
      drugInfo.prescriptionStatus = "Prescription Only";
    } else if (html.includes("over-the-counter") || html.includes("OTC")) {
      drugInfo.prescriptionStatus = "OTC";
    }
    
    // Extract mechanism of action
    const mechanismMatch = html.match(/<h2[^>]*>Mechanism of Action<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    if (mechanismMatch && mechanismMatch[1]) {
      drugInfo.mechanism = mechanismMatch[1]
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

// Function to enrich AI-identified drug data with drugs.com data
async function enrichDrugDataWithDrugsCom(aiDrugData: any): Promise<any> {
  const drugName = aiDrugData.name;
  console.log(`Enriching data for drug: ${drugName}`);
  
  const drugsComData = await getDrugInfoFromDrugsCom(drugName);
  
  if (!drugsComData) {
    console.log(`No additional data found on drugs.com for: ${drugName}`);
    return aiDrugData;
  }
  
  console.log(`Successfully enriched data for: ${drugName}`);
  
  // Merge data, preferring drugs.com data where available
  return {
    ...aiDrugData,
    genericName: drugsComData.genericName || aiDrugData.genericName,
    description: drugsComData.description || aiDrugData.description,
    dosageAndAdmin: drugsComData.dosageAndAdmin || aiDrugData.dosageAndAdmin,
    sideEffects: drugsComData.sideEffects.length > 0 ? drugsComData.sideEffects : aiDrugData.sideEffects,
    warnings: drugsComData.warnings.length > 0 ? drugsComData.warnings : aiDrugData.warnings,
    indications: drugsComData.indications.length > 0 ? drugsComData.indications : aiDrugData.indications,
    mechanism: drugsComData.mechanism || aiDrugData.mechanism,
    prescriptionStatus: drugsComData.prescriptionStatus !== "Unknown" ? drugsComData.prescriptionStatus : aiDrugData.prescriptionStatus,
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
                text: "Identify this medication pill/tablet and provide complete information about it. Return the data in ONLY JSON format with these fields: name, genericName, manufacturer, category, description, dosageAndAdmin, sideEffects (array), warnings (array), interactions (array), storage, mechanism, indications (array), contraindications (array), prescriptionStatus, pregnancy. Ensure your response is ONLY valid JSON with no additional text."
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
          temperature: 0.2,
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
      
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        
        const contentText = data.candidates[0].content.parts[0].text;
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
            // As a last resort, try to identify some common patterns in the response
            const pillName = contentText.match(/name["\s:]+([^"]*)/i);
            const description = contentText.match(/description["\s:]+([^"]*)/i);
            
            drugInfo = {
              name: pillName && pillName[1] ? pillName[1].trim() : "Unknown Medication",
              description: description && description[1] ? description[1].trim() : contentText.substring(0, 200) + "..."
            };
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
        verified: false,
        image: imageBase64.includes('data:') ? imageBase64 : `data:image/jpeg;base64,${base64Data}`,
      };

      // If we got a valid drug name, enrich data from drugs.com
      let completeResponse = baseResponse;
      if (baseResponse.name && baseResponse.name !== "Unknown Medication" && baseResponse.name !== "Could not parse drug information") {
        console.log(`Valid drug name found: ${baseResponse.name}, enriching with drugs.com data`);
        completeResponse = await enrichDrugDataWithDrugsCom(baseResponse);
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
