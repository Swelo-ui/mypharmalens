// Cache helper functions for Supabase drug identification cache
import { createClient } from 'npm:@supabase/supabase-js@2';
import type { ComprehensiveDrugInfo, CachedDrugData } from './types';

// Declare Deno env
declare const Deno: { env: { get: (key: string) => string | undefined } };

const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Create Supabase client with service role for cache operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Check if drug exists in cache
 */
export async function getCachedDrug(drugName: string): Promise<ComprehensiveDrugInfo | null> {
  try {
    console.log(`Checking cache for: ${drugName}`);
    
    const { data, error } = await supabase
      .rpc('get_cached_drug', {
        p_drug_name: drugName,
        p_generic_name: null,
        p_imprint: null
      })
      .single();

    if (error) {
      console.log('Cache miss or error:', error.message);
      return null;
    }

    if (!data) {
      console.log('No cache entry found');
      return null;
    }

    console.log(`Cache hit! Retrieved ${data.drug_name} from cache`);

    // Transform database format to API format
    const cachedInfo: ComprehensiveDrugInfo = {
      name: data.drug_name,
      genericName: data.generic_name || '',
      manufacturer: data.manufacturer || '',
      category: data.category || '',
      drugClass: data.drug_class || '',
      description: data.description || '',
      dosageAndAdmin: data.dosage_and_admin || '',
      sideEffects: data.side_effects || [],
      warnings: data.warnings || [],
      interactions: data.interactions || [],
      storage: data.storage || '',
      mechanism: data.mechanism || '',
      indications: data.indications || [],
      contraindications: data.contraindications || [],
      prescriptionStatus: data.prescription_status || 'Unknown',
      pregnancy: data.pregnancy || '',
      brandNames: data.brand_names || [],
      verified: data.verified || false,
      sources: parseSourcesUsed(data.sources_used || []),
      completeness: data.completeness_score || 0
    };

    return cachedInfo;
  } catch (error) {
    console.error('Error retrieving from cache:', error);
    return null;
  }
}

/**
 * Save drug information to cache
 */
export async function saveDrugToCache(
  drugName: string,
  drugInfo: ComprehensiveDrugInfo,
  sourcesUsed: string[]
): Promise<boolean> {
  try {
    console.log(`Saving ${drugName} to cache with completeness ${drugInfo.completeness}%`);

    // Prepare data for database
    const drugData = {
      genericName: drugInfo.genericName,
      manufacturer: drugInfo.manufacturer,
      category: drugInfo.category,
      drugClass: drugInfo.drugClass,
      description: drugInfo.description,
      dosageAndAdmin: drugInfo.dosageAndAdmin,
      sideEffects: drugInfo.sideEffects,
      warnings: drugInfo.warnings,
      interactions: drugInfo.interactions,
      storage: drugInfo.storage,
      mechanism: drugInfo.mechanism,
      indications: drugInfo.indications,
      contraindications: drugInfo.contraindications,
      prescriptionStatus: drugInfo.prescriptionStatus,
      pregnancy: drugInfo.pregnancy,
      brandNames: drugInfo.brandNames,
      sourcesUsed: sourcesUsed,
      completeness: drugInfo.completeness,
      verified: drugInfo.verified,
      confidence: drugInfo.completeness >= 70 ? 'high' : drugInfo.completeness >= 40 ? 'medium' : 'low'
    };

    const { data, error } = await supabase
      .rpc('save_drug_to_cache', {
        p_drug_name: drugName,
        p_drug_data: drugData
      });

    if (error) {
      console.error('Error saving to cache:', error);
      return false;
    }

    console.log(`Successfully saved ${drugName} to cache with ID: ${data}`);
    return true;
  } catch (error) {
    console.error('Exception saving to cache:', error);
    return false;
  }
}

/**
 * Parse sources_used array into sources object
 */
function parseSourcesUsed(sourcesUsed: string[]): ComprehensiveDrugInfo['sources'] {
  const sources: ComprehensiveDrugInfo['sources'] = {};
  
  sourcesUsed.forEach(source => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('drugs.com')) {
      sources.drugscom = source;
    } else if (lowerSource.includes('medlineplus')) {
      sources.medlineplus = source;
    } else if (lowerSource.includes('fda')) {
      sources.fda = source;
    } else if (lowerSource.includes('rxlist')) {
      sources.rxlist = source;
    } else if (lowerSource.includes('dailymed')) {
      sources.dailymed = source;
    }
  });
  
  return sources;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  highCompleteness: number;
  averageCompleteness: number;
}> {
  try {
    const { data, error } = await supabase
      .from('drug_identification_cache')
      .select('completeness_score');

    if (error || !data) {
      return { totalEntries: 0, highCompleteness: 0, averageCompleteness: 0 };
    }

    const totalEntries = data.length;
    const highCompleteness = data.filter((d: any) => d.completeness_score >= 70).length;
    const averageCompleteness = data.length > 0
      ? data.reduce((sum: number, d: any) => sum + d.completeness_score, 0) / data.length
      : 0;

    return {
      totalEntries,
      highCompleteness,
      averageCompleteness: Math.round(averageCompleteness)
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalEntries: 0, highCompleteness: 0, averageCompleteness: 0 };
  }
}
