
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { load } from "https://deno.land/x/cheerio@1.0.6/mod.ts";

// CORS headers for browser requests
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
    const { query } = await req.json();
    console.log(`Searching for: ${query}`);

    if (!query || query.trim() === '') {
      throw new Error('Query is required');
    }

    // Step 1: Try direct URL access first
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, '-');
    let drugInfo = await tryDirectAccess(normalizedQuery);

    // Step 2: If direct access fails, try search
    if (!drugInfo) {
      console.log("Direct access failed, trying search");
      drugInfo = await searchDrugscom(query);
    }

    // Step 3: If search fails too, return an error
    if (!drugInfo) {
      throw new Error('Could not find information for the specified medication');
    }

    return new Response(JSON.stringify(drugInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in smart-drug-search function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function tryDirectAccess(drugName: string): Promise<any | null> {
  try {
    const url = `https://www.drugs.com/${drugName}.html`;
    console.log(`Trying direct access: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return extractDrugInformation(html, drugName);
  } catch (error) {
    console.error("Error in direct access:", error);
    return null;
  }
}

async function searchDrugscom(query: string): Promise<any | null> {
  try {
    const searchUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(query)}`;
    console.log(`Searching drugs.com: ${searchUrl}`);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = load(html);
    
    // Look for the first result link
    const firstResultLink = $('.ddc-search-results .ddc-media-list .ddc-media a').first().attr('href');
    if (!firstResultLink) {
      return null;
    }

    // Get the full URL if it's a relative path
    const drugUrl = firstResultLink.startsWith('http') 
      ? firstResultLink 
      : `https://www.drugs.com${firstResultLink}`;
    
    console.log(`Found result URL: ${drugUrl}`);
    
    // Fetch the drug page
    const drugResponse = await fetch(drugUrl);
    if (!drugResponse.ok) {
      return null;
    }

    const drugHtml = await drugResponse.text();
    return extractDrugInformation(drugHtml, query);
  } catch (error) {
    console.error("Error in search:", error);
    return null;
  }
}

function extractDrugInformation(html: string, query: string): any {
  const $ = load(html);
  
  // Extract drug name
  const name = $('.ddc-page-title').text().trim() || $('.drug-name h1').text().trim();
  
  // Extract generic name
  let genericName = $('.drug-subtitle').text().trim();
  if (!genericName) {
    // Try alternative selectors
    $('.synonym-list li, .ddc-list-column-2 li').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !genericName) {
        genericName = text;
      }
    });
  }
  
  // Extract description
  let description = $('.drug-content p').first().text().trim();
  if (!description) {
    description = $('.ddc-body-content p').first().text().trim();
  }
  
  // Extract side effects
  const sideEffects = [];
  $('.side-effects-list li, .ddc-list-column-2 li').each((_, el) => {
    sideEffects.push($(el).text().trim());
  });
  
  // Extract dosage
  let dosage = '';
  $('.dosage p, .dosage-information p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && !dosage) {
      dosage = text;
    }
  });
  
  // Extract warnings
  let warnings = '';
  $('.warnings p, .warning-information p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && !warnings) {
      warnings = text;
    }
  });

  // Extract category
  let category = '';
  $('.drug-class').each((_, el) => {
    const text = $(el).text().trim();
    if (text && !category) {
      category = text.replace('Drug class: ', '');
    }
  });

  // Extract related drugs
  const relatedDrugs = [];
  $('.drug-related-list li a, .ddc-related-list li a').each((_, el) => {
    const drugName = $(el).text().trim();
    if (drugName) {
      relatedDrugs.push(drugName);
    }
  });

  return {
    name: name || query,
    genericName: genericName || "Not available",
    category: category || "Not specified",
    description: description || "No description available",
    usages: description ? [description.split('.')[0]] : ["Information not available"],
    sideEffects: sideEffects.length > 0 ? sideEffects.slice(0, 5) : ["Information not available"],
    dosage: dosage || "Please consult your healthcare provider for dosage information",
    warnings: warnings || "Please consult your healthcare provider for warnings",
    relatedDrugs: relatedDrugs.length > 0 ? relatedDrugs.slice(0, 5) : [],
    url: `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(query)}`
  };
}
