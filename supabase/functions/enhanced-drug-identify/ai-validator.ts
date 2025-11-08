// AI-based drug name validation utility
// Shared by cache-integration.ts and local database search

declare const Deno: { env: { get: (key: string) => string | undefined } };

const OPENROUTER_API_KEY = Deno?.env?.get('OPENROUTER_API_KEY') ?? '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_CACHE_VALIDATOR_MODEL = 'meituan/longcat-flash-chat:free'; // Smart, fast, free model
const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? '';

/**
 * Use AI to intelligently compare if two drug names refer to the SAME medication
 * This prevents false matches like "Urispas" matching with "Cyproheptadine"
 * Returns: { isSame: boolean, confidence: number, reasoning: string }
 */
export async function aiCompareDrugNames(
  extractedName: string,
  extractedGeneric: string | undefined,
  matchedName: string,
  matchedGeneric: string | undefined
): Promise<{ isSame: boolean; confidence: number; reasoning: string }> {
  if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ OpenRouter API key missing - using strict exact match fallback');
    // Fallback to strict exact matching if no AI available
    const exactMatch = extractedName.toLowerCase().trim() === matchedName.toLowerCase().trim();
    return {
      isSame: exactMatch,
      confidence: exactMatch ? 1.0 : 0.0,
      reasoning: 'Exact match only (no AI available)'
    };
  }

  try {
    console.log(`\n🤖 AI Drug Comparison:`);  
    console.log(`   Extracted: "${extractedName}" (Generic: "${extractedGeneric || 'N/A'}")`);
    console.log(`   Matched: "${matchedName}" (Generic: "${matchedGeneric || 'N/A'}")`);

    const prompt = `You are a pharmaceutical expert specializing in drug identification and matching. Compare these two drugs and determine if they are the SAME medication (same active ingredient composition).

**Drug 1 (Extracted from image):**
- Name: ${extractedName}
- Generic Name: ${extractedGeneric || 'Unknown'}

**Drug 2 (From database):**
- Name: ${matchedName}  
- Generic Name: ${matchedGeneric || 'Unknown'}

**CRITICAL MATCHING RULES:**

1. **IGNORE formatting differences**: "&" vs "/", "-H" vs "", case differences, spaces
2. **COMPARE active ingredients**: Match by active pharmaceutical ingredients, not exact text
3. **BRAND vs GENERIC matching**: Brand name "Losapot-H" = Generic "Losartan/Hydrochlorothiazide" = SAME
4. **Generic name variations**: "Losartan Potassium & Hydrochlorothiazide" = "Losartan potassium/Hydrochlorothiazide" = SAME
5. **Salt form variations**: "Metformin" = "Metformin Hydrochloride" = SAME (same active ingredient)
6. **Punctuation/spacing**: Ignore "/", "&", "+", "-", spaces in comparison
7. **Dosage forms**: SAME drug in different forms (tablet/syrup) = DIFFERENT
8. **Combination drugs**: MUST have ALL the same active ingredients

**POSITIVE MATCH EXAMPLES (These are SAME drug):**
✅ "Losapot-H" vs "Losartan/Hydrochlorothiazide" = SAME (brand vs generic of combination)
✅ "Losartan Potassium & Hydrochlorothiazide" vs "Losartan potassium/Hydrochlorothiazide" = SAME (formatting only)
✅ "Naxdom 500" vs "Naxdom-500" = SAME (hyphen variation)
✅ "Paracetamol 500mg" vs "Crocin 500" (Paracetamol) = SAME (different brands)
✅ "Cyproheptadine" vs "Cyproheptadine Hydrochloride" = SAME (salt form)
✅ "Amoxicillin + Clavulanic Acid" vs "Amoxicillin/Clavulanic acid" = SAME (punctuation/case)
✅ "Atorvastatin Calcium" vs "Atorvastatin" = SAME (salt variation)
✅ "Metformin HCl" vs "Metformin Hydrochloride" = SAME (abbreviation)

**NEGATIVE MATCH EXAMPLES (These are DIFFERENT drugs):**
❌ "Urispas" (Flavoxate) vs "Cyproheptadine" = DIFFERENT (completely different active ingredients)
❌ "Paracetamol" vs "Paracetamol + Ibuprofen" = DIFFERENT (single vs combination)
❌ "M2-TONE Syrup" vs "M2-TONE Tablet" = DIFFERENT (different dosage forms)
❌ "Atorvastatin 10mg" vs "Atorvastatin 20mg" = DIFFERENT (different dosages)
❌ "Losartan" (single) vs "Losartan + Hydrochlorothiazide" = DIFFERENT (single vs combination)

**ANALYSIS APPROACH:**
1. Extract active ingredient(s) from both names/generics
2. Normalize: lowercase, remove punctuation (&, /, +, -, spaces)
3. Compare active ingredient lists
4. If ALL active ingredients match → SAME drug
5. If any ingredient differs → DIFFERENT drug
6. Ignore brand names if generic names match

**Response Format (JSON only):**
{
  "isSame": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation focusing on active ingredients"
}

Respond with JSON only:`;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SUPABASE_URL,
        'X-Title': 'PharmaLens Drug Validator'
      },
      body: JSON.stringify({
        model: OPENROUTER_CACHE_VALIDATOR_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 256
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    // Parse JSON from AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log(`   AI Decision: ${result.isSame ? '✅ SAME' : '❌ DIFFERENT'}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Reasoning: ${result.reasoning}`);
      return result;
    }

    throw new Error('No valid JSON in AI response');
  } catch (error) {
    console.error('❌ AI comparison failed:', error);
    // Fallback to strict string matching on error
    const exactMatch = extractedName.toLowerCase().trim() === matchedName.toLowerCase().trim();
    return {
      isSame: exactMatch,
      confidence: exactMatch ? 1.0 : 0.0,
      reasoning: 'AI failed - using exact match (fallback)'
    };
  }
}
