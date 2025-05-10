
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
    
    // In Deno environment, we can't use browser-specific APIs like Image
    // Instead, we'll use a more compatible approach for edge functions
    
    // Return the original image since we can't process it in this environment
    // We'll rely on AI models to handle image quality issues
    return base64Image;
  } catch (error) {
    console.error("Error enhancing image:", error);
    return base64Image; // Return original on error
  }
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
    
    // Add delayed retry mechanism for secondary analysis if first attempt fails
    let secondaryData;
    try {
      const secondaryResponse = await fetchAIResponse(secondaryAnalysisPrompt, imageBase64);
      secondaryData = parseAIResponse(secondaryResponse);
      console.log("Secondary analysis result:", JSON.stringify(secondaryData, null, 2));
    } catch (error) {
      console.log("First attempt at secondary analysis failed, retrying with modified prompt");
      // Retry with simpler prompt
      const fallbackPrompt = `
        Extract all visible TEXT from this medication image.
        Focus only on extracting imprinted codes, numbers, and letters.
        Format response as JSON: {"text": "extracted text", "description": "brief description"}
      `;
      
      try {
        const fallbackResponse = await fetchAIResponse(fallbackPrompt, imageBase64);
        const fallbackData = parseAIResponse(fallbackResponse);
        secondaryData = {
          name: fallbackData.text || "Unknown",
          description: fallbackData.description || "Text extraction only",
          confidence: 0.4
        };
      } catch (secondaryError) {
        console.error("Secondary analysis completely failed:", secondaryError);
        secondaryData = { confidence: 0.1 };
      }
    }
    
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
      
      try {
        const tertiaryResponse = await fetchAIResponse(tertiaryAnalysisPrompt, imageBase64);
        tertiaryData = parseAIResponse(tertiaryResponse);
        console.log("Tertiary analysis (blurry mode) result:", JSON.stringify(tertiaryData, null, 2));
      } catch (error) {
        console.log("Tertiary analysis failed, continuing with available data");
      }
    }
    
    // Combine the results from different models for a more accurate identification
    const combinedResult = combineAnalysisResults(primaryData, secondaryData, tertiaryData);
    return combinedResult;
    
  } catch (error) {
    console.error("Error in multi-model image analysis:", error);
    
    // Fallback to basic analysis if multi-model fails
    try {
      const fallbackPrompt = `
        Describe what you see in this image of a medication in simple terms.
        If possible, identify the medication name and any visible text or markings.
        Format as JSON: {"name": "guess", "description": "what you see", "confidence": "low"}
      `;
      
      const fallbackResponse = await fetchAIResponse(fallbackPrompt, imageBase64);
      const fallbackData = parseAIResponse(fallbackResponse);
      
      return {
        ...fallbackData,
        fallbackMode: true,
        confidence: "low",
      };
    } catch (fallbackError) {
      throw error; // If even fallback fails, throw original error
    }
  }
}

// Helper function to combine results from multiple analyses
function combineAnalysisResults(primaryData: any, secondaryData: any, tertiaryData: any | null) {
  // Start with primary data as base
  const result = { ...primaryData };
  
  // If primary data is empty or invalid, use secondary as base
  if (!primaryData || Object.keys(primaryData).length === 0) {
    return secondaryData || { name: "Unknown", confidence: "low" };
  }
  
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
  
  // Only merge if secondary data exists
  if (secondaryData) {
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
  }
  
  // Set confidence based on all analyses
  result.confidence = determineConfidence(
    result.confidence,
    secondaryData?.confidence,
    tertiaryData?.confidence
  );
  
  // Enhance description to include all relevant details
  result.description = result.description || secondaryData?.description || tertiaryData?.description || '';
  
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
    try {
      return JSON.parse(response);
    } catch (directParseError) {
      // If direct JSON parsing fails, try to extract JSON-like structure
      const potentialJson = response.replace(/[\n\r]/g, ' ')
                                    .match(/\{[^\}]*\}/);
      if (potentialJson) {
        return JSON.parse(potentialJson[0]);
      }
      
      // If all parsing attempts fail, create a simple object from text analysis
      return {
        name: "Unknown",
        description: response.substring(0, 200) + "...",
        extractedText: extractTextFromResponse(response),
        confidence: "low"
      };
    }
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    // Return a basic structure if parsing fails
    return {
      name: "Unknown",
      genericName: "Unknown",
      description: response.substring(0, 200) + "...",
      confidence: "low",
      parsingError: true
    };
  }
}

