import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to translate text using our translation edge function
async function translateText(text, targetLang = 'en') {
  try {
    if (!text || typeof text !== 'string') return text;
    
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/translate-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ text, targetLang }),
    });

    if (!response.ok) return text; // Return original if translation fails
    
    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original on error
  }
}

// Function to get drug information from drugs.com
async function getDrugInfoFromDrugsCom(drugName) {
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
async function findDrugByImprint(imprint) {
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
function parseHtmlForDrugInfo(html, drugName) {
  try {
    console.log(`Parsing HTML for drug: ${drugName}`);
    
    const drugInfo = {
      name: drugName,
      genericName: "",
      brandNames: [],
      alternativeMedications: [],
      manufacturer: "",
      category: "",
      description: "",
      dosageAndAdmin: "",
      detailedDosage: "",
      sideEffects: [],
      warnings: [],
      interactions: [],
      storage: "",
      mechanism: "",
      indications: [],
      contraindications: [],
      prescriptionStatus: "Unknown",
      pregnancy: "",
      drugClass: ""
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
    
    // Extract drug class
    const drugClassMatch = html.match(/<strong>Drug class:<\/strong>\s*([^<]+)(?:<|$)/i);
    if (drugClassMatch && drugClassMatch[1]) {
      drugInfo.drugClass = drugClassMatch[1].trim();
    } else if (categoryMatch && categoryMatch[1]) {
      // Fallback to category if class not found
      drugInfo.drugClass = categoryMatch[1].trim();
    }
    
    // Extract brand names
    const brandNamesMatch = html.match(/<strong>Brand name[s]?:<\/strong>\s*([^<]+)(?:<|$)/i);
    if (brandNamesMatch && brandNamesMatch[1]) {
      drugInfo.brandNames = brandNamesMatch[1]
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
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
        drugInfo.sideEffects = sideEffects.map((item) => {
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
          .map((effect) => effect.trim())
          .filter((effect) => effect.length > 5)
          .map((effect) => effect + (effect.endsWith('.') ? '' : '.'));
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
      
      drugInfo.warnings = warningsText.split(/\.\s+/).filter((warning) => warning.length > 10)
        .map((warning) => warning.trim() + (warning.endsWith('.') ? '' : '.'));
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
      
      // Extract detailed dosage by combining multiple paragraphs if available
      const detailedDosageMatches = html.match(/<h2[^>]*>Dosage[\s\S]*?<\/h2>([\s\S]*?)(?:<h2|<div class="contentBox)/i);
      if (detailedDosageMatches && detailedDosageMatches[1]) {
        // Extract all paragraphs in the dosage section
        const paragraphs = detailedDosageMatches[1].match(/<p[^>]*>([\s\S]*?)<\/p>/g);
        if (paragraphs && paragraphs.length > 1) {
          const allDosageInfo = paragraphs.map(p => 
            p.replace(/<[^>]*>/g, '')
             .replace(/\s+/g, ' ')
             .trim()
          ).join('\n\n');
          
          drugInfo.detailedDosage = allDosageInfo;
        }
      }
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
      
      drugInfo.indications = indicationsText.split(/\.\s+/).filter((item) => item.length > 5)
        .map((item) => item.trim() + (item.endsWith('.') ? '' : '.'));
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
    
    // Extract storage information
    const storageMatch = html.match(/<h2[^>]*>Storage<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                       html.match(/<h3[^>]*>Storage<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) ||
                       html.match(/Store\s+[^<.]+(?:\.|<)/i);
    
    if (storageMatch && storageMatch[1]) {
      drugInfo.storage = storageMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    } else if (storageMatch && storageMatch[0]) {
      drugInfo.storage = storageMatch[0]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      drugInfo.storage = "Store at room temperature away from moisture, heat, and light. Keep out of reach of children.";
    }
    
    // Enhanced alternative medications extraction
    const alternativesMatch = html.match(/<h2[^>]*>Alternative[s]? (?:to|for)[^<]*<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i) ||
                            html.match(/<h3[^>]*>Alternative[s]? (?:to|for)[^<]*<\/h3>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i) ||
                            html.match(/<p[^>]*>Alternative[s]?(?:[^<]*):([^<]+)<\/p>/i);
    
    if (alternativesMatch) {
      if (alternativesMatch[1].includes("<li")) {
        // Extract alternatives from list items
        const alternatives = alternativesMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/g);
        if (alternatives) {
          drugInfo.alternativeMedications = alternatives.map(item => 
            item.replace(/<li[^>]*>/, '')
                .replace(/<\/li>/, '')
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ')
                .trim()
          );
        }
      } else {
        // Extract alternatives from text
        drugInfo.alternativeMedications = alternativesMatch[1].split(/,|;/).map(item => item.trim());
      }
    }
    
    // Look for similar drugs mentioned in text
    const similarDrugsMatch = html.match(/(?:similar to|like|such as|including|alternatives include)[:\s]+([^.<]+)(?:\.|<)/i);
    if (similarDrugsMatch && similarDrugsMatch[1]) {
      const mentionedDrugs = similarDrugsMatch[1].split(/,|;|\band\b/).map(drug => drug.trim());
      drugInfo.alternativeMedications = [
        ...new Set([...drugInfo.alternativeMedications, ...mentionedDrugs])
      ].filter(drug => drug && drug.length > 2);
    }
    
    console.log(`Successfully parsed drug info for: ${drugName}`);
    return drugInfo;
  } catch (error) {
    console.error(`Error parsing HTML: ${error.message}`);
    return null;
  }
}

// New function to get alternative medications from MedlinePlus
async function getAlternativeMedicationsFromMedlinePlus(drugName) {
  try {
    // MedlinePlus often has a "Related Information" or "See Also" section with alternatives
    const response = await fetch(`https://medlineplus.gov/druginfo/meds/a${drugName.toLowerCase().replace(/\s+/g, '')}.html`);
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Look for related medications section
    const relatedSection = html.match(/<h2[^>]*>(?:See Also|Related Information)[^<]*<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i);
    
    if (relatedSection && relatedSection[1]) {
      const relatedItems = relatedSection[1].match(/<li[^>]*>([\s\S]*?)<\/li>/g);
      
      if (relatedItems) {
        return relatedItems.map(item => 
          item.replace(/<li[^>]*>/, '')
              .replace(/<\/li>/, '')
              .replace(/<[^>]*>/g, '')
              .replace(/\s+/g, ' ')
              .trim()
        ).filter(item => item.length > 2);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting alternatives from MedlinePlus: ${error.message}`);
    return null;
  }
}

// Function to get drug information from MedlinePlus
async function getDrugInfoFromMedlinePlus(drugName) {
  try {
    console.log(`Searching MedlinePlus for: ${drugName}`);
    
    // Format the drug name for URL
    const formattedDrugName = drugName.toLowerCase().replace(/\s+/g, '+');
    const searchUrl = `https://medlineplus.gov/druginfo/meds/a${formattedDrugName}.html`;
    
    // Attempt direct access first
    let response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // If direct access fails, try search
    if (!response.ok) {
      const searchPageUrl = `https://medlineplus.gov/druginfo/drug_Aa.html`;
      response = await fetch(searchPageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        return null;
      }
      
      const searchPageHtml = await response.text();
      
      // Look for drug link in the index page
      const drugLinkRegex = new RegExp(`<a href="([^"]+)"[^>]*>${drugName}</a>`, 'i');
      const match = searchPageHtml.match(drugLinkRegex);
      
      if (match && match[1]) {
        const drugUrl = new URL(match[1], 'https://medlineplus.gov').href;
        response = await fetch(drugUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          return null;
        }
      } else {
        return null;
      }
    }
    
    const html = await response.text();
    return parseMedlinePlusHtml(html, drugName);
    
  } catch (error) {
    console.error(`Error fetching MedlinePlus data: ${error.message}`);
    return null;
  }
}

// Function to parse MedlinePlus HTML
function parseMedlinePlusHtml(html, drugName) {
  try {
    const drugInfo = {
      name: drugName,
      description: "",
      sideEffects: [],
      warnings: [],
      usageInstructions: "",
      indications: []
    };
    
    // Extract drug description/overview
    const overviewMatch = html.match(/<h2[^>]*>Why is this medication prescribed\?<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
    if (overviewMatch && overviewMatch[1]) {
      drugInfo.description = overviewMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    
    // Extract usage instructions
    const usageMatch = html.match(/<h2[^>]*>How should this medicine be used\?<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
    if (usageMatch && usageMatch[1]) {
      drugInfo.usageInstructions = usageMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    
    // Extract side effects
    const sideEffectsMatch = html.match(/<h2[^>]*>What side effects can this medication cause\?<\/h2>\s*([\s\S]*?)<(?:h2|div)/i);
    if (sideEffectsMatch && sideEffectsMatch[1]) {
      const sideEffectsHtml = sideEffectsMatch[1];
      const sideEffectsList = sideEffectsHtml.match(/<li>([\s\S]*?)<\/li>/g);
      
      if (sideEffectsList) {
        drugInfo.sideEffects = sideEffectsList.map(item => {
          return item
            .replace(/<li>/g, '')
            .replace(/<\/li>/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        });
      } else {
        // Try to find paragraph-based side effects
        const sideEffectsParagraph = sideEffectsHtml.match(/<p>([\s\S]*?)<\/p>/);
        if (sideEffectsParagraph && sideEffectsParagraph[1]) {
          drugInfo.sideEffects = [sideEffectsParagraph[1].replace(/<[^>]*>/g, '').trim()];
        }
      }
    }
    
    // Extract warnings
    const warningsMatch = html.match(/<h2[^>]*>What special precautions should I follow\?<\/h2>\s*([\s\S]*?)<(?:h2|div)/i);
    if (warningsMatch && warningsMatch[1]) {
      const warningsHtml = warningsMatch[1];
      const warningsList = warningsHtml.match(/<li>([\s\S]*?)<\/li>/g);
      
      if (warningsList) {
        drugInfo.warnings = warningsList.map(item => {
          return item
            .replace(/<li>/g, '')
            .replace(/<\/li>/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        });
      } else {
        // Try to find paragraph-based warnings
        const warningsParagraph = warningsHtml.match(/<p>([\s\S]*?)<\/p>/);
        if (warningsParagraph && warningsParagraph[1]) {
          drugInfo.warnings = [warningsParagraph[1].replace(/<[^>]*>/g, '').trim()];
        }
      }
    }
    
    return drugInfo;
  } catch (error) {
    console.error(`Error parsing MedlinePlus HTML: ${error.message}`);
    return null;
  }
}

// Function to check for color and shape information in text
function extractPillAppearance(text) {
  const colors = [
    'white', 'blue', 'red', 'green', 'yellow', 'orange', 'purple', 
    'pink', 'brown', 'gray', 'black', 'turquoise', 'beige', 'maroon'
  ];
  
  const shapes = [
    'round', 'oval', 'oblong', 'capsule', 'rectangle', 'diamond', 
    'triangle', 'square', 'hexagon', 'pentagonal', 'octagonal'
  ];
  
  let color = null;
  let shape = null;
  
  // Check for color
  for (const c of colors) {
    if (text.toLowerCase().includes(c)) {
      color = c;
      break;
    }
  }
  
  // Check for shape
  for (const s of shapes) {
    if (text.toLowerCase().includes(s)) {
      shape = s;
      break;
    }
  }
  
  return { color, shape };
}

// Enhanced multi-model analysis for better handling of blurry images and multiple languages
async function analyzeImageWithMultipleModels(imageBase64) {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    
    console.log("Using enhanced multi-model analysis for drug identification");
    
    // Updated prompt to handle multilingual text in images
    const detailedPrompt = `
    This image may show a medication pill, tablet, or capsule that could have text in ANY LANGUAGE. 
    Analyze with extreme attention to detail:
    1. CRITICAL: Look for ANY text, numbers, logos, or imprints on the pill - if text is NOT in English, IDENTIFY THE LANGUAGE
    2. Note the exact color(s), shape, and any distinctive features
    3. If visible, analyze the packaging text and logos, noting any foreign language text
    4. Consider both prescription and over-the-counter medications from ANY COUNTRY
    5. If the image is blurry, try to extrapolate what the markings might be
    
    Provide an extremely detailed analysis and your best identification in JSON format with these fields:
    name (most likely medicine name), genericName, possibleNames (array of possible medications), imprint (any text/numbers on pill), 
    color, shape, markings (detailed description), confidence (low, medium, high), textLanguage (what language the text appears to be in),
    translatedImprint (English translation of non-English text if detected), and description.
    
    For unclear images or non-English text, provide multiple possible identifications based on visible characteristics.
    ONLY return valid JSON.
    `;
    
    const secondaryPrompt = `
    This is a medication pill/tablet that may be blurry or unclear or have text in NON-ENGLISH LANGUAGES.
    Analyze any visible characteristics including:
    - Any text or numbers (SPECIFY THE LANGUAGE if not English)
    - Color, shape, scoring lines
    - Packaging information if visible
    
    If text is not in English, please identify the language and provide an English translation of what the text might say.
    
    Return ONLY JSON with these fields: name, genericName, possibleNames (array), imprint, color, shape, 
    confidence, textLanguage, translatedImprint, and description.
    `;
    
    // Make the primary analysis request with detailed prompt
    let primaryResponse;
    try {
      primaryResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
      });
    } catch (error) {
      console.error("Error in primary Gemini analysis:", error);
    }
    
    // Make the secondary analysis request with alternative prompt
    let secondaryResponse;
    try {
      secondaryResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
      });
    } catch (error) {
      console.error("Error in secondary Gemini analysis:", error);
    }
    
    // Process results with the same approach as before
    let primaryData = null;
    if (primaryResponse && primaryResponse.ok) {
      try {
        const responseData = await primaryResponse.json();
        if (responseData.candidates && 
            responseData.candidates[0] && 
            responseData.candidates[0].content && 
            responseData.candidates[0].content.parts) {
          
          const text = responseData.candidates[0].content.parts[0].text;
          console.log("Primary analysis result:", text);
          
          // Extract JSON
          const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                         text.match(/```\s*([\s\S]*?)\s*```/) ||
                         text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            primaryData = JSON.parse(jsonString);
          }
        }
      } catch (e) {
        console.error("Error parsing primary analysis:", e);
      }
    }
    
    let secondaryData = null;
    if (secondaryResponse && secondaryResponse.ok) {
      try {
        const responseData = await secondaryResponse.json();
        if (responseData.candidates && 
            responseData.candidates[0] && 
            responseData.candidates[0].content && 
            responseData.candidates[0].content.parts) {
          
          const text = responseData.candidates[0].content.parts[0].text;
          console.log("Secondary analysis result:", text);
          
          const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                         text.match(/```\s*([\s\S]*?)\s*```/) ||
                         text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            secondaryData = JSON.parse(jsonString);
          }
        }
      } catch (e) {
        console.error("Error parsing secondary analysis:", e);
      }
    }
    
    // Combine results from both models and handle language detection
    const combinedResults = combineAnalysisResults(primaryData, secondaryData);
    
    if (combinedResults) {
      // If non-English text detected, translate relevant fields
      if (combinedResults.textLanguage && 
          combinedResults.textLanguage.toLowerCase() !== 'english' && 
          combinedResults.textLanguage.toLowerCase() !== 'en') {
        
        console.log(`Non-English text detected (${combinedResults.textLanguage}), translating...`);
        
        // Translate imprint if available
        if (combinedResults.imprint && !combinedResults.translatedImprint) {
          try {
            combinedResults.translatedImprint = await translateText(combinedResults.imprint);
            console.log(`Translated imprint: ${combinedResults.translatedImprint}`);
          } catch (e) {
            console.error("Error translating imprint:", e);
          }
        }
        
        // If the name appears to be in another language, translate it
        if (combinedResults.name && 
            combinedResults.textLanguage && 
            combinedResults.textLanguage.toLowerCase() !== 'english') {
          try {
            const translatedName = await translateText(combinedResults.name);
            if (translatedName && translatedName !== combinedResults.name) {
              // Keep the original name, but add the translation
              combinedResults.translatedName = translatedName;
              console.log(`Translated name: ${combinedResults.translatedName}`);
            }
          } catch (e) {
            console.error("Error translating name:", e);
          }
        }
      }
      
      console.log("Successfully combined analysis results with translation");
      return combinedResults;
    } else {
      throw new Error("Failed to extract usable data from image analysis");
    }
  } catch (error) {
    console.error("Error in multi-model image analysis:", error);
    return null;
  }
}

// Function to combine results from multiple analyses
function combineAnalysisResults(primaryData, secondaryData) {
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
    
    // Handle language detection and translation
    if (!result.textLanguage && secondaryData.textLanguage) {
      result.textLanguage = secondaryData.textLanguage;
    }
    
    if (!result.translatedImprint && secondaryData.translatedImprint) {
      result.translatedImprint = secondaryData.translatedImprint;
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

// Improved function to extract text from Gemini response
function extractDrugNameFromText(text) {
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

// Enhanced function to identify drug using a multi-stage approach
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, blurryMode } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing image data" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Image received, initiating multi-stage analysis pipeline with language detection");
    
    // Get the API key from environment variables
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // STAGE 1: Use multi-model analysis with language detection
    const multiModelAnalysis = await analyzeImageWithMultipleModels(imageBase64);
    
    // STAGE 2: Standard analysis with updated Gemini 1.5 Flash
    console.log("Proceeding with standard analysis with language awareness...");
    const standardAnalysisPrompt = `
    You are a pharmaceutical expert analyzing a medication from ANY country in ANY LANGUAGE. 
    Identify this medication pill/tablet from the image with extreme precision.
    Focus intensely on identifying:
    1. All markings, imprints, logos, numbers and text on the pill - NOTE THE LANGUAGE if not English
    2. Exact color(s) and shape 
    3. Any scoring lines, coatings, or unusual features
    4. Match to known medications based on these characteristics
    5. If text is in a non-English language, identify the language and provide both the original text and an English translation
    
    Return a comprehensive analysis in JSON format with these fields:
    name, genericName, manufacturer, category, description, dosageAndAdmin, 
    sideEffects (array), warnings (array), interactions (array), 
    storage, mechanism, indications (array), contraindications (array), 
    prescriptionStatus, pregnancy, imprint (all visible markings/codes), 
    brandNames (array), drugClass, color, shape, textLanguage (detected language of text),
    translatedImprint (English translation of non-English text if detected).
    
    CRITICAL: If the image is blurry or unclear, or if text is NOT in English, provide your best analysis of
    what the medication MIGHT be based on the visible characteristics, and
    include ALL possible matches in brandNames field.
    
    Ensure your response is ONLY valid JSON with no additional text.
    `;
    
    // Standard analysis request
    const standardResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
    if (!standardResponse.ok) {
      const errorText = await standardResponse.text();
      console.error("Gemini API error:", errorText);
      
      // If standard analysis fails but multi-model analysis succeeded, use that
      if (multiModelAnalysis) {
        console.log("Standard analysis failed, using multi-model analysis results");
        return constructFinalResponse(multiModelAnalysis, null, imageBase64);
      }
      
      // If everything failed
      return new Response(
        JSON.stringify({ 
          error: "Failed to analyze image", 
          details: errorText 
        }),
        { status: standardResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const standardData = await standardResponse.json();
    console.log("Standard analysis response received");

    // Extract and parse standard analysis results
    let standardAnalysisResult = null;
    try {
      if (standardData.candidates && standardData.candidates.length > 0 && 
          standardData.candidates[0].content && 
          standardData.candidates[0].content.parts && 
          standardData.candidates[0].content.parts.length > 0) {
        
        const contentText = standardData.candidates[0].content.parts[0].text;
        console.log("Raw response:", contentText.substring(0, 200) + "...");
        
        // Extract JSON from the response
        const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        contentText.match(/```\s*([\s\S]*?)\s*```/) ||
                        contentText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          standardAnalysisResult = JSON.parse(jsonString);
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
    } catch (parseError) {
      console.error("Error parsing standard analysis:", parseError);
    }
    
    // STAGE 3: Combine results and search for more detailed information
    return await constructFinalResponse(multiModelAnalysis, standardAnalysisResult, imageBase64);
    
  } catch (error) {
    console.error("Error in identify-drug function:", error);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred", 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to construct final response by combining all analyses
async function constructFinalResponse(multiModelAnalysis, standardAnalysis, imageBase64) {
  // Combine results from all analyses
  const combinedData = {
    id: crypto.randomUUID(),
    name: "Unknown Medication",
    genericName: "",
    brandNames: [],
    alternativeMedications: [],
    manufacturer: "Unknown",
    category: "",
    description: "",
    dosageAndAdmin: "",
    detailedDosage: "",
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
    image: imageBase64.includes('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64}`,
    drugClass: "",
    confidence: "low",
    color: "",
    shape: "",
    blurryModeUsed: false,
    multiModelAnalysisUsed: !!multiModelAnalysis,
    textLanguage: null,
    translatedImprint: null,
    translatedName: null
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
    combinedData.textLanguage = multiModelAnalysis.textLanguage || null;
    combinedData.translatedImprint = multiModelAnalysis.translatedImprint || null;
    combinedData.translatedName = multiModelAnalysis.translatedName || null;
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
      combinedData.brandNames = [...new Set([...combinedData.brandNames, ...standardAnalysis.brandNames])];
    }
    
    // Fill in other fields from standard analysis
    combinedData.manufacturer = standardAnalysis.manufacturer || combinedData.manufacturer;
    combinedData.category = standardAnalysis.category || combinedData.category;
    combinedData.description = standardAnalysis.description || combinedData.description;
    combinedData.dosageAndAdmin = standardAnalysis.dosageAndAdmin || combinedData.dosageAndAdmin;
    combinedData.detailedDosage = standardAnalysis.detailedDosage || combinedData.detailedDosage;
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
    combinedData.alternativeMedications = standardAnalysis.alternativeMedications || combinedData.alternativeMedications;
    
    // Language detection and translation
    combinedData.textLanguage = standardAnalysis.textLanguage || combinedData.textLanguage;
    combinedData.translatedImprint = standardAnalysis.translatedImprint || combinedData.translatedImprint;
    
    if (!combinedData.color && standardAnalysis.color) {
      combinedData.color = standardAnalysis.color;
    }
    
    if (!combinedData.shape && standardAnalysis.shape) {
      combinedData.shape = standardAnalysis.shape;
    }
  }
  
  // If we have a valid drug name, try to enrich with more information
  if (combinedData.name && combinedData.name !== "Unknown Medication") {
    console.log(`Valid drug name found: ${combinedData.name}, enriching with external data`);
    
    // Try MedlinePlus first for comprehensive medical info
    const medlinePlusData = await getDrugInfoFromMedlinePlus(combinedData.name);
    
    if (medlinePlusData) {
      console.log("Found data from MedlinePlus");
      
      // Apply MedlinePlus data
      combinedData.description = medlinePlusData.description || combinedData.description;
      
      if (medlinePlusData.sideEffects && medlinePlusData.sideEffects.length > 0) {
        combinedData.sideEffects = medlinePlusData.sideEffects;
      }
      
      if (medlinePlusData.warnings && medlinePlusData.warnings.length > 0) {
        combinedData.warnings = medlinePlusData.warnings;
      }
      
      if (medlinePlusData.usageInstructions) {
        combinedData.dosageAndAdmin = medlinePlusData.usageInstructions;
        // Add more detailed dosage if the instructions are comprehensive
        if (medlinePlusData.usageInstructions.length > 150) {
          combinedData.detailedDosage = medlinePlusData.usageInstructions;
        }
      }
      
      // Get alternative medications from MedlinePlus
      const medlinePlusAlternatives = await getAlternativeMedicationsFromMedlinePlus(combinedData.name);
      if (medlinePlusAlternatives && medlinePlusAlternatives.length > 0) {
        combinedData.alternativeMedications = medlinePlusAlternatives;
      }
    }
    
    // Try drugs.com as backup/additional source
    const drugsComData = await getDrugInfoFromDrugsCom(combinedData.name);
    
    if (drugsComData) {
      console.log("Found data from drugs.com");
      
      // Apply drugs.com data, prioritizing MedlinePlus data if available
      if (!medlinePlusData || !medlinePlusData.description) {
        combinedData.genericName = drugsComData.genericName || combinedData.genericName;
        combinedData.manufacturer = drugsComData.manufacturer || combinedData.manufacturer;
        combinedData.category = drugsComData.category || combinedData.category;
        combinedData.drugClass = drugsComData.drugClass || combinedData.drugClass;
        combinedData.description = drugsComData.description || combinedData.description;
      }
      
      // Only use drugs.com dosage if we don't have MedlinePlus data
      if (!medlinePlusData || !medlinePlusData.usageInstructions) {
        combinedData.dosageAndAdmin = drugsComData.dosageAndAdmin || combinedData.dosageAndAdmin;
        combinedData.detailedDosage = drugsComData.detailedDosage || combinedData.detailedDosage;
      }
      
      // Only use these fields from drugs.com if MedlinePlus didn't provide them
      if (!medlinePlusData || medlinePlusData.sideEffects.length === 0) {
        if (drugsComData.sideEffects && drugsComData.sideEffects.length > 0) {
          combinedData.sideEffects = drugsComData.sideEffects;
        }
      }
      
      if (!medlinePlusData || medlinePlusData.warnings.length === 0) {
        if (drugsComData.warnings && drugsComData.warnings.length > 0) {
          combinedData.warnings = drugsComData.warnings;
        }
      }
      
      // Always use these fields from drugs.com as MedlinePlus doesn't provide them
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
        combinedData.brandNames = [...new Set([...combinedData.brandNames, ...drugsComData.brandNames])];
      }
      
      // Add alternative medications
      if (drugsComData.alternativeMedications && drugsComData.alternativeMedications.length > 0) {
        if (!combinedData.alternativeMedications) {
          combinedData.alternativeMedications = [];
        }
        combinedData.alternativeMedications = [...new Set([...combinedData.alternativeMedications, ...drugsComData.alternativeMedications])];
      }
    }
  } else if (combinedData.imprint) {
    // If we have an imprint but no drug name, try searching by imprint
    console.log(`No valid drug name but imprint found: ${combinedData.imprint}, searching by imprint`);
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
      combinedData.detailedDosage = imprintResults.detailedDosage || combinedData.detailedDosage;
      
      if (imprintResults.sideEffects && imprintResults.sideEffects.length > 0) {
        combinedData.sideEffects = imprintResults.sideEffects;
      }
      
      if (imprintResults.warnings && imprintResults.warnings.length > 0) {
        combinedData.warnings = imprintResults.warnings;
      }
      
      if (imprintResults.interactions && imprintResults.interactions.length > 0) {
        combinedData.interactions = imprintResults.interactions;
      }
      
      combinedData.storage = imprintResults.storage || combinedData.storage;
      combinedData.mechanism = imprintResults.mechanism || combinedData.mechanism;
      
      if (imprintResults.indications && imprintResults.indications.length > 0) {
        combinedData.indications = imprintResults.indications;
      }
      
      if (imprintResults.contraindications && imprintResults.contraindications.length > 0) {
        combinedData.contraindications = imprintResults.contraindications;
      }
      
      if (imprintResults.prescriptionStatus !== "Unknown") {
        combinedData.prescriptionStatus = imprintResults.prescriptionStatus;
      }
      
      combinedData.pregnancy = imprintResults.pregnancy || combinedData.pregnancy;
      
      // Add brand names from imprint search if available
      if (imprintResults.brandNames && imprintResults.brandNames.length > 0) {
        combinedData.brandNames = [...new Set([...combinedData.brandNames, ...imprintResults.brandNames])];
      }
      
      // Add alternative medications
      if (imprintResults.alternativeMedications && imprintResults.alternativeMedications.length > 0) {
        if (!combinedData.alternativeMedications) {
          combinedData.alternativeMedications = [];
        }
        combinedData.alternativeMedications = [...new Set([...combinedData.alternativeMedications, ...imprintResults.alternativeMedications])];
      }
    }
  }
  
  // Log the final processed result
  console.log("Final identification result:", combinedData.name);
  
  // If we detected non-English text but haven't translated crucial fields yet, do it now
  if (combinedData.textLanguage && 
      combinedData.textLanguage.toLowerCase() !== 'english' && 
      combinedData.textLanguage.toLowerCase() !== 'en') {
      
    // Try to translate name if not done already
    if (combinedData.name && combinedData.name !== "Unknown Medication" && !combinedData.translatedName) {
      try {
        console.log(`Translating drug name from ${combinedData.textLanguage}`);
        const translatedName = await translateText(combinedData.name);
        if (translatedName && translatedName !== combinedData.name) {
          combinedData.translatedName = translatedName;
        }
      } catch (error) {
        console.error("Error translating drug name:", error);
      }
    }
    
    // Translate imprint if not done already
    if (combinedData.imprint && !combinedData.translatedImprint) {
      try {
        console.log(`Translating imprint from ${combinedData.textLanguage}`);
        combinedData.translatedImprint = await translateText(combinedData.imprint);
      } catch (error) {
        console.error("Error translating imprint:", error);
      }
    }
  }
  
  return new Response(
    JSON.stringify(combinedData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
