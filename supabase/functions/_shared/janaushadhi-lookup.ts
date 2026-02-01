// Janaushadhi Medicines Lookup Module
// Provides fast generic alternative search against government Janaushadhi database

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || '';
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || '';

export interface JanaushadhiMatch {
    found: boolean;
    drugCode?: string;
    genericName?: string;
    mrp?: number;
    category?: string;
    matchType?: 'ingredient' | 'fulltext' | 'exact';
    savings?: string;
    savingsAmount?: number;
    advice?: string;
}

/**
 * Find Janaushadhi generic alternative for a drug
 * Runs fast Supabase query with full-text search
 */
export async function findJanaushadhiAlternative(
    brandName: string,
    genericName?: string,
    activeIngredients?: string[],
    brandMrp?: number
): Promise<JanaushadhiMatch> {
    const startTime = Date.now();

    try {
        console.log('🏥 === JANAUSHADHI LOOKUP ===');
        console.log(`   Brand: "${brandName}", Generic: "${genericName || 'N/A'}"`);

        // Build search term - prioritize generic name, then active ingredients
        const searchTerm = genericName ||
            activeIngredients?.join(' ') ||
            extractGenericFromBrand(brandName);

        if (!searchTerm || searchTerm.length < 3) {
            console.log('   ⚠️ Insufficient search term');
            return { found: false };
        }

        // Call Supabase RPC function for fast fuzzy matching
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/find_janaushadhi_match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                p_generic_name: searchTerm,
                p_ingredient: extractPrimaryIngredient(genericName || brandName)
            })
        });

        if (!response.ok) {
            console.log(`   ❌ Supabase query failed: ${response.status}`);
            return { found: false };
        }

        const matches = await response.json();
        const processingTime = Date.now() - startTime;

        if (!matches || matches.length === 0) {
            console.log(`   ❌ No Janaushadhi alternative found (${processingTime}ms)`);
            return { found: false };
        }

        // Get the best match (lowest price)
        const bestMatch = matches[0];

        // Calculate savings if brand MRP is provided
        let savings: string | undefined;
        let savingsAmount: number | undefined;

        if (brandMrp && brandMrp > bestMatch.mrp) {
            savingsAmount = brandMrp - bestMatch.mrp;
            const savingsPercent = Math.round((savingsAmount / brandMrp) * 100);
            savings = `${savingsPercent}%`;
        }

        // Generate helpful advice
        const advice = generateAdvice(bestMatch, savings, savingsAmount);

        console.log(`   ✅ Found: "${bestMatch.generic_name}" at ₹${bestMatch.mrp}`);
        console.log(`   💰 Potential savings: ${savings || 'N/A'}`);
        console.log(`   ⏱️ Lookup time: ${processingTime}ms`);
        console.log('🏥 === JANAUSHADHI LOOKUP COMPLETE ===\n');

        return {
            found: true,
            drugCode: bestMatch.drug_code,
            genericName: bestMatch.generic_name,
            mrp: bestMatch.mrp,
            category: bestMatch.category,
            matchType: bestMatch.match_type,
            savings,
            savingsAmount,
            advice
        };

    } catch (error) {
        console.error('   ❌ Janaushadhi lookup error:', error);
        return { found: false };
    }
}

/**
 * Extract primary ingredient from generic name
 * e.g., "Paracetamol 500mg" → "Paracetamol"
 */
function extractPrimaryIngredient(name: string): string | null {
    if (!name) return null;

    // Remove common suffixes and extract first word
    const cleaned = name
        .replace(/\d+\s*(mg|ml|mcg|iu|%|g)\b/gi, '')
        .replace(/\b(tablets?|capsules?|syrup|injection|cream|gel|drops?|suspension)\b/gi, '')
        .replace(/\bIP\b/gi, '')
        .trim();

    const words = cleaned.split(/\s+/);
    return words[0] || null;
}

/**
 * Extract generic name from brand name (simple heuristic)
 */
/**
 * Smart brand name to generic name mapping
 * Comprehensive list shared across modes
 */
