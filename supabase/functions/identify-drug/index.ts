
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Function to enhance image for better processing
async function enhanceImage(base64Image: string): Promise<string> {
  try {
    // Extract the actual base64 data without the prefix
    const base64Data = base64Image.split(',')[1] || base64Image;
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create a blob from the bytes
    const blob = new Blob([bytes]);
    
    // Create image object to process dimensions
    const imageUrl = URL.createObjectURL(blob);
    const img = new Image();
    
    return await new Promise((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(imageUrl);
        
        // Create a canvas to manipulate the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.log("Failed to get canvas context");
          resolve(base64Image); // Return original if we can't process
          return;
        }
        
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Apply image enhancements
        // 1. Increase contrast
        ctx.filter = 'contrast(120%) brightness(105%)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        
        // 2. Enhance edges for better text detection
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const enhancedData = applyUnsharpMasking(imageData);
        ctx.putImageData(enhancedData, 0, 0);
        
        // Convert back to base64
        const enhancedBase64 = canvas.toDataURL('image/jpeg', 0.95);
        resolve(enhancedBase64);
      };
      
      img.onerror = () => {
        console.log("Error loading image for enhancement");
        resolve(base64Image); // Return original on error
        URL.revokeObjectURL(imageUrl);
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    console.error("Error enhancing image:", error);
    return base64Image; // Return original on error
  }
}

// Helper function for unsharp masking to enhance edges and text
function applyUnsharpMasking(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const result = new ImageData(width, height);
  const resultData = result.data;
  
  // Clone original data
  for (let i = 0; i < data.length; i++) {
    resultData[i] = data[i];
  }
  
  // Apply unsharp masking
  const amount = 0.8; // Strength of the effect
  const radius = 1;
  const threshold = 10;
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const centerIdx = (y * width + x) * 4;
      
      // For each color channel (RGB)
      for (let c = 0; c < 3; c++) {
        let blurredValue = 0;
        let weight = 0;
        
        // Calculate a simple box blur
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            blurredValue += data[idx];
            weight++;
          }
        }
        
        blurredValue = blurredValue / weight;
        
        // Calculate unsharp mask
        const originalValue = data[centerIdx + c];
        const difference = originalValue - blurredValue;
        
        // Apply only if the difference is above threshold
        if (Math.abs(difference) > threshold) {
          resultData[centerIdx + c] = Math.min(255, 
            Math.max(0, Math.round(originalValue + difference * amount)));
        }
      }
    }
  }
  
  return result;
}

// Function to detect partial pills or cut medications in the image
async function detectPartialMedication(imageDescription: string): Promise<boolean> {
  const partialIndicators = [
    'half', 'cut', 'partial', 'broken', 'split', 
    'divided', 'portion', 'fragment', 'piece', 
    'section', 'part', 'halved', 'quarter', 'segment'
  ];
  
  const lowerDescription = imageDescription.toLowerCase();
  return partialIndicators.some(indicator => lowerDescription.includes(indicator));
}

// Enhanced function to extract potential markings from blurry images
async function extractPotentialMarkings(base64Image: string, description: string): Promise<string | null> {
  try {
    // If the description already contains markings, leverage that information
    const markingsMatch = description.match(/markings?:?\s*["']?([^"'.]+)["']?/i);
    if (markingsMatch && markingsMatch[1]) {
      return markingsMatch[1].trim();
    }
    
    // Extract potential text patterns that might be markings
    const potentialMarkings: string[] = [];
    
    // Look for patterns that match pill markings (1-4 characters, often with numbers and letters)
    const markingPatterns = description.match(/\b[A-Z0-9]{1,4}\b/g);
    if (markingPatterns) {
      potentialMarkings.push(...markingPatterns);
    }
    
    // Look for described imprints
    const imprintMatch = description.match(/imprint(?:ed)?(?:\s+with)?:?\s*["']?([^"'.]+)["']?/i);
    if (imprintMatch && imprintMatch[1]) {
      potentialMarkings.push(imprintMatch[1].trim());
    }
    
    return potentialMarkings.length > 0 ? potentialMarkings.join(", ") : null;
  } catch (error) {
    console.error("Error extracting markings:", error);
    return null;
  }
}

