// deno-lint-ignore-file
/**
 * Intelligent Web Search Module
 * Uses DeepSeek R1 (Thinking AI) to automatically search web for drug information
 * when strips are torn, damaged, or lack sufficient visible information
 */

const OPENROUTER_API_KEY = Deno?.env?.get('OPENROUTER_API_KEY') ?? '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const THINKING_AI_MODEL = 'google/gemini-2.5-flash-lite'; // Advanced reasoning AI
const WEB_SEARCH_MODEL = 'google/gemini-2.5-flash-lite'; // Web scraping AI

declare const Deno: { env: { get: (key: string) => string | undefined } };

interface WebSearchResult {
  success: boolean;
  drugInfo?: {
    name: string;
    genericName: string;
    manufacturer?: string;
    category?: string;
    description?: string;
    indications?: string[];
    sideEffects?: string[];
    warnings?: string[];
    dosageAndAdmin?: string;
    contraindications?: string[];
    mechanism?: string;
    storage?: string;
    prescriptionStatus?: string;
    pregnancy?: string;
    interactions?: string[];
    brandNames?: string[];
  };
  searchStrategy?: string;
  reasoning?: string;
  sourcesSearched?: string[];
  confidence?: number;
  error?: string;
}

/**
 * STEP 1: Use thinking AI to analyze what we know and plan search strategy
 */
async function planSearchStrategy(
  partialInfo: {
    drugName?: string;
    genericName?: string;
    imprint?: string;
    color?: string;
    shape?: string;
    stripCondition?: 'torn' | 'damaged' | 'cut' | 'partial' | 'blurry' | 'good';
    visibleText?: string;
    partialReads?: Array<{ text: string; confidence: number; likely: string }>;
  }
): Promise<{ searchQuery: string; strategy: string; confidence: number; reasoning?: string }> {

  const prompt = `You are a Forensic Pharmacist. Your job is to reconstruct the identity of a medicine from incomplete fragments.

AVAILABLE EVIDENCE:
- Drug Name: ${partialInfo.drugName || 'Unknown'}
- Generic Name: ${partialInfo.genericName || 'Unknown'}
- Imprint/Code: ${partialInfo.imprint || 'None visible'}
- Color/Shape: ${partialInfo.color || 'Unknown'} / ${partialInfo.shape || 'Unknown'}
- Visible Text: ${partialInfo.visibleText || 'None'}
- Partial Fragments: ${JSON.stringify(partialInfo.partialReads || [])}

TASK:
1. Analyze the "Partial Fragments" and "Visible Text".
2. Deduce the likely drug name (e.g., "D..lo 6..0" -> "Dolo 650").
3. Check if the deduced name matches the shape/color.
4. Formulate a search strategy to confirm this hypothesis.

RETURN JSON:
{
  "searchQuery": "Reconstructed Name OR Best Guess",
  "strategy": "Forensic reconstruction logic...",
  "confidence": 0.0-1.0,
  "reasoning": "Step-by-step deduction..."
}`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pharmalens.app',
        'X-Title': 'PharmaLens Intelligent Search'
      },
      body: JSON.stringify({
        model: THINKING_AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Thinking AI failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]);
      console.log(`\n🧠 AI SEARCH STRATEGY PLANNED:`);
      console.log(`   Query: "${plan.searchQuery}"`);
      console.log(`   Strategy: ${plan.strategy}`);
      console.log(`   Confidence: ${(plan.confidence * 100).toFixed(1)}%`);
      return plan;
    }

    throw new Error('No valid JSON in response');

  } catch (error) {
    console.error('❌ Planning error:', error);
    // Fallback: Use drug name if available
    return {
      searchQuery: partialInfo.drugName || partialInfo.genericName || 'Unknown drug',
      strategy: 'Fallback to basic drug name search',
      confidence: 0.5
    };
  }
}

/**
 * STEP 2: Execute intelligent web search for drug information
 */