const BRAND_TO_GENERIC_MAP: Record<string, string> = {
    // Common pain relievers
    'CROCIN': 'Paracetamol',
    'PANADOL': 'Paracetamol',
    'TYLENOL': 'Paracetamol',
    'DOLO': 'Paracetamol',
    'CALPOL': 'Paracetamol',
    'SUMOL': 'Paracetamol',

    // Domperidone brands
    'T-DOM': 'Domperidone',
    'DOMSTAL': 'Domperidone',
    'MOTILIUM': 'Domperidone',
    'MOTINORM': 'Domperidone',

    // NSAIDs
    'BRUFEN': 'Ibuprofen',
    'ADVIL': 'Ibuprofen',
    'COMBIFLAM': 'Ibuprofen Paracetamol',
    'IBUGESIC': 'Ibuprofen',
    'VOLINI': 'Diclofenac',
    'VOVERAN': 'Diclofenac',

    // Antibiotics
    'AUGMENTIN': 'Amoxicillin Clavulanate',
    'AMOXIL': 'Amoxicillin',
    'AZITHRAL': 'Azithromycin',
    'ZITHROMAX': 'Azithromycin',
    'CIPLOX': 'Ciprofloxacin',
    'TAXIM': 'Cefixime',

    // Antacids/PPIs
    'ENO': 'Sodium Bicarbonate',
    'GELUSIL': 'Aluminium Hydroxide Magnesium Hydroxide',
    'DIGENE': 'Aluminium Hydroxide Magnesium Hydroxide',
    'OMEZ': 'Omeprazole',
    'PAN': 'Pantoprazole',
    'PANTOCID': 'Pantoprazole',
    'RANTAC': 'Ranitidine',
    'ACILOC': 'Ranitidine',

    // Chronic Conditions
    'GLYCOMET': 'Metformin',
    'GLYCIPHAGE': 'Metformin',
    'ATEN': 'Atenolol',
    'TELMA': 'Telmisartan',
    'AMLONG': 'Amlodipine',
    'ROSUVAS': 'Rosuvastatin',
    'LIPIGARD': 'Atorvastatin'
};

/**
 * Extract generic name from brand name using smart heuristics
 */
function extractGenericFromBrand(brandName: string): string {
    if (!brandName) return brandName;

    const upperBrand = brandName.toUpperCase().trim();

    // 1. Direct Mapping
    if (BRAND_TO_GENERIC_MAP[upperBrand]) {
        return BRAND_TO_GENERIC_MAP[upperBrand];
    }

    // 2. Partial Mapping (e.g., "Dolo 650" -> "Paracetamol")
    for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC_MAP)) {
        if (upperBrand.includes(brand)) {
            return generic;
        }
    }

    // 3. Regex Patterns for Suffixes (e.g., "Azithromycin 500" -> "Azithromycin")
    // Matches word ending in common pharmaceutical suffixes, optionally followed by numbers
    const suffixPattern = /([A-Z][a-z]+(?:mycin|cillin|floxacin|azole|prazole|sartan|statin|formin|vir|dipine|afil))\b/i;
    const suffixMatch = brandName.match(suffixPattern);
    if (suffixMatch) {
        return suffixMatch[1];
    }

    return brandName;
}

/**
 * Generate user-friendly advice based on savings
 */
function generateAdvice(match: { generic_name: string; mrp: number; category: string }, savings?: string, savingsAmount?: number): string {
    if (!savings || !savingsAmount) {
        return `💊 Same medicine available as generic "${match.generic_name}" at ₹${match.mrp} from Janaushadhi Kendra.`;
    }

    if (savingsAmount >= 100) {
        return `🎉 Great savings! Save ₹${savingsAmount.toFixed(0)} (${savings}) by switching to the government generic at your nearest Janaushadhi Kendra. Same quality, much lower price!`;
    } else if (savingsAmount >= 50) {
        return `💰 Save ₹${savingsAmount.toFixed(0)} (${savings})! Generic alternative available at Janaushadhi Kendra near you.`;
    } else if (savingsAmount >= 10) {
        return `✨ Save ₹${savingsAmount.toFixed(0)} with the generic version at Janaushadhi Kendra.`;
    } else {
        return `💊 Generic alternative available at ₹${match.mrp} from Janaushadhi Kendra.`;
    }
}

export default { findJanaushadhiAlternative };
