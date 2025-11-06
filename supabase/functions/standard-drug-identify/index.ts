import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { checkDrugCache as checkCache } from './cache-integration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrugIdentificationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  processingStages: string[];
  confidence: 'high' | 'medium' | 'low';
  fallbackUsed: boolean;
  processingTime: number;
}

interface ProcessingStage {
  name: string;
  success: boolean;
  data?: unknown;
  error?: string;
  processingTime: number;
}

function createResponse(data: DrugIdentificationResult, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Import functions from enhanced-drug-identify for reuse
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

async function checkLocalDatabase(drugName: string, threshold: number = 0.75): Promise<unknown> {
  try {
    console.log(`      🔎 Local DB API call: query="${drugName}", threshold=${threshold}`);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/local-drug-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ query: drugName, threshold })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.data) {
        console.log(`      ✅ Local DB returned: ${data.data.name || 'data found'}`);
      } else {
        console.log(`      ❌ Local DB: No match`);
      }
      return data?.data;
    } else {
      console.log(`      ❌ Local DB API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('      ❌ Local database search exception:', error);
  }
  return null;
}

async function checkDrugCache(drugName: string): Promise<unknown> {
  try {
    return await checkCache(drugName);
  } catch (error) {
    console.error('Cache check error:', error);
  }
  return null;
}

async function try1mgScraping(drugName: string): Promise<unknown> {
  try {
    console.log(`🔍 Scraping 1mg.com for: ${drugName}`);
    
    const searchUrl = `https://www.1mg.com/search/all?name=${encodeURIComponent(drugName)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ 1mg.com search failed: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Extract drug information from HTML
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const descMatch = html.match(/<div class="saltInfo">([^<]+)<\/div>/);
    
    if (nameMatch || descMatch) {
      return {
        name: nameMatch?.[1]?.trim() || drugName,
        genericName: descMatch?.[1]?.trim() || '',
        description: `Information from 1mg.com for ${drugName}`,
        source: '1mg.com'
      };
    }
    
    console.log('❌ No data extracted from 1mg.com');
    return null;
  } catch (error) {
    console.error(`Error scraping 1mg.com: ${error}`);
    return null;
  }
}

async function tryDrugsComScraping(drugName: string): Promise<unknown> {
  try {
    console.log(`🔍 Scraping drugs.com for: ${drugName}`);
    
    const formattedDrugName = drugName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.drugs.com/${formattedDrugName}.html`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      const searchUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(drugName)}`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!searchResponse.ok) return null;
      
      const searchHtml = await searchResponse.text();
      const firstResultMatch = searchHtml.match(/<a href="(\/[^"]+)" class="ddc-link-[^"]+">/);
      
      if (firstResultMatch?.[1]) {
        const resultUrl = `https://www.drugs.com${firstResultMatch[1]}`;
        const detailResponse = await fetch(resultUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (detailResponse.ok) {
          return parseDrugsComHTML(await detailResponse.text(), drugName);
        }
      }
      return null;
    }
    
    const html = await response.text();
    return parseDrugsComHTML(html, drugName);
  } catch (error) {
    console.error(`Error scraping drugs.com: ${error}`);
    return null;
  }
}

