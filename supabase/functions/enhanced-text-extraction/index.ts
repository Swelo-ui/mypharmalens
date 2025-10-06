// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import "https://deno.land/x/xhr@0.1.0/mod.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TextExtractionResult {
  success: boolean;
  extractedText: string;
  confidence: number;
  method: string;
  processingTime: number;
  imageQuality: 'high' | 'medium' | 'low';
  error?: string;
}

// Helper function to create consistent response
function createResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Enhanced image preprocessing for better OCR results
async function preprocessImage(imageBase64: string): Promise<string> {
  try {
    // For now, return the original image
    // In a production environment, you would implement:
    // - Noise reduction
    // - Contrast enhancement
    // - Rotation correction
    // - Sharpening filters
    return imageBase64;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    return imageBase64;
  }
}

// Assess image quality for OCR
function assessImageQuality(imageBase64: string): 'high' | 'medium' | 'low' {
  try {
    // Simple heuristic based on image size and format
    const sizeInBytes = (imageBase64.length * 3) / 4;
    
    if (sizeInBytes > 500000) return 'high';
    if (sizeInBytes > 200000) return 'medium';
    return 'low';
  } catch {
    return 'medium';
  }
}

// Primary OCR using Gemini Vision API
async function extractTextWithGemini(imageBase64: string): Promise<{ text: string; confidence: number }> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = `
    Extract ALL visible text from this image with maximum accuracy. Focus on:
    1. Medication names (brand and generic)
    2. Dosage information (mg, ml, etc.)
    3. Manufacturer names
    4. Imprint codes, numbers, and letters
    5. Any other text visible on pills, tablets, capsules, or packaging
    
    Return ONLY the extracted text, preserving spacing and formatting.
    If no text is visible, return "NO_TEXT_DETECTED".
    Be extremely thorough and accurate.
  `;

  try {
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
          max_output_tokens: 1000 
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Calculate confidence based on text quality
    let confidence = 0.5;
    if (extractedText && extractedText !== "NO_TEXT_DETECTED") {
      confidence = Math.min(0.95, 0.6 + (extractedText.length / 100) * 0.3);
    }

    return {
      text: extractedText.trim(),
      confidence
    };
  } catch (error) {
    console.error('Gemini OCR error:', error);
    throw error;
  }
}

// Fallback OCR using alternative method (simulated)
async function extractTextFallback(imageBase64: string): Promise<{ text: string; confidence: number }> {
  try {
    // This would integrate with alternative OCR services like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // For now, we'll simulate a basic extraction
    
    console.log('Using fallback OCR method');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a basic result indicating fallback was used
    return {
      text: "FALLBACK_OCR_USED",
      confidence: 0.3
    };
  } catch (error) {
    console.error('Fallback OCR error:', error);
    throw error;
  }
}

// Enhanced text cleaning and validation
function cleanExtractedText(text: string): string {
  if (!text || text === "NO_TEXT_DETECTED" || text === "FALLBACK_OCR_USED") {
    return text;
  }

  return text
    .replace(/[^\w\s\-\.\/\(\)]/g, ' ') // Remove special characters except common ones
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toUpperCase(); // Standardize case for better matching
}

// Validate extracted text quality
function validateTextQuality(text: string): { isValid: boolean; confidence: number } {
  if (!text || text === "NO_TEXT_DETECTED" || text === "FALLBACK_OCR_USED") {
    return { isValid: false, confidence: 0 };
  }

  let confidence = 0.5;
  
  // Check for common medication patterns
  const medicationPatterns = [
    /\d+\s*(mg|ml|mcg|g|iu|units?)/i, // Dosage patterns
    /[A-Z]{2,}\s*\d+/i, // Imprint patterns
    /\b(tablet|capsule|pill|mg|ml)\b/i, // Medication terms
  ];

  const patternMatches = medicationPatterns.filter(pattern => pattern.test(text)).length;
  confidence += patternMatches * 0.15;

  // Length-based confidence adjustment
  if (text.length > 5) confidence += 0.1;
  if (text.length > 15) confidence += 0.1;

  return {
    isValid: confidence > 0.4,
    confidence: Math.min(0.95, confidence)
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request
    const { imageBase64, options = {} } = await req.json();

    if (!imageBase64) {
      return createResponse({
        success: false,
        error: "No image provided",
        extractedText: "",
        confidence: 0,
        method: "none",
        processingTime: Date.now() - startTime,
        imageQuality: "low"
      }, 400);
    }

    // Assess image quality
    const imageQuality = assessImageQuality(imageBase64);
    console.log(`Image quality assessed as: ${imageQuality}`);

    // Preprocess image if needed
    const processedImage = await preprocessImage(imageBase64);

    let result: TextExtractionResult;

    try {
      // Primary extraction with Gemini
      console.log('Attempting primary OCR with Gemini...');
      const geminiResult = await extractTextWithGemini(processedImage);
      
      const cleanedText = cleanExtractedText(geminiResult.text);
      const validation = validateTextQuality(cleanedText);

      result = {
        success: true,
        extractedText: cleanedText,
        confidence: validation.confidence,
        method: "gemini-vision",
        processingTime: Date.now() - startTime,
        imageQuality
      };

      // If primary method failed or low confidence, try fallback
      if (!validation.isValid || validation.confidence < 0.5) {
        console.log('Primary OCR low confidence, trying fallback...');
        
        try {
          const fallbackResult = await extractTextFallback(processedImage);
          const fallbackCleaned = cleanExtractedText(fallbackResult.text);
          const fallbackValidation = validateTextQuality(fallbackCleaned);

          // Use fallback if it's better
          if (fallbackValidation.confidence > validation.confidence) {
            result.extractedText = fallbackCleaned;
            result.confidence = fallbackValidation.confidence;
            result.method = "fallback-ocr";
          }
        } catch (fallbackError) {
          console.error('Fallback OCR failed:', fallbackError);
          // Continue with primary result
        }
      }

    } catch (primaryError) {
      console.error('Primary OCR failed:', primaryError);
      
      // Try fallback as primary method failed
      try {
        console.log('Primary OCR failed, using fallback...');
        const fallbackResult = await extractTextFallback(processedImage);
        const cleanedText = cleanExtractedText(fallbackResult.text);
        const validation = validateTextQuality(cleanedText);

        result = {
          success: true,
          extractedText: cleanedText,
          confidence: validation.confidence,
          method: "fallback-ocr",
          processingTime: Date.now() - startTime,
          imageQuality
        };
      } catch (fallbackError) {
        console.error('All OCR methods failed:', fallbackError);
        
        result = {
          success: false,
          extractedText: "",
          confidence: 0,
          method: "none",
          processingTime: Date.now() - startTime,
          imageQuality,
          error: "All text extraction methods failed"
        };
      }
    }

    console.log(`Text extraction completed: ${result.method}, confidence: ${result.confidence}`);
    return createResponse(result);

  } catch (error) {
    console.error('Text extraction service error:', error);
    
    return createResponse({
      success: false,
      extractedText: "",
      confidence: 0,
      method: "error",
      processingTime: Date.now() - startTime,
      imageQuality: "unknown",
      error: error.message || "Unknown error occurred"
    }, 500);
  }
});