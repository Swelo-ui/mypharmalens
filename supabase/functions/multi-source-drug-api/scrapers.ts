// Additional scraper modules for FDA OpenFDA and RxList
import type { ComprehensiveDrugInfo } from './types';

// FDA OpenFDA API scraper
export async function scrapeFDAOpenFDA(drugName: string): Promise<Partial<ComprehensiveDrugInfo> | null> {
  try {
    // OpenFDA Drug Label API
    const searchUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
    console.log(`Scraping FDA OpenFDA: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FDA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('No FDA results found');
      return null;
    }

    const result = data.results[0];
    const drugInfo: Partial<ComprehensiveDrugInfo> = {
      sources: { fda: searchUrl }
    };

    // Extract data from FDA label
    if (result.openfda?.generic_name?.[0]) {
      drugInfo.genericName = result.openfda.generic_name[0];
    }

    if (result.openfda?.manufacturer_name?.[0]) {
      drugInfo.manufacturer = result.openfda.manufacturer_name[0];
    }

    if (result.openfda?.brand_name?.[0]) {
      drugInfo.name = result.openfda.brand_name[0];
      drugInfo.brandNames = result.openfda.brand_name;
    }

    // Description and indications
    if (result.indications_and_usage?.[0]) {
      drugInfo.description = result.indications_and_usage[0].substring(0, 500);
      drugInfo.indications = result.indications_and_usage;
    }

    // Dosage information
    if (result.dosage_and_administration?.[0]) {
      drugInfo.dosageAndAdmin = result.dosage_and_administration[0].substring(0, 500);
    }

    // Warnings and precautions
    if (result.warnings_and_cautions) {
      drugInfo.warnings = result.warnings_and_cautions;
    } else if (result.warnings) {
      drugInfo.warnings = result.warnings;
    }

    // Contraindications
    if (result.contraindications) {
      drugInfo.contraindications = result.contraindications;
    }

    // Adverse reactions (side effects)
    if (result.adverse_reactions) {
      drugInfo.sideEffects = result.adverse_reactions;
    }

    // Drug interactions
    if (result.drug_interactions) {
      drugInfo.interactions = result.drug_interactions;
    }

    // Storage and handling
    if (result.storage_and_handling?.[0]) {
      drugInfo.storage = result.storage_and_handling[0];
    }

    // Mechanism of action
    if (result.mechanism_of_action?.[0]) {
      drugInfo.mechanism = result.mechanism_of_action[0];
    }

    // Pregnancy information
    if (result.pregnancy?.[0]) {
      drugInfo.pregnancy = result.pregnancy[0];
    }

    // Drug class
    if (result.openfda?.pharm_class_epc?.[0]) {
      drugInfo.drugClass = result.openfda.pharm_class_epc[0];
    }

    console.log(`FDA OpenFDA scraping completed for ${drugName}`);
    return drugInfo;

  } catch (error) {
    console.error(`FDA OpenFDA scraping failed for ${drugName}:`, error);
    return null;
  }
}

// RxList scraper
export async function scrapeRxList(drugName: string): Promise<Partial<ComprehensiveDrugInfo> | null> {
  try {
    const searchUrl = `https://www.rxlist.com/script/main/art.asp?articlekey=${encodeURIComponent(drugName.toLowerCase().replace(/\s+/g, '_'))}`;
    console.log(`Scraping RxList: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`RxList error: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      throw new Error('Failed to parse RxList HTML');
    }

    const drugInfo: Partial<ComprehensiveDrugInfo> = {
      sources: { rxlist: searchUrl }
    };

    // Extract generic name
    const genericNameEl = doc.querySelector('.generic_name, h2.subtitle') as Element | null;
    if (genericNameEl) {
      drugInfo.genericName = genericNameEl.textContent?.trim() || '';
    }

    // Extract description
    const descEl = doc.querySelector('.drug_description, .overview p') as Element | null;
    if (descEl) {
      drugInfo.description = descEl.textContent?.trim().substring(0, 500) || '';
    }

    // Extract side effects
    const sideEffectsSection = doc.querySelector('#side_effects, .side-effects') as Element | null;
    if (sideEffectsSection) {
      const items = sideEffectsSection.querySelectorAll('li, p') as NodeListOf<Element>;
      drugInfo.sideEffects = Array.from(items)
        .map(item => item.textContent?.trim() || '')
        .filter(text => text.length > 5)
        .slice(0, 15);
    }

    // Extract dosage
    const dosageSection = doc.querySelector('#dosage, .dosage-section') as Element | null;
    if (dosageSection) {
      drugInfo.dosageAndAdmin = dosageSection.textContent?.trim().substring(0, 500) || '';
    }

    // Extract warnings
    const warningsSection = doc.querySelector('#warnings, .warnings') as Element | null;
    if (warningsSection) {
      const items = warningsSection.querySelectorAll('li, p') as NodeListOf<Element>;
      drugInfo.warnings = Array.from(items)
        .map(item => item.textContent?.trim() || '')
        .filter(text => text.length > 10)
        .slice(0, 10);
    }

    // Extract drug interactions
    const interactionsSection = doc.querySelector('#drug_interactions, .interactions') as Element | null;
    if (interactionsSection) {
      const items = interactionsSection.querySelectorAll('li, p') as NodeListOf<Element>;
      drugInfo.interactions = Array.from(items)
        .map(item => item.textContent?.trim() || '')
        .filter(text => text.length > 5)
        .slice(0, 10);
    }

    console.log(`RxList scraping completed for ${drugName}`);
    return drugInfo;

  } catch (error) {
    console.error(`RxList scraping failed for ${drugName}:`, error);
    return null;
  }
}

// NIH DailyMed API scraper
export async function scrapeNIHDailyMed(drugName: string): Promise<Partial<ComprehensiveDrugInfo> | null> {
  try {
    // DailyMed API search
    const searchUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(drugName)}`;
    console.log(`Scraping NIH DailyMed: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DailyMed API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('No DailyMed results found');
      return null;
    }

    const result = data.data[0];
    const setId = result.setid;

    // Fetch detailed information
    const detailUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setId}.json`;
    const detailResponse = await fetch(detailUrl);
    
    if (!detailResponse.ok) {
      throw new Error(`DailyMed detail error: ${detailResponse.status}`);
    }

    const detailData = await detailResponse.json();
    const drugInfo: Partial<ComprehensiveDrugInfo> = {
      sources: { dailymed: detailUrl }
    };

    if (detailData.data) {
      const detail = detailData.data;
      
      if (detail.generic_name) {
        drugInfo.genericName = detail.generic_name;
      }

      if (detail.manufacturer_name) {
        drugInfo.manufacturer = detail.manufacturer_name;
      }

      if (detail.marketing_category) {
        drugInfo.prescriptionStatus = detail.marketing_category;
      }
    }

    console.log(`NIH DailyMed scraping completed for ${drugName}`);
    return drugInfo;

  } catch (error) {
    console.error(`NIH DailyMed scraping failed for ${drugName}:`, error);
    return null;
  }
}