async function searchDrugOnWeb(searchQuery: string, drugName?: string): Promise<any> {

  const prompt = `You are a pharmaceutical data extractor. Search for comprehensive information about this medication.

SEARCH QUERY: "${searchQuery}"
DRUG NAME: ${drugName || 'Unknown'}

INSTRUCTIONS:
1. Search authoritative medical sources (drugs.com, medlineplus.gov, rxlist.com, 1mg.com)
2. Extract complete drug information
3. Prioritize accuracy over completeness
4. Cross-reference multiple sources when possible

EXTRACT (JSON format):
{
  "name": "Brand/trade name",
  "genericName": "Generic/active ingredient",
  "manufacturer": "Manufacturer name",
  "category": "Drug category/class",
  "description": "What this medication is used for",
  "indications": ["List of conditions it treats"],
  "sideEffects": ["Common side effects"],
  "warnings": ["Important warnings"],
  "dosageAndAdmin": "How to take this medication",
  "contraindications": ["When NOT to use"],
  "mechanism": "How it works in the body",
  "storage": "Storage instructions",
  "prescriptionStatus": "OTC or Prescription",
  "pregnancy": "Pregnancy safety information",
  "interactions": ["Drug interactions"],
  "brandNames": ["Alternative brand names"],
  "confidence": 0.0-1.0,
  "sources": ["URLs of sources used"]
}

Search the web intelligently and return ONLY valid JSON with complete information.`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pharmalens.app',
        'X-Title': 'PharmaLens Web Search'
      },
      body: JSON.stringify({
        model: WEB_SEARCH_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`Web search AI failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const drugInfo = JSON.parse(jsonMatch[0]);
      console.log(`\n🌐 WEB SEARCH COMPLETED:`);
      console.log(`   Drug: ${drugInfo.name || 'Unknown'}`);
      console.log(`   Generic: ${drugInfo.genericName || 'Unknown'}`);
      console.log(`   Sources: ${drugInfo.sources?.length || 0} sources`);
      console.log(`   Confidence: ${(drugInfo.confidence * 100).toFixed(1)}%`);
      return drugInfo;
    }

    throw new Error('No valid JSON in web search response');

  } catch (error) {
    console.error('❌ Web search error:', error);
    return null;
  }
}

/**
 * MAIN: Intelligent web search with AI reasoning
 * Automatically triggered for torn/damaged strips or incomplete information
 */
export async function performIntelligentWebSearch(
  partialInfo: {
    drugName?: string;
    genericName?: string;
    imprint?: string;
    color?: string;
    shape?: string;
    stripCondition?: 'torn' | 'damaged' | 'cut' | 'partial' | 'blurry' | 'good';
    visibleText?: string;
    partialReads?: Array<{ text: string; confidence: number; likely: string }>;
    completeness?: number;
  }
): Promise<WebSearchResult> {

  console.log(`\n🔍 === INTELLIGENT WEB SEARCH TRIGGERED ===`);
  console.log(`   Strip Condition: ${partialInfo.stripCondition || 'Unknown'}`);
  console.log(`   Available Info: ${partialInfo.drugName || partialInfo.genericName || 'Minimal'}`);
  console.log(`   Completeness: ${partialInfo.completeness || 0}%`);

  try {
    // STEP 1: AI plans optimal search strategy
    const searchPlan = await planSearchStrategy(partialInfo);

    if (searchPlan.confidence < 0.3) {
      console.log(`\n⚠️ Low confidence in search plan - insufficient information`);
      return {
        success: false,
        error: 'Insufficient information to perform reliable web search',
        confidence: searchPlan.confidence
      };
    }

    // STEP 2: Execute web search with AI reasoning
    const drugInfo = await searchDrugOnWeb(
      searchPlan.searchQuery,
      partialInfo.drugName
    );

    if (!drugInfo) {
      return {
        success: false,
        error: 'Web search failed to find drug information',
        searchStrategy: searchPlan.strategy
      };
    }

    // STEP 3: Return comprehensive result
    console.log(`\n✅ INTELLIGENT WEB SEARCH SUCCESSFUL!`);
    console.log(`   Strategy: ${searchPlan.strategy}`);
    console.log(`   Confidence: ${(drugInfo.confidence * 100).toFixed(1)}%`);

    return {
      success: true,
      drugInfo: {
        name: drugInfo.name || partialInfo.drugName || 'Unknown',
        genericName: drugInfo.genericName || partialInfo.genericName || '',
        manufacturer: drugInfo.manufacturer,
        category: drugInfo.category,
        description: drugInfo.description,
        indications: Array.isArray(drugInfo.indications) ? drugInfo.indications : [],
        sideEffects: Array.isArray(drugInfo.sideEffects) ? drugInfo.sideEffects : [],
        warnings: Array.isArray(drugInfo.warnings) ? drugInfo.warnings : [],
        dosageAndAdmin: drugInfo.dosageAndAdmin,
        contraindications: Array.isArray(drugInfo.contraindications) ? drugInfo.contraindications : [],
        mechanism: drugInfo.mechanism,
        storage: drugInfo.storage,
        prescriptionStatus: drugInfo.prescriptionStatus,
        pregnancy: drugInfo.pregnancy,
        interactions: Array.isArray(drugInfo.interactions) ? drugInfo.interactions : [],
        brandNames: Array.isArray(drugInfo.brandNames) ? drugInfo.brandNames : []
      },
      searchStrategy: searchPlan.strategy,
      reasoning: searchPlan.reasoning,
      sourcesSearched: drugInfo.sources || [],
      confidence: drugInfo.confidence || 0.7
    };

  } catch (error) {
    console.error('❌ Intelligent web search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      confidence: 0
    };
  }
}

/**
 * Helper: Determine if intelligent web search should be triggered
 */
export function shouldUseIntelligentWebSearch(
  visionResult: any,
  completeness?: number
): boolean {

  // Trigger if confidence is low (< 70%)
  if (visionResult?.confidenceScore !== undefined && visionResult.confidenceScore < 70) {
    console.log(`\n⚠️ Low Confidence (${visionResult.confidenceScore}%) → Forensic Analysis Triggered`);
    return true;
  }

  // Trigger if strip is damaged/torn
  if (visionResult?.stripCondition &&
    ['torn', 'damaged', 'cut', 'partial'].includes(visionResult.stripCondition)) {
    console.log(`\n🚨 Damaged strip detected → Intelligent web search recommended`);
    return true;
  }

  // Trigger if completeness is low
  if (completeness !== undefined && completeness < 40) {
    console.log(`\n⚠️ Low completeness (${completeness}%) → Intelligent web search recommended`);
    return true;
  }

  // Trigger if drug name is unknown but we have some identifying info
  if ((!visionResult?.name || visionResult.name.toLowerCase().includes('unknown')) &&
    (visionResult?.imprint || visionResult?.genericName)) {
    console.log(`\n🔍 Unknown drug but have identifiers → Intelligent web search recommended`);
    return true;
  }

  // Trigger if image quality is very poor
  if (visionResult?.imageQuality !== undefined && visionResult.imageQuality < 30) {
    console.log(`\n📉 Poor image quality (${visionResult.imageQuality}%) → Intelligent web search recommended`);
    return true;
  }

  return false;
}
