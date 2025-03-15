
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

    console.log("Image received, preparing to call AI API");
    
    // Get the API key from environment variables
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not set in environment variables");
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
    
    // Call DeepSeek API for drug identification
    console.log("Calling DeepSeek API...");
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-vision",
        messages: [
          {
            role: "system",
            content: "You are a pharmaceutical expert specializing in drug identification by visual appearance. Identify medications based on images, providing detailed information about their name, active ingredients, uses, dosing, and potential side effects. Format your response as structured JSON data."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this medication pill/tablet and provide complete information about it. Return the data in JSON format with these fields: name, genericName, manufacturer, category, description, dosageAndAdmin, sideEffects (array), warnings (array), interactions (array), storage, mechanism, indications (array), contraindications (array), prescriptionStatus, pregnancy." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    // Check if the API request was successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error("DeepSeek API error:", JSON.stringify(errorData));
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to analyze image with AI", 
          details: errorData 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log("DeepSeek API response received");

    // Parse the result from the DeepSeek API
    try {
      let drugInfo;
      const assistantMessage = data.choices[0].message;
      
      if (assistantMessage && assistantMessage.content) {
        // Try to extract JSON from the response content
        let jsonContent;
        try {
          jsonContent = JSON.parse(assistantMessage.content);
          drugInfo = jsonContent;
        } catch (err) {
          // If it's not valid JSON, use regex to extract JSON blocks
          const jsonMatch = assistantMessage.content.match(/```json([\s\S]*?)```/);
          if (jsonMatch && jsonMatch[1]) {
            drugInfo = JSON.parse(jsonMatch[1].trim());
          } else {
            // Provide a manually structured response based on text content
            drugInfo = {
              name: "Could not parse drug information",
              description: assistantMessage.content
            };
          }
        }
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
      console.error("Error parsing DeepSeek response:", parseError.message);
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