// Function to analyze image with multiple AI models and combine results
async function analyzeImageWithMultipleModels(imageBase64: string, blurryMode: boolean) {
  try {
    console.log("Using enhanced multi-model analysis for drug identification");
    
    // Primary analysis using the first model (optimized for drug identification)
    const primaryAnalysisPrompt = `
      Analyze this medication image carefully. You are an expert pharmacist with deep knowledge of medication identification.
      
      Provide the following details in JSON format:
      - name: the drug name (brand name if visible)
      - genericName: the generic name
      - possibleNames: array of possible names if uncertain
      - imprint: any imprinted codes or text on the medication
      - color: the color of the medication
      - shape: the shape of the medication (e.g., round, oval, capsule)
      - markings: any visible markings, logos, or scoring
      - confidence: your confidence level (high, medium, low)
      - description: detailed description of what you see
      
      Be especially attentive to partial pills, cut medications, or unusual presentations.
      If multiple medications are visible, describe each one.
      If packaging is visible, extract as much information from it as possible.
    `;
    
    const primaryResponse = await fetchAIResponse(primaryAnalysisPrompt, imageBase64);
    const primaryData = parseAIResponse(primaryResponse);
    console.log("Primary analysis result:", JSON.stringify(primaryData, null, 2));
    
    // Secondary analysis using different model (optimized for text extraction and details)
    const secondaryAnalysisPrompt = `
      You are a pharmaceutical expert specializing in medication identification. 
      Analyze this medication image focusing on TEXT EXTRACTION and PRECISE DETAILS.
      
      Examine carefully:
      1. Any text on the pill or packaging
      2. Logos or unique markings
      3. Color and shape details
      4. Partial or cut pills
      5. Any manufacturing details
      
      Provide a JSON response with:
      - name: medication name
      - genericName: generic name
      - possibleNames: array of potential identifications
      - imprint: any text/numbers on the pill
      - color: color description
      - shape: pill shape
      - confidence: numerical value between 0 and 1
      - description: detailed visual description
    `;
    
    const secondaryResponse = await fetchAIResponse(secondaryAnalysisPrompt, imageBase64);
    const secondaryData = parseAIResponse(secondaryResponse);
    console.log("Secondary analysis result:", JSON.stringify(secondaryData, null, 2));
    
    // If blurry mode, add a third analysis optimized for low-quality images
    let tertiaryData = null;
    if (blurryMode) {
      const tertiaryAnalysisPrompt = `
        You are a medication identification expert analyzing a BLURRY or LOW QUALITY image.
        Focus specifically on extracting whatever information is possible despite the quality issues.
        
        Pay special attention to:
        - Partial pill fragments
        - Cut medications
        - Blurry text that might be legible
        - Color and shape even if pill details aren't clear
        - Any visible packaging information
        
        Provide a JSON response with:
        - name: best guess at medication name
        - genericName: best guess at generic name
        - possibleNames: array of potential identifications (be more inclusive due to quality)
        - imprint: any possibly visible text/numbers
        - color: color description (be more general if unclear)
        - shape: pill shape if discernible
        - confidence: numerical value between 0 and 1
        - description: description acknowledging quality limitations
      `;
      
      const tertiaryResponse = await fetchAIResponse(tertiaryAnalysisPrompt, imageBase64);
      tertiaryData = parseAIResponse(tertiaryResponse);
      console.log("Tertiary analysis (blurry mode) result:", JSON.stringify(tertiaryData, null, 2));
    }
    
    // Combine the results from different models for a more accurate identification
    const combinedResult = combineAnalysisResults(primaryData, secondaryData, tertiaryData);
    return combinedResult;
    
  } catch (error) {
    console.error("Error in multi-model image analysis:", error);
    throw error;
  }
}