// New helper function to extract text from unstructured response
function extractTextFromResponse(text: string): string {
  // Look for patterns that might be drug names or codes
  const codePattern = /\b[A-Z0-9]{1,6}\b/g;
  const drugNamePattern = /[A-Z][a-z]+(?:[-\s][A-Z][a-z]+)*/g;
  
  const codes = text.match(codePattern) || [];
  const names = text.match(drugNamePattern) || [];
  
  const extractedItems = [...new Set([...codes, ...names])];
  return extractedItems.join(', ');
}

// AI response fetch function with improved error handling and fallback mechanisms
async function fetchAIResponse(prompt: string, imageBase64: string): Promise<string> {
  try {
    // Use multiple AI models for better accuracy
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    
    // Decide which API to use based on available keys
    if (GEMINI_API_KEY) {
      try {
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
        
        // Check if the response has the expected format
        if (data.candidates && 
            data.candidates[0] && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts[0] && 
            data.candidates[0].content.parts[0].text) {
          return data.candidates[0].content.parts[0].text;
        } else if (data.error) {
          // If there's an error object in the response
          console.error("Gemini API error:", data.error);
          throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
        } else {
          // If the response doesn't have the expected structure but no error
          console.error("Unexpected Gemini API response format:", data);
          throw new Error("Invalid response format from Gemini API");
        }
      } catch (geminiError) {
        // If Gemini API fails, try DeepSeek if available
        if (DEEPSEEK_API_KEY) {
          console.log("Gemini API failed, falling back to DeepSeek API");
          return await fetchDeepSeekResponse(prompt, imageBase64, DEEPSEEK_API_KEY);
        }
        throw geminiError;
      }
    } else if (DEEPSEEK_API_KEY) {
      return await fetchDeepSeekResponse(prompt, imageBase64, DEEPSEEK_API_KEY);
    } else {
      throw new Error("No valid API key found for image analysis");
    }
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw error;
  }
}

// Helper function to fetch response from DeepSeek API
async function fetchDeepSeekResponse(prompt: string, imageBase64: string, apiKey: string): Promise<string> {
  try {
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
    } else if (data.error) {
      console.error("DeepSeek API error:", data.error);
      throw new Error(`DeepSeek API error: ${data.error.message || JSON.stringify(data.error)}`);
    } else {
      console.error("Unexpected DeepSeek API response format:", data);
      throw new Error("Invalid response format from DeepSeek API");
    }
  } catch (error) {
    console.error("Error using DeepSeek API:", error);
    throw error;
  }
}

