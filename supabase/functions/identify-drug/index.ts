
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      const completeResponse = {
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
