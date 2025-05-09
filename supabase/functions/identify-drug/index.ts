
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

// Helper function to safely get textLanguage as a string
function getTextLanguageAsString(textLanguage) {
  if (!textLanguage) {
    return 'unknown';
  }
  
  if (typeof textLanguage === 'string') {
    return textLanguage.toLowerCase();
  }
  
  if (Array.isArray(textLanguage) && textLanguage.length > 0) {
    // If it's an array, use the first language or join them
    return textLanguage[0].toLowerCase();
  }
  
  return 'unknown';
}

// Function to construct a normalized final response
function constructFinalResponse(combinedData) {
  // Create a clean standardized response
  const finalResponse = {
    name: combinedData.name || "Unknown medication",
    genericName: combinedData.genericName || combinedData.name || "Unknown",
    manufacturer: combinedData.manufacturer || "",
    category: combinedData.category || "",
    description: combinedData.description || "No description available",
    dosageAndAdmin: combinedData.dosageAndAdmin || "",
    sideEffects: combinedData.sideEffects || [],
    warnings: combinedData.warnings || [],
    interactions: combinedData.interactions || [],
    storage: combinedData.storage || "",
    mechanism: combinedData.mechanism || "",
    indications: combinedData.indications || [],
    contraindications: combinedData.contraindications || [],
    prescriptionStatus: combinedData.prescriptionStatus || "Unknown",
    pregnancy: combinedData.pregnancy || "",
    drugClass: combinedData.drugClass || "",
    brandNames: combinedData.brandNames || [],
    image: combinedData.image || "",
    textLanguage: getTextLanguageAsString(combinedData.textLanguage),
    translatedImprint: combinedData.translatedImprint || "",
    translatedName: combinedData.translatedName || "",
    confidence: combinedData.confidence || "medium",
    similarDrugs: combinedData.similarDrugs || []
  };
  
  // Ensure arrays are properly formatted
  ['sideEffects', 'warnings', 'interactions', 'indications', 'contraindications', 'brandNames', 'similarDrugs'].forEach(field => {
    if (!Array.isArray(finalResponse[field])) {
      if (finalResponse[field] && typeof finalResponse[field] === 'string') {
        finalResponse[field] = [finalResponse[field]];
      } else {
        finalResponse[field] = [];
      }
    }
  });
  
  return finalResponse;
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
    color, shape, markings (detailed description), confidence (low, medium, high), textLanguage (what language text is in, or array of languages), 
    translatedImprint (English translation of imprint if not in English), description (detailed visual description)
    `;
    
    // Make multiple parallel requests to different model configurations for robustness
    const primaryRequest = fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: detailedPrompt },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64.split(",")[1] } }
          ]
        }]
      })
    });
    
    // Secondary model with different prompt for verification and comparison
    const secondaryPrompt = `
    Analyze this medication image with extreme precision:
    - Identify the medication name, generic name, and active ingredients
    - Detect all text on the pill or packaging in ANY LANGUAGE (specify which language if non-English)
    - Describe exact color, shape, size, and any distinctive markings
    - Note any logos, scoring lines, or other identifiable features
    - If blurry, use context clues to make best determination
    
    Format your response as valid JSON with these fields:
    {
      "name": "medication brand name",
      "genericName": "chemical/generic name",
      "possibleNames": ["alternate name1", "alternate name2"],
      "imprint": "any text/numbers on pill",
      "color": "pill color",
      "shape": "pill shape",
      "confidence": 0-1 confidence score,
      "textLanguage": ["language1", "language2"],
      "translatedImprint": "English translation if applicable",
      "description": "detailed visual description"
    }
    `;
    
    const secondaryRequest = fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: secondaryPrompt },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64.split(",")[1] } }
          ]
        }]
      })
    });
    
    // Execute both requests in parallel
    const [primaryResponse, secondaryResponse] = await Promise.all([primaryRequest, secondaryRequest]);
    
    if (!primaryResponse.ok) {
      const errorText = await primaryResponse.text();
      console.error("Primary model API error:", errorText);
      throw new Error(`Primary model API call failed: ${primaryResponse.status}`);
    }
    
    const primaryData = await primaryResponse.json();
    console.log("Primary analysis result: ```json\n" + JSON.stringify(primaryData.candidates[0].content.parts[0].text, null, 2) + "\n```\n");
    
    // Extract the JSON from text response
    let primaryResult = null;
    try {
      // Find JSON in the response text
      const jsonMatch = primaryData.candidates[0].content.parts[0].text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       primaryData.candidates[0].content.parts[0].text.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch && jsonMatch[1]) {
        primaryResult = JSON.parse(jsonMatch[1]);
      } else {
        // If no JSON found, use the whole text
        primaryResult = JSON.parse(primaryData.candidates[0].content.parts[0].text);
      }
    } catch (e) {
      console.error("Error parsing primary JSON result:", e);
      // Create a simple result from the text
      primaryResult = {
        description: primaryData.candidates[0].content.parts[0].text,
        confidence: "low"
      };
    }
    
    // Process secondary result if available
    let secondaryResult = null;
    if (secondaryResponse.ok) {
      const secondaryData = await secondaryResponse.json();
      console.log("Secondary analysis result: ```json\n" + JSON.stringify(secondaryData.candidates[0].content.parts[0].text, null, 2) + "\n```\n");
      
      try {
        const jsonMatch = secondaryData.candidates[0].content.parts[0].text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                         secondaryData.candidates[0].content.parts[0].text.match(/(\{[\s\S]*\})/);
        
        if (jsonMatch && jsonMatch[1]) {
          secondaryResult = JSON.parse(jsonMatch[1]);
        } else {
          secondaryResult = JSON.parse(secondaryData.candidates[0].content.parts[0].text);
        }
      } catch (e) {
        console.error("Error parsing secondary JSON result:", e);
      }
    }
    
    // Combine the results for more robust identification
    let combinedResult = combineAnalysisResults(primaryResult, secondaryResult);
    return combinedResult;
    
  } catch (error) {
    console.error("Error in multi-model image analysis:", error);
    // Return a simplified result when the API call fails
    return {
      description: "Could not analyze the image due to an API error.",
      confidence: "low",
      error: error.message
    };
  }
}

// Function to combine results from multiple models
function combineAnalysisResults(primaryData, secondaryData) {
  if (!primaryData) return secondaryData || { confidence: "low", error: "Analysis failed" };
  if (!secondaryData) return primaryData;
  
  // Use secondary data to fill gaps or validate primary data
  const combined = { ...primaryData };
  
  // Handle text language - ensure properly formatted
  if (secondaryData.textLanguage) {
    if (!combined.textLanguage) {
      combined.textLanguage = secondaryData.textLanguage;
    }
    // If both have different opinions, use an array of languages
    else if (JSON.stringify(combined.textLanguage) !== JSON.stringify(secondaryData.textLanguage)) {
      const languages = [];
      
      // Handle various formats of textLanguage
      function addLanguages(langData) {
        if (typeof langData === 'string') {
          languages.push(langData);
        } else if (Array.isArray(langData)) {
          langData.forEach(lang => {
            if (typeof lang === 'string' && !languages.includes(lang)) {
              languages.push(lang);
            }
          });
        }
      }
      
      addLanguages(combined.textLanguage);
      addLanguages(secondaryData.textLanguage);
      
      combined.textLanguage = languages.length > 0 ? languages : "unknown";
    }
  }
  
  // Safe confidence calculation
  let confidenceValue = 0;
  let confidenceCount = 0;
  
  // Handle confidence values that might be strings or numbers
  function parseConfidence(conf) {
    if (typeof conf === 'number' && conf >= 0 && conf <= 1) {
      return conf;
    }
    if (typeof conf === 'string') {
      const normalized = conf.toLowerCase();
      if (normalized === 'high') return 0.9;
      if (normalized === 'medium') return 0.6;
      if (normalized === 'low') return 0.3;
      // Try parsing as a number if it's a numeric string
      const num = parseFloat(conf);
      if (!isNaN(num) && num >= 0 && num <= 1) return num;
    }
    return null;
  }
  
  const primaryConfidence = parseConfidence(primaryData.confidence);
  if (primaryConfidence !== null) {
    confidenceValue += primaryConfidence;
    confidenceCount++;
  }
  
  const secondaryConfidence = parseConfidence(secondaryData.confidence);
  if (secondaryConfidence !== null) {
    confidenceValue += secondaryConfidence;
    confidenceCount++;
  }
  
  // Set final confidence value
  if (confidenceCount > 0) {
    const avgConfidence = confidenceValue / confidenceCount;
    combined.confidence = avgConfidence >= 0.8 ? 'high' : 
                         avgConfidence >= 0.5 ? 'medium' : 'low';
  }
  
  // Use fields from secondary result if primary is missing them
  ['name', 'genericName', 'imprint', 'color', 'shape', 'translatedImprint'].forEach(field => {
    if (!combined[field] && secondaryData[field]) {
      combined[field] = secondaryData[field];
    }
  });
  
  // Merge possible names
  if (secondaryData.possibleNames && Array.isArray(secondaryData.possibleNames)) {
    if (!combined.possibleNames || !Array.isArray(combined.possibleNames)) {
      combined.possibleNames = secondaryData.possibleNames;
    } else {
      // Combine unique names from both results
      const uniqueNames = new Set([...combined.possibleNames]);
      secondaryData.possibleNames.forEach(name => uniqueNames.add(name));
      combined.possibleNames = [...uniqueNames];
    }
  }
  
  // Include analysis metadata
  combined.multiModelAnalysisUsed = true;
  
  return combined;
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { imageBase64, blurryMode = false, enhancedMode = true, multilingualMode = true } = await req.json();
    
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("Image received, initiating multi-stage analysis pipeline with language detection");
    
    // Analysis options based on user settings
    const useMultiModel = enhancedMode;
    const useLanguageProcessing = multilingualMode;
    const useFallbackAnalysis = blurryMode;
    
    let analysisResult;
    
    // Standard image analysis with Gemini API
    if (useMultiModel) {
      try {
        console.log("Using enhanced multi-model analysis for drug identification");
        analysisResult = await analyzeImageWithMultipleModels(imageBase64);
      } catch (error) {
        console.error("Error in multi-model image analysis:", error);
        // Fall back to standard analysis if multi-model fails
        console.log("Proceeding with standard analysis with language awareness...");
        
        // This would be where a standard image analysis would happen
        // For now we'll create a placeholder response similar to what the multi-model would return
        analysisResult = {
          confidence: "medium",
          error: "Multi-model analysis failed, using fallback",
          blurryModeUsed: true
        };
        
        // Implement a simpler fallback method here if needed
      }
    } else {
      console.log("Proceeding with standard analysis with language awareness...");
      // Standard analysis implementation would go here
      // For now we'll use a placeholder
      analysisResult = {
        confidence: "medium",
        standardAnalysisUsed: true
      };
    }
    
    // Sample model response for development use
    const sampleResponse = {
      name: "Tradol",
      genericName: "Tramadol Hydrochloride",
      manufacturer: "Rusan",
      category: "Analgesic",
      description: "Tramadol Hydrochloride Injection",
      dosageAndAdmin: "As directed by healthcare provider.",
      sideEffects: ["Dizziness", "Nausea", "Constipation", "Headache"],
      warnings: ["May cause drowsiness", "May be habit-forming", "Do not use with alcohol"],
      interactions: ["CNS depressants", "MAO inhibitors", "Serotonergic drugs"],
      mechanism: "Binds to μ-opioid receptors and inhibits reuptake of norepinephrine and serotonin.",
      indications: ["Management of moderate to moderately severe pain"],
      contraindications: ["Hypersensitivity to tramadol", "Acute intoxication with alcohol"],
      prescriptionStatus: "Prescription Only",
      confidence: "medium",
      textLanguage: "English"
    };
    
    // Use sample response if no analysis result or for development
    if (process.env.NODE_ENV === 'development' || !analysisResult) {
      console.log("Standard analysis response received");
      console.log("Raw response: ```json\n" + JSON.stringify(sampleResponse) + "\n```");
      analysisResult = sampleResponse;
    }
    
    // Enrichment phase - get more data from external sources if we have a valid drug name
    if (analysisResult && analysisResult.name) {
      const drugName = analysisResult.name;
      
      console.log("Valid drug name found: " + drugName + ", enriching with external data");
      
      // Get data from MedlinePlus
      const medlinePlusInfo = await getDrugInfoFromMedlinePlus(drugName);
      
      // Get data from Drugs.com
      const drugsComInfo = await getDrugInfoFromDrugsCom(drugName);
      
      // Combine the data with priority to Drugs.com info (generally more complete)
      if (drugsComInfo) {
        analysisResult = { ...analysisResult, ...drugsComInfo };
      }
      
      // Fill in gaps with MedlinePlus info
      if (medlinePlusInfo) {
        // Add description if missing
        if (!analysisResult.description && medlinePlusInfo.description) {
          analysisResult.description = medlinePlusInfo.description;
        }
        
        // Add warnings if missing
        if ((!analysisResult.warnings || analysisResult.warnings.length === 0) && 
            medlinePlusInfo.warnings && medlinePlusInfo.warnings.length > 0) {
          analysisResult.warnings = medlinePlusInfo.warnings;
        }
        
        // Add side effects if missing
        if ((!analysisResult.sideEffects || analysisResult.sideEffects.length === 0) && 
            medlinePlusInfo.sideEffects && medlinePlusInfo.sideEffects.length > 0) {
          analysisResult.sideEffects = medlinePlusInfo.sideEffects;
        }
      }
      
      // Also look for alternative medications
      const alternativeMeds = await getAlternativeMedicationsFromMedlinePlus(drugName);
      if (alternativeMeds && alternativeMeds.length > 0) {
        analysisResult.alternativeMedications = alternativeMeds;
      }
    }
    
    // Handle text language detection and translation if needed
    if (useLanguageProcessing && analysisResult.textLanguage && 
        (typeof analysisResult.textLanguage === 'string' && analysisResult.textLanguage.toLowerCase() !== 'english' && 
         analysisResult.textLanguage.toLowerCase() !== 'en') || 
        (Array.isArray(analysisResult.textLanguage) && 
         !analysisResult.textLanguage.some(lang => lang.toLowerCase() === 'english' || lang.toLowerCase() === 'en'))) {
      
      // If name needs translation and we don't have a translated name yet
      if (analysisResult.name && !analysisResult.translatedName) {
        analysisResult.translatedName = await translateText(analysisResult.name);
      }
      
      // Also translate imprint if available
      if (analysisResult.imprint && !analysisResult.translatedImprint) {
        analysisResult.translatedImprint = await translateText(analysisResult.imprint);
      }
    }
    
    console.log("Final identification result: " + (analysisResult.name || "Unknown"));
    
    // Normalize the result to ensure consistent format
    const finalResult = constructFinalResponse(analysisResult);
    
    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error in identify-drug function:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