function parseDrugsComHTML(html: string, drugName: string): unknown {
  try {
    const drugInfo = {
      id: crypto.randomUUID(),
      name: drugName,
      genericName: "",
      brandNames: [] as string[],
      manufacturer: "",
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
      drugClass: "",
      color: "",
      shape: "",
      imprint: ""
    };
    
    // Extract generic name
    const genericNameMatch = html.match(/<p class="drug-subtitle">(.*?)<\/p>/s);
    if (genericNameMatch?.[1]) {
      drugInfo.genericName = genericNameMatch[1].trim();
    }
    
    // Extract description
    const descriptionMatch = html.match(/<div class="contentBox">[\s\S]*?<p>([\s\S]*?)<\/p>/);
    if (descriptionMatch?.[1]) {
      drugInfo.description = descriptionMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Extract side effects
    const sideEffectsMatch = html.match(/<h2[^>]*>Side Effects<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
    if (sideEffectsMatch?.[1]) {
      const sideEffects = sideEffectsMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/g);
      if (sideEffects) {
        drugInfo.sideEffects = sideEffects.map((item: string) => {
          return item
            .replace(/<li[^>]*>/, '')
            .replace(/<\/li>/, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        });
      }
    }
    
    // Extract drug class
    const drugClassMatch = html.match(/<strong>Drug class:<\/strong>\s*([^<]+)(?:<|$)/i);
    if (drugClassMatch?.[1]) {
      drugInfo.drugClass = drugClassMatch[1].trim();
    }
    
    // Extract indications
    const indicationsMatch = html.match(/<h2[^>]*>Uses<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    if (indicationsMatch?.[1]) {
      const indicationsText = indicationsMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      drugInfo.indications = indicationsText.split(/\.\s+/).filter((item: string) => item.length > 5)
        .map((item: string) => item.trim() + (item.endsWith('.') ? '' : '.'));
    }
    
    console.log(`Successfully parsed drugs.com data for: ${drugName}`);
    return drugInfo;
  } catch (error) {
    console.error(`Error parsing drugs.com HTML: ${error}`);
    return null;
  }
}

/**
 * FREE Alternative OCR using OCR.space API (no API key needed for free tier!)
 * Fallback when Gemini OCR fails
 */
async function performFreeOCR(imageBase64: string): Promise<unknown> {
  try {
    console.log('🆓 Trying FREE OCR.space API (backup OCR)...');
    
    // Prepare image data
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;
    
    // Get OCR.space API key from Supabase secrets
    const ocrApiKey = Deno.env.get("OCR_SPACE_API_KEY");
    if (!ocrApiKey) {
      console.log('❌ OCR_SPACE_API_KEY not found in environment');
      return null;
    }
    
    console.log(`   Using OCR.space API key: ${ocrApiKey.substring(0, 8)}...`);
    
    // OCR.space API with your personal free API key
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Use OCR Engine 2 (better for photos)
    formData.append('apikey', ocrApiKey); // Your personal free API key
    
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      console.log(`❌ OCR.space API failed: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    
    if (result.IsErroredOnProcessing) {
      console.log(`❌ OCR.space processing error: ${result.ErrorMessage?.[0] || 'Unknown'}`);
      return null;
    }
    
    const extractedText = result.ParsedResults?.[0]?.ParsedText || '';
    
    if (!extractedText || extractedText.length < 3) {
      console.log('❌ OCR.space: No text extracted');
      return null;
    }
    
    console.log(`✅ OCR.space extracted text (${extractedText.length} chars)`);
    console.log(`   First 200 chars: ${extractedText.substring(0, 200)}`);
    
    // Parse extracted text intelligently
    const lines = extractedText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    
    // Try to identify drug name (usually in first 3 lines, in caps or prominent)
    let drugName = 'Unknown';
    let genericName = '';
    
    // Look for drug name (typically uppercase or title case in first lines)
    for (const line of lines.slice(0, 5)) {
      // Skip very long lines (likely descriptions)
      if (line.length > 50) continue;
      
      // Drug name patterns: UPPERCASE, Title Case, or ends with numbers (like "Crocin 650")
      if (/^[A-Z][A-Z\s-]+\d*$/.test(line) || /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*-?\s*\d+)?$/.test(line)) {
        drugName = line;
        console.log(`   Identified drug name: "${drugName}"`);
        break;
      }
    }
    
    // Look for generic name (composition, contains, active ingredient)
    for (const line of lines) {
      if (/composition|contains|ingredient|generic/i.test(line)) {
        const nextLineIndex = lines.indexOf(line) + 1;
        if (nextLineIndex < lines.length) {
          genericName = lines[nextLineIndex].replace(/[^a-zA-Z\s]/g, '').trim();
          console.log(`   Identified generic: "${genericName}"`);
          break;
        }
      }
    }
    
    // If still no drug name, use first substantial line
    if (drugName === 'Unknown' && lines.length > 0) {
      drugName = lines[0].substring(0, 50); // First line, max 50 chars
      console.log(`   Using first line as drug name: "${drugName}"`);
    }
    
    return {
      name: drugName,
      genericName: genericName,
      description: `Extracted via OCR.space: ${extractedText.substring(0, 200)}`,
      confidence: 'medium',
      ocrSource: 'ocr.space',
      fullText: extractedText
    };
    
  } catch (error) {
    console.error('❌ Free OCR error:', error);
    return null;
  }
}

async function performGeminiAnalysis(imageBase64: string): Promise<unknown> {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found!');
      return null;
    }
    
    console.log('🤖 Calling Gemini API for OCR...');
    console.log(`   API Key present: ${!!apiKey}`);
    console.log(`   Image data length: ${imageBase64.length} chars`);
    
    const prompt = `You are a pharmaceutical OCR expert. Your job is to READ THE EXACT TEXT from this medication image.

🚨 CRITICAL INSTRUCTIONS:
1. READ EVERY VISIBLE TEXT on the packaging/bottle/box
2. Return the EXACT brand name as written (e.g., "Vitacure Syrup", "Crocin 650mg")
3. Look for composition/ingredients section and extract the generic/active ingredient
4. DO NOT invent or guess - only return what you can actually see
5. If you cannot read the text clearly, return "Unknown" for that field

WHAT TO EXTRACT:
- Brand Name: The main product name on the package
- Generic Name: Active ingredient from "Composition:" or "Contains:" section
- Any visible text that helps identify the drug

EXAMPLES:
✅ CORRECT: "Vitacure Syrup" → name: "Vitacure Syrup", genericName: "Multivitamin"
✅ CORRECT: "Crocin Advance" → name: "Crocin Advance", genericName: "Paracetamol"
❌ WRONG: Making up names like "VitaCure Multivitamin Complex"

OUTPUT FORMAT (JSON only):
{
  "name": "EXACT brand name from package",
  "genericName": "Active ingredient from composition",
  "description": "Brief description if visible",
  "confidence": "high/medium/low",
  "color": "Dominant color",
  "shape": "bottle/box/tablet/capsule",
  "imprint": "Imprint code if visible"
}

Return ONLY valid JSON, no markdown:`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64
            }}
          ]
        }],
        generation_config: { temperature: 0.1, max_output_tokens: 2000 }
      })
    });
    
    console.log(`   Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Gemini response received`);
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`   Raw Gemini text (first 200 chars): ${text.substring(0, 200)}`);
        
        // Try to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log(`✅ Gemini OCR Success:`);
            console.log(`   Name: "${parsed.name}"`);
            console.log(`   Generic: "${parsed.genericName}"`);
            console.log(`   Confidence: ${parsed.confidence}`);
            return parsed;
          } catch (parseError) {
            console.error(`❌ JSON parse error: ${parseError}`);
            console.error(`   Attempted to parse: ${jsonMatch[0].substring(0, 100)}...`);
          }
        } else {
          console.error(`❌ No JSON found in Gemini response`);
          console.error(`   Full response: ${text}`);
        }
      } else {
        console.error(`❌ No text in Gemini response`);
        console.error(`   Response structure:`, JSON.stringify(data, null, 2).substring(0, 500));
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Gemini API error: ${response.status}`);
      console.error(`   Error: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.error('❌ Gemini analysis exception:', error);
    console.error(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  console.log('⚠️ Gemini OCR failed - returning null');
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const overallStartTime = Date.now();
  const stages: ProcessingStage[] = [];

  try {
    const { imageBase64 } = await req.json();
    
    console.log('='.repeat(80));
    console.log(`🔍 STANDARD MODE DRUG IDENTIFICATION`);
    console.log('='.repeat(80));
    console.log('🔍 Fast search using local database, cache, and fallback mechanisms');
    console.log('='.repeat(80));

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

    // Stage 1: Gemini OCR + Text Extraction
    console.log('🔍 Stage 1: Gemini OCR + Text Extraction...');
    const geminiResult = await performGeminiAnalysis(imageBase64);
    stages.push({
      name: 'gemini-ocr',
      success: !!geminiResult,
      data: geminiResult,
      processingTime: Date.now() - overallStartTime
    });

    let drugName = (geminiResult as any)?.name || 'Unknown';
    let genericName = (geminiResult as any)?.genericName || '';
    console.log(`📝 Extracted - Brand: "${drugName}", Generic: "${genericName}"`);

    // Stage 1.5: If Gemini OCR failed, try FREE alternative OCR first
    if (!geminiResult || drugName === 'Unknown' || drugName.toLowerCase().includes('unknown')) {
      console.log('\n🔄 === GEMINI OCR FAILED - TRYING FREE BACKUP OCR ===');
      
      // Try OCR.space (completely free, no API key needed!)
      const freeOcrResult = await performFreeOCR(imageBase64);
      
      if (freeOcrResult && (freeOcrResult as any)?.name && (freeOcrResult as any).name !== 'Unknown') {
        console.log('✅ FREE OCR SUCCESS!');
        console.log(`   Extracted drug name: "${(freeOcrResult as any).name}"`);
        console.log(`   Extracted generic: "${(freeOcrResult as any).genericName || 'N/A'}"`);
        
        // Update drugName and genericName for cache/local DB search
        drugName = (freeOcrResult as any).name;
        genericName = (freeOcrResult as any).genericName || '';
        
        stages.push({
          name: 'free-ocr-backup',
          success: true,
          data: freeOcrResult,
          processingTime: Date.now() - overallStartTime
        });
        
        console.log('✅ FREE OCR provided drug name - continuing to cache/local DB search...\n');
      } else {
        console.log('❌ Free OCR also failed - trying multi-source comprehensive analysis...');
        
        // Stage 1.6: Last resort - multi-source comprehensive analysis
        console.log('\n🔄 === ACTIVATING MULTI-SOURCE COMPREHENSIVE FALLBACK ===');
        console.log('⚡ Calling multi-source API for direct image analysis...');
        
        try {
        const multiSourceResponse = await fetch(`${SUPABASE_URL}/functions/v1/multi-source-drug-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ 
            imageBase64,
            fallbackMode: true // Signal that this is a fallback request
          })
        });

        if (multiSourceResponse.ok) {
          const multiSourceData = await multiSourceResponse.json();
          
          if (multiSourceData.success && multiSourceData.data) {
            console.log('✅ Multi-source comprehensive analysis SUCCESSFUL!');
            console.log(`   Drug identified: ${multiSourceData.data.name || 'N/A'}`);
            console.log(`   Generic: ${multiSourceData.data.genericName || 'N/A'}`);
            console.log(`   Completeness: ${multiSourceData.data.completeness || 0}%`);
            
            // If quality is good enough, return immediately
            const completeness = multiSourceData.data.completeness || 0;
            if (completeness >= 40) {
              stages.push({
                name: 'multi-source-comprehensive-fallback',
                success: true,
                data: multiSourceData.data,
                processingTime: Date.now() - overallStartTime
              });

              return createResponse({
                success: true,
                data: multiSourceData.data,
                processingStages: stages.map(s => s.name),
                confidence: completeness >= 70 ? 'high' : 'medium',
                fallbackUsed: true,
                processingTime: Date.now() - overallStartTime
              });
            } else {
              console.log(`⚠️ Multi-source data quality below threshold: ${completeness}%`);
              // Update drugName and genericName from multi-source for further processing
              if (multiSourceData.data.name && multiSourceData.data.name !== 'Unknown') {
                drugName = multiSourceData.data.name;
                genericName = multiSourceData.data.genericName || '';
                console.log(`✅ Updated from multi-source - Brand: "${drugName}", Generic: "${genericName}"`);
              }
            }
          } else {
            console.log('⚠️ Multi-source API returned no usable data');
          }
        } else {
          console.log(`⚠️ Multi-source API failed: ${multiSourceResponse.status}`);
        }
        } catch (error) {
          console.error(`❌ Multi-source comprehensive fallback error:`, error);
        }
      }
      
      console.log('=== COMPREHENSIVE FALLBACK COMPLETE ===\n');
    }

    // Stage 2: Cache Check with Name Variations (Fastest - check first!)
    console.log('🔍 Stage 2: Enhanced Cache Check with Name Variations...');
    if ((drugName && !drugName.toLowerCase().includes('unknown')) || (genericName && !genericName.toLowerCase().includes('unknown'))) {
      // Build candidates from brand and (if available) generic
      const candidates = new Set<string>();
      const addVariations = (base: string) => {
        if (!base) return;
        candidates.add(base);
        candidates.add(`${base} Syrup`);
        candidates.add(`${base} Tablet`);
        candidates.add(`${base} Capsule`);
        candidates.add(base.replace(/\s+(Syrup|Tablet|Capsule|Drops|Injection)$/i, ''));
      };
      addVariations(drugName);
      if (genericName && !genericName.toLowerCase().includes('unknown')) {
        addVariations(genericName);
      }

      const uniqueVariations = [...candidates].filter(v => v && v.trim().length > 1);
      console.log(`   Trying ${uniqueVariations.length} brand/generic variations:`);
      uniqueVariations.forEach((v, i) => console.log(`      ${i + 1}. "${v}"`));

      for (const variation of uniqueVariations) {
        console.log(`   Checking cache for: "${variation}"`);
        const cachedResult = await checkDrugCache(variation);
        if (cachedResult) {
          console.log(`✅ Cache HIT with variation: "${variation}"!`);
          stages.push({
            name: 'cache-search',
            success: true,
            data: cachedResult,
            processingTime: Date.now() - overallStartTime
          });

          return createResponse({
            success: true,
            data: cachedResult,
            processingStages: stages.map(s => s.name),
            confidence: 'high',
            fallbackUsed: false,
            processingTime: Date.now() - overallStartTime
          });
        }
      }
      console.log('❌ Cache miss for all brand/generic variations');
    }

    // Stage 3: Smart Local Database Search (Brand + Generic + Variations)
    console.log('🔍 Stage 3: Smart Local Database Search...');
    console.log(`   Available data - Brand: "${drugName}", Generic: "${genericName}"`);
    
    // Build intelligent search queries
    const searchQueries: string[] = [];
    
    // 1. Try brand name
    if (drugName && drugName !== 'Unknown' && !drugName.toLowerCase().includes('unknown')) {
      searchQueries.push(drugName);
      
      // Brand name variations
      searchQueries.push(drugName.replace(/[-\s]/g, '')); // "Paragreen-650" → "Paragreen650"
      searchQueries.push(drugName.replace(/[0-9]+/g, '').trim()); // "Paragreen-650" → "Paragreen"
      searchQueries.push(drugName.replace(/[\s-]+/g, ' ').trim()); // Normalize spaces
    }
    
    // 2. Try generic name
    if (genericName && genericName !== 'Unknown' && !genericName.toLowerCase().includes('unknown')) {
      searchQueries.push(genericName);
      
      // Generic name variations
      searchQueries.push(genericName.replace(/[-\s]/g, '')); // Handle spacing
      
      // Try first word of generic if it's multi-word (e.g., "Paracetamol and Caffeine" → "Paracetamol")
      const firstWord = genericName.split(/\s+/)[0];
      if (firstWord && firstWord.length > 3) {
        searchQueries.push(firstWord);
      }
    }
    
    // Remove duplicates and empty strings
    const uniqueQueries = [...new Set(searchQueries)].filter(q => q && q.length > 2);
    
    console.log(`   📋 Generated ${uniqueQueries.length} smart search queries:`);
    uniqueQueries.forEach((q, i) => console.log(`      ${i + 1}. "${q}"`));
    
    // Try each query with decreasing threshold for fuzzy matching
    const thresholds = [0.85, 0.75, 0.65]; // High precision → Medium → More lenient
    
    for (const threshold of thresholds) {
      console.log(`\n   🔍 Trying threshold: ${threshold * 100}%`);
      
      for (const query of uniqueQueries) {
        console.log(`      Searching: "${query}" at ${threshold * 100}% similarity`);
        const localResult = await checkLocalDatabase(query, threshold);
        
        if (localResult) {
          console.log(`      🎉 ✅ MATCH FOUND with "${query}" at ${threshold * 100}% threshold!`);
          console.log(`      Returning: ${(localResult as any)?.name || 'Drug data'}`);
          
          stages.push({
            name: 'local-database-smart-search',
            success: true,
            data: localResult,
            processingTime: Date.now() - overallStartTime
          });

          return createResponse({
            success: true,
            data: localResult,
            processingStages: stages.map(s => s.name),
            confidence: threshold >= 0.75 ? 'high' : 'medium',
            fallbackUsed: false,
            processingTime: Date.now() - overallStartTime
          });
        }
      }
      
      console.log(`   ❌ No matches at ${threshold * 100}% threshold`);
    }
    
    console.log('\n   ❌ Local database search exhausted - no matches found');
    console.log(`      Tried ${uniqueQueries.length} queries across ${thresholds.length} thresholds`);
    console.log(`      Total attempts: ${uniqueQueries.length * thresholds.length}`);

    // Stage 4: Fallback Mechanism - 1mg.com + Drugs.com Web Scraping
    console.log('🔄 Stage 4: Fallback - Web Scraping (1mg.com + Drugs.com)...');
    if (drugName && drugName !== 'Unknown') {
      const searchTerm = drugName;
      
      // Try 1mg.com first (Indian database)
      console.log(`   Trying 1mg.com for: "${searchTerm}"`);
      const oneMgResult = await try1mgScraping(searchTerm);
      
      if (oneMgResult) {
        console.log('✅ 1mg.com scraping successful!');
        stages.push({
          name: '1mg-fallback',
          success: true,
          data: oneMgResult,
          processingTime: Date.now() - overallStartTime
        });

        return createResponse({
          success: true,
          data: oneMgResult,
          processingStages: stages.map(s => s.name),
          confidence: 'medium',
          fallbackUsed: true,
          processingTime: Date.now() - overallStartTime
        });
      }
      
      // Try Drugs.com as backup
      console.log(`   Trying drugs.com for: "${searchTerm}"`);
      const drugsComResult = await tryDrugsComScraping(searchTerm);
      
      if (drugsComResult) {
        console.log('✅ Drugs.com scraping successful!');
        stages.push({
          name: 'drugs-com-fallback',
          success: true,
          data: drugsComResult,
          processingTime: Date.now() - overallStartTime
        });

        return createResponse({
          success: true,
          data: drugsComResult,
          processingStages: stages.map(s => s.name),
          confidence: 'medium',
          fallbackUsed: true,
          processingTime: Date.now() - overallStartTime
        });
      }
      
      console.log('❌ Both 1mg.com and Drugs.com scraping failed');
    }

    // Stage 5: Supabase Edge Function Fallback (Multi-Source API)
    console.log('🔄 Stage 5: Supabase Multi-Source API Fallback...');
    if (drugName && drugName !== 'Unknown' && !drugName.toLowerCase().includes('unknown')) {
      try {
        console.log(`   Calling multi-source-drug-api for: "${drugName}"`);
        const multiSourceResponse = await fetch(`${SUPABASE_URL}/functions/v1/multi-source-drug-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ drugName })
        });

        if (multiSourceResponse.ok) {
          const multiSourceData = await multiSourceResponse.json();
          
          if (multiSourceData.success && multiSourceData.data) {
            console.log('✅ Multi-source API successful!');
            console.log(`   Data completeness: ${multiSourceData.data.completeness || 0}%`);
            
            // Validate data quality before returning
            const completeness = multiSourceData.data.completeness || 0;
            if (completeness >= 40) {
              stages.push({
                name: 'multi-source-api-fallback',
                success: true,
                data: multiSourceData.data,
                processingTime: Date.now() - overallStartTime
              });

              return createResponse({
                success: true,
                data: multiSourceData.data,
                processingStages: stages.map(s => s.name),
                confidence: completeness >= 70 ? 'high' : 'medium',
                fallbackUsed: true,
                processingTime: Date.now() - overallStartTime
              });
            } else {
              console.log(`⚠️ Multi-source data quality too low: ${completeness}%`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Multi-source API error:`, error);
      }
    }

    // Stage 6: Data Quality Validation & Enhancement
    console.log('🔍 Stage 6: Final Data Quality Check & Enhancement...');
    
    // Build fallback data from Gemini + add safety information
    const fallbackData = {
      id: crypto.randomUUID(),
      name: drugName || "Unknown Medication",
      genericName: (geminiResult as any)?.genericName || "",
      description: (geminiResult as any)?.description || "Unable to fully identify this medication. Please consult a healthcare professional.",
      confidence: "low",
      color: (geminiResult as any)?.color || "",
      shape: (geminiResult as any)?.shape || "",
      imprint: (geminiResult as any)?.imprint || "",
      manufacturer: "",
      category: "",
      drugClass: "",
      dosageAndAdmin: "",
      mechanism: "",
      pregnancy: "",
      sideEffects: [] as string[],
      warnings: [
        "⚠️ Unable to fully verify this medication from authoritative sources",
        "Do not take any unidentified medication",
        "Consult a healthcare provider or pharmacist for proper identification"
      ] as string[],
      interactions: [] as string[],
      indications: [] as string[],
      contraindications: [] as string[],
      storage: "Store as directed by healthcare provider",
      prescriptionStatus: "Unknown",
      brandNames: [] as string[],
      recommendations: [
        "Take a clearer, well-lit photo of the medication packaging",
        "Include the brand name and composition details in the image",
        "Visit a pharmacy with the medication for professional identification",
        "Check the medication leaflet for complete information"
      ] as string[]
    };
    
    // Perform basic data validation
    const hasBasicInfo = !!(drugName && drugName !== 'Unknown');
    const hasVisualInfo = !!(fallbackData.color || fallbackData.shape || fallbackData.imprint);
    
    console.log('📊 Final Data Quality Report:');
    console.log(`   Has basic info (name): ${hasBasicInfo}`);
    console.log(`   Has visual info: ${hasVisualInfo}`);
    console.log(`   Confidence: ${fallbackData.confidence}`);
    
    // Add data quality metadata
    (fallbackData as any).dataQuality = {
      hasBasicInfo,
      hasVisualInfo,
      verified: false,
      lastChecked: new Date().toISOString(),
      completeness: hasBasicInfo ? 20 : 10,
      warnings: fallbackData.warnings
    };

    stages.push({
      name: 'partial-identification',
      success: true,
      data: fallbackData,
      processingTime: Date.now() - overallStartTime
    });

    return createResponse({
      success: true,
      data: fallbackData,
      processingStages: stages.map(s => s.name),
      confidence: 'low',
      fallbackUsed: true,
      processingTime: Date.now() - overallStartTime
    });

  } catch (error) {
    console.error('Standard drug identification error:', error);
    
    return createResponse({
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
      processingStages: stages.map(s => s.name),
      confidence: 'low',
      fallbackUsed: false,
      processingTime: Date.now() - overallStartTime
    }, 500);
  }
});