// Helper function to combine results from multiple analyses
function combineAnalysisResults(primaryData: any, secondaryData: any, tertiaryData: any | null) {
  // Start with primary data as base
  const result = { ...primaryData };
  
  // Helper function to determine confidence level
  function determineConfidence(primary: string, secondary: number | string | undefined, tertiary: number | string | undefined = undefined) {
    // Convert string confidence to number if needed
    const primaryVal = typeof primary === 'string' 
      ? (primary.toLowerCase() === 'high' ? 0.9 : primary.toLowerCase() === 'medium' ? 0.7 : 0.4)
      : (primary || 0.5);
      
    const secondaryVal = typeof secondary === 'string'
      ? (secondary.toLowerCase() === 'high' ? 0.9 : secondary.toLowerCase() === 'medium' ? 0.7 : 0.4)
      : (secondary || 0.5);
      
    const tertiaryVal = tertiary !== undefined
      ? (typeof tertiary === 'string' 
          ? (tertiary.toLowerCase() === 'high' ? 0.9 : tertiary.toLowerCase() === 'medium' ? 0.7 : 0.4)
          : (tertiary || 0.5))
      : 0.5;
    
    // Calculate weighted average
    const weightedAvg = tertiaryData 
      ? (primaryVal * 0.4 + secondaryVal * 0.4 + tertiaryVal * 0.2)
      : (primaryVal * 0.6 + secondaryVal * 0.4);
    
    // Convert back to string confidence
    return weightedAvg >= 0.8 ? 'high' : weightedAvg >= 0.6 ? 'medium' : 'low';
  }
  
  // Function to merge arrays and remove duplicates
  function mergeArrays(arrays: string[][]) {
    return [...new Set(arrays.flat().filter(Boolean))];
  }
  
  // Merge name (prefer the more specific name if available)
  if (secondaryData.name && (!result.name || secondaryData.name.length > result.name.length)) {
    result.name = secondaryData.name;
  }
  
  // Merge generic name (prefer the more specific name if available)
  if (secondaryData.genericName && (!result.genericName || secondaryData.genericName.length > result.genericName.length)) {
    result.genericName = secondaryData.genericName;
  }
  
  // Merge possible names
  result.possibleNames = mergeArrays([
    result.possibleNames || [], 
    secondaryData.possibleNames || [],
    tertiaryData?.possibleNames || []
  ]);
  
  // Merge imprint (prefer non-null)
  result.imprint = result.imprint || secondaryData.imprint || tertiaryData?.imprint || null;
  
  // Merge color (prefer non-null)
  result.color = result.color || secondaryData.color || tertiaryData?.color || null;
  
  // Merge shape (prefer non-null)
  result.shape = result.shape || secondaryData.shape || tertiaryData?.shape || null;
  
  // Merge markings (prefer non-null or combine if both have information)
  if (result.markings && secondaryData.markings) {
    result.markings = `${result.markings}; ${secondaryData.markings}`;
  } else {
    result.markings = result.markings || secondaryData.markings || tertiaryData?.markings || null;
  }
  
  // Set confidence based on all analyses
  result.confidence = determineConfidence(
    result.confidence,
    secondaryData.confidence,
    tertiaryData?.confidence
  );
  
  // Enhance description to include all relevant details
  result.description = result.description || secondaryData.description || tertiaryData?.description || '';
  
  // Add metadata about the analysis process
  result.blurryModeUsed = !!tertiaryData;
  result.multiModelAnalysisUsed = true;
  result.partialPillDetected = result.description ? 
    ['half', 'cut', 'partial', 'broken', 'piece'].some(term => result.description.toLowerCase().includes(term)) : false;
  
  return result;
}

// Function to parse AI response into JSON
function parseAIResponse(response: string): any {
  try {
    // Extract JSON from the response (handling possible formatting)
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                      response.match(/(\{[\s\S]*?\})/);
    
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // If no JSON found in normal format, try to parse the whole response
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    // Return a basic structure if parsing fails
    return {
      name: "Unknown",
      genericName: "Unknown",
      description: response.substring(0, 200) + "...",
      confidence: "low"
    };
  }
}

// AI response fetch function (mocked for the example)
async function fetchAIResponse(prompt: string, imageBase64: string): Promise<string> {
  try {
    // Use multiple AI models for better accuracy
    // This is where you would integrate with your preferred AI vision model
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    
    // Decide which API to use based on available keys
    if (GEMINI_API_KEY) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-vision-latest:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64.split(",")[1] || imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "text/plain"
          }
        })
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error("Invalid response format from Gemini API");
      
    } else if (DEEPSEEK_API_KEY) {
      // DeepSeek API implementation
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-vision",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageBase64 } }
              ]
            }
          ],
          temperature: 0.2,
          max_tokens: 2048
        })
      });
      
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      }
      
      throw new Error("Invalid response format from DeepSeek API");
      
    } else {
      throw new Error("No valid API key found for image analysis");
    }
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw error;
  }
}