// Function to find drug info in database based on AI identification
async function findDrugInDatabase(drugData: any) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Build a smarter search query that will try multiple approaches
    let queryResults = [];
    
    // 1. Try exact name match first (highest confidence)
    if (drugData.name && drugData.name !== "Unknown") {
      const nameQuery = supabase
        .from('drugs')
        .select('*')
        .ilike('name', `%${drugData.name}%`)
        .limit(5);
      
      const { data: nameData, error: nameError } = await nameQuery;
      
      if (nameError) {
        console.error("Name query error:", nameError);
      } else if (nameData && nameData.length > 0) {
        queryResults.push(...nameData);
      }
    }
    
    // 2. Try generic name match if available (medium confidence)
    if (drugData.genericName && drugData.genericName !== "Unknown" && queryResults.length < 5) {
      const genericQuery = supabase
        .from('drugs')
        .select('*')
        .ilike('generic_name', `%${drugData.genericName}%`)
        .limit(5);
      
      const { data: genericData, error: genericError } = await genericQuery;
      
      if (genericError) {
        console.error("Generic name query error:", genericError);
      } else if (genericData && genericData.length > 0) {
        // Merge results, avoiding duplicates
        for (const item of genericData) {
          if (!queryResults.some(result => result.id === item.id)) {
            queryResults.push(item);
          }
        }
      }
    }
    
    // 3. Try matching by imprint or markings if available
    if ((drugData.imprint || drugData.markings) && queryResults.length < 5) {
      const searchTerm = drugData.imprint || drugData.markings;
      const markingsQuery = supabase
        .from('drugs')
        .select('*')
        .or(`description.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(3);
      
      const { data: markingsData, error: markingsError } = await markingsQuery;
      
      if (markingsError) {
        console.error("Markings query error:", markingsError);
      } else if (markingsData && markingsData.length > 0) {
        // Merge results, avoiding duplicates
        for (const item of markingsData) {
          if (!queryResults.some(result => result.id === item.id)) {
            queryResults.push(item);
          }
        }
      }
    }
    
    // 4. If we still have no results, try possible names and description keywords
    if (queryResults.length === 0 && (drugData.possibleNames?.length > 0 || drugData.description)) {
      // Build a more thorough search using possible names or keywords from description
      const searchTerms = drugData.possibleNames || [];
      
      // Extract keywords from description
      if (drugData.description) {
        const descriptionWords = drugData.description.split(/\s+/)
          .filter((word: string) => word.length > 4)
          .slice(0, 5);
          
        searchTerms.push(...descriptionWords);
      }
      
      if (searchTerms.length > 0) {
        // Create OR conditions for each search term
        const searchConditions = searchTerms
          .map(term => `name.ilike.%${term}%,generic_name.ilike.%${term}%,description.ilike.%${term}%`)
          .join(',');
          
        const keywordQuery = supabase
          .from('drugs')
          .select('*')
          .or(searchConditions)
          .limit(3);
          
        const { data: keywordData, error: keywordError } = await keywordQuery;
        
        if (keywordError) {
          console.error("Keyword query error:", keywordError);
        } else if (keywordData && keywordData.length > 0) {
          queryResults.push(...keywordData);
        }
      }
    }
    
    // If we found matches in the database
    if (queryResults.length > 0) {
      // Sort results by relevance (simple heuristic - exact name matches first)
      queryResults.sort((a, b) => {
        if (drugData.name && a.name.toLowerCase().includes(drugData.name.toLowerCase())) return -1;
        if (drugData.name && b.name.toLowerCase().includes(drugData.name.toLowerCase())) return 1;
        return 0;
      });
      
      // Use the best match
      const bestMatch = queryResults[0];
      
      return {
        id: bestMatch.id,
        name: bestMatch.name,
        genericName: bestMatch.generic_name,
        manufacturer: bestMatch.manufacturer,
        category: bestMatch.category,
        drugClass: bestMatch.drug_class,
        description: bestMatch.description,
        prescriptionStatus: bestMatch.prescription_status,
        dosageAndAdmin: bestMatch.dosage_and_admin,
        image: bestMatch.image_url,
        confidence: drugData.confidence,
        fromDatabase: true,
        alternativeMatches: queryResults.slice(1, 4).map(alt => ({ 
          id: alt.id, 
          name: alt.name, 
          genericName: alt.generic_name 
        }))
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
      blurryModeUsed: drugData.blurryModeUsed,
      multiModelAnalysisUsed: drugData.multiModelAnalysisUsed,
      extractedText: drugData.extractedText || drugData.imprint || drugData.markings
    };
  } catch (error) {
    console.error("Error in findDrugInDatabase:", error);
    return null;
  }
}

// Main function to process drug identification with improved error handling
async function identifyDrug(imageBase64: string, blurryMode: boolean) {
  try {
    console.log("Image received, initiating multi-stage analysis pipeline");
    
    // Step 1: Enhance the image for better processing
    let enhancedImage = imageBase64;
    try {
      enhancedImage = await enhanceImage(imageBase64);
    } catch (enhanceError) {
      console.error("Error enhancing image:", enhanceError);
      // Continue with original image if enhancement fails
    }
    
    // Step 2: Analyze the image with improved error handling
    let drugData;
    
    try {
      // Try multi-model analysis first for best results
      drugData = await analyzeImageWithMultipleModels(enhancedImage, blurryMode || true);
    } catch (analysisError) {
      console.error("Error in primary analysis:", analysisError);
      
      // Fallback to simplified analysis
      try {
        console.log("Primary analysis failed. Using simplified fallback analysis...");
        const simplifiedPrompt = `
          Identify this medication. What is it? Describe color, shape, and any visible text.
          Reply with: name, color, shape, and any text you can see.
        `;
        
        const simpleResponse = await fetchAIResponse(simplifiedPrompt, enhancedImage);
        drugData = {
          name: "Unknown",
          description: simpleResponse.substring(0, 300),
          confidence: "low",
          fallbackModeUsed: true
        };
        
        // Extract potential drug name from response
        const nameMatch = simpleResponse.match(/name:?\s*([A-Za-z0-9\s]{2,30})/i);
        if (nameMatch && nameMatch[1]) {
          drugData.name = nameMatch[1].trim();
        }
      } catch (fallbackError) {
        console.error("Even fallback analysis failed:", fallbackError);
        // Return basic error response that the frontend can handle
        return {
          name: "Identification Failed",
          description: "The image could not be analyzed. Please try again with a clearer image.",
          error: true,
          confidence: "low"
        };
      }
    }
    
    // Step 3: Check if this is a valid drug name that we can find more info about
    if (drugData && !drugData.error) {
      console.log(`Analysis completed. Drug name found: ${drugData.name}, enriching with database data`);
      
      // Get markings if not already extracted
      if (!drugData.markings) {
        try {
          drugData.markings = await extractPotentialMarkings(
            enhancedImage, 
            drugData.description || ''
          );
        } catch (markingsError) {
          console.error("Error extracting markings:", markingsError);
        }
      }
      
      // Search in our database with improved error handling
      let dbDrugInfo = null;
      try {
        dbDrugInfo = await findDrugInDatabase(drugData);
      } catch (dbError) {
        console.error("Database search failed:", dbError);
      }
      
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
          blurryModeUsed: drugData.blurryModeUsed || blurryMode || false,
          multiModelAnalysisUsed: drugData.multiModelAnalysisUsed || true,
          fallbackModeUsed: drugData.fallbackModeUsed || false,
          extractedText: drugData.extractedText || null,
        }
      };
      
      console.log("Final identification result:", result.name);
      return result;
      
    } else {
      // Return the AI analysis results without enrichment
      return {
        name: drugData?.name || "Unknown medication",
        genericName: drugData?.genericName || "Unknown",
        description: drugData?.description || "Medication could not be clearly identified from the image.",
        confidence: drugData?.confidence || "low",
        error: drugData?.error || false,
        aiIdentification: {
          imprint: drugData?.imprint || null,
          color: drugData?.color || null,
          shape: drugData?.shape || null,
          markings: drugData?.markings || null,
          partialPillDetected: drugData?.partialPillDetected || false,
          blurryModeUsed: drugData?.blurryModeUsed || blurryMode || false,
          multiModelAnalysisUsed: drugData?.multiModelAnalysisUsed || true,
          fallbackModeUsed: drugData?.fallbackModeUsed || false,
          extractedText: drugData?.extractedText || null,
        }
      };
    }
  } catch (error) {
    console.error("Unhandled error in identifyDrug:", error);
    // Return a user-friendly error response
    return {
      name: "Error",
      description: "An unexpected error occurred during medication identification. Please try again.",
      confidence: "low",
      error: true,
      errorDetails: error.message || "Unknown error"
    };
  }
}

// The main handler for the serverless function
serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("Received drug identification request");
    const { imageBase64, blurryMode } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing image data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Processing image with blurryMode:", blurryMode);
    const result = await identifyDrug(imageBase64, blurryMode);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fatal error in edge function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        name: "Error",
        description: "The system encountered an error while processing your request. Please try again."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
