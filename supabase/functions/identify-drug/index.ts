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
    color, shape, markings (detailed description), confidence (low, medium, high), textLanguage (what