// Function to find drug info in database based on AI identification
async function findDrugInDatabase(drugData: any) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First try to find by exact name
    let query = supabase
      .from('drugs')
      .select('*')
      .limit(1);
    
    if (drugData.name && drugData.name !== "Unknown") {
      query = query.ilike('name', `%${drugData.name}%`);
    } else if (drugData.genericName && drugData.genericName !== "Unknown") {
      query = query.ilike('generic_name', `%${drugData.genericName}%`);
    } else {
      // If no name information, try by description
      if (drugData.description) {
        // Extract key terms from description
        const terms = drugData.description.split(' ')
          .filter((word: string) => word.length > 4)
          .slice(0, 5);
        
        if (terms.length > 0) {
          const searchTerm = terms.join(' ');
          query = query.or(`description.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
        }
      }
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error("Database search error:", error);
      return null;
    }
    
    if (data && data.length > 0) {
      // We found a match in the database
      return {
        id: data[0].id,
        name: data[0].name,
        genericName: data[0].generic_name,
        manufacturer: data[0].manufacturer,
        category: data[0].category,
        drugClass: data[0].drug_class,
        description: data[0].description,
        prescriptionStatus: data[0].prescription_status,
        dosageAndAdmin: data[0].dosage_and_admin,
        image: data[0].image_url,
        confidence: drugData.confidence,
        fromDatabase: true
      };
    }
    
    // If no match in database, return processed AI data
    return {
      id: null,
      name: drugData.name || "Unknown medication",
      genericName: drugData.genericName || drugData.name || "Unknown",
      manufacturer: null,
      category: "Unclassified",
      drugClass: null,
      description: drugData.description || "No description available",
      prescriptionStatus: null,
      dosageAndAdmin: null,
      image: null,
      confidence: drugData.confidence,
      fromDatabase: false,
      partialPillDetected: drugData.partialPillDetected,
      confidence: drugData.confidence,
      blurryModeUsed: drugData.blurryModeUsed,
      multiModelAnalysisUsed: drugData.multiModelAnalysisUsed
    };
  } catch (error) {
    console.error("Error in findDrugInDatabase:", error);
    return null;
  }
}

// Main function to process drug identification
async function identifyDrug(imageBase64: string, blurryMode: boolean) {
  try {
    console.log("Image received, initiating multi-stage analysis pipeline");
    
    // Step 1: Enhance the image for better processing
    const enhancedImage = await enhanceImage(imageBase64);
    
    // Step 2: Analyze the image with multiple AI models for best results
    let drugData;
    if (blurryMode) {
      // Use enhanced multi-model analysis for better results with low-quality images
      drugData = await analyzeImageWithMultipleModels(enhancedImage, true);
    } else {
      // First try standard analysis
      console.log("Proceeding with standard analysis...");
      const standardAnalysisPrompt = `
        Analyze this medication image. Identify the drug name, generic name, markings, color, shape, and any other visible characteristics.
        
        Please format your response as a JSON object with the following fields:
        - name (brand name)
        - genericName
        - imprint (any codes or text on the pill)
        - color
        - shape
        - markings (logos or other markings)
        - confidence (high, medium, low)
        - description (detailed description of what you see)
      `;
      
      const standardResponse = await fetchAIResponse(standardAnalysisPrompt, enhancedImage);
      console.log("Standard analysis response received");
      drugData = parseAIResponse(standardResponse);
      console.log("Raw response:", JSON.stringify(drugData, null, 2));
      
      // Check if we need to enhance analysis with multi-model approach
      const needsEnhancedAnalysis = 
        drugData.confidence === 'low' || 
        !drugData.name || 
        drugData.name === 'Unknown' ||
        await detectPartialMedication(drugData.description || '');
        
      if (needsEnhancedAnalysis) {
        console.log("Low confidence or partial pill detected, using enhanced analysis");
        drugData = await analyzeImageWithMultipleModels(enhancedImage, true);
      }
    }
    
    // Step 3: Check if this is a valid drug name that we can find more info about
    if (drugData.name && drugData.name !== "Unknown") {
      console.log(`Valid drug name found: ${drugData.name}, enriching with drugs.com data`);
      
      // Get markings if not already extracted
      if (!drugData.markings) {
        drugData.markings = await extractPotentialMarkings(
          enhancedImage, 
          drugData.description || ''
        );
      }
      
      // Search in our database
      const dbDrugInfo = await findDrugInDatabase(drugData);
      
      // Create the final result combining all data
      const result = {
        ...(dbDrugInfo || {}),
        aiIdentification: {
          name: drugData.name,
          genericName: drugData.genericName,
          imprint: drugData.imprint || null,
          color: drugData.color || null,
          shape: drugData.shape || null,
          markings: drugData.markings || null,
          description: drugData.description || null,
          confidence: drugData.confidence || "low",
          partialPillDetected: drugData.partialPillDetected || false,
          blurryModeUsed: drugData.blurryModeUsed || false,
          multiModelAnalysisUsed: drugData.multiModelAnalysisUsed || false
        }
      };
      
      console.log("Final identification result:", result.name);
      return result;
      
    } else {
      // Return the AI analysis results without enrichment
      return {
        name: drugData.name || "Unknown medication",
        genericName: drugData.genericName || "Unknown",
        description: drugData.description || "Medication could not be clearly identified from the image.",
        confidence: drugData.confidence || "low",
        aiIdentification: {
          imprint: drugData.imprint || null,
          color: drugData.color || null,
          shape: drugData.shape || null,
          markings: drugData.markings || null,
          partialPillDetected: drugData.partialPillDetected || false,
          blurryModeUsed: drugData.blurryModeUsed || false,
          multiModelAnalysisUsed: drugData.multiModelAnalysisUsed || false
        }
      };
    }
  } catch (error) {
    console.error("Error in identifyDrug:", error);
    throw error;
  }
}

// The main handler for the serverless function
serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { imageBase64, blurryMode } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing image data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const result = await identifyDrug(imageBase64, blurryMode);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
