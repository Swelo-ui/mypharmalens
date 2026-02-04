import "xhr";

// Shared Helpers
import { checkDrugCache, saveDrugToCache } from './cache-integration.ts';
import { aiCompareDrugNames } from './ai-validator.ts';
import { cleanText, cleanTextArray, generateNameAliases } from '../_shared/text-cleaner.ts';
import { findJanaushadhiAlternative, JanaushadhiMatch } from '../_shared/janaushadhi-lookup.ts';
import { isRateLimitError, createRateLimitResponse, logRateLimit } from '../_shared/rate-limit-handler.ts';
import { performIntelligentWebSearch, shouldUseIntelligentWebSearch } from '../_shared/intelligent-web-search.ts';
import { performCriticalVisionAnalysis } from '../_shared/critical-vision-analysis.ts';

// ============================================================================
// ENHANCED DRUG IDENTIFY V4 - ZERO DEFECTS & ADVANCED ARCHITECTURE
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Models
const MODEL_VISION = 'google/gemini-2.5-flash-lite';      // Primary Intelligence
const MODEL_FAST = 'google/gemini-2.5-flash-lite';   // Speed & Polish
const MODEL_ENHANCEMENT = 'google/gemini-2.5-flash-lite'; // Knowledge Fill

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface DrugData {
  id: string;
  name: string;
  genericName: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  strength?: string;
  dosageForm?: string;
  dosageAndAdmin?: string;
  mechanism?: string;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  indications: string[];
  contraindications: string[];
  pregnancy?: string;
  storage?: string;
  prescriptionStatus?: string;
  color?: string;
  shape?: string;
  imprint?: string;
  expDate?: string;
  mfgDate?: string;
  batchNumber?: string;
  mrp?: string;
  confidence: 'high' | 'medium' | 'low';
  dataSource?: string;
  processingTime?: number;
  janaushadhiAlternative?: JanaushadhiMatch;
  brandNames?: string[];
  
  // Enhanced Fields for UI Sections
  activeIngredients?: string[];
  packSize?: string;
  manufacturerAddress?: string;
  partialReads?: Array<{ text: string; confidence: number; likely: string }>;
  alcoholWarning?: string;
  breastfeedingWarning?: string;
  drivingWarning?: string;
  kidneyWarning?: string;
  liverWarning?: string;
  
  // Metadata
  alternatives?: Record<string, unknown>[];
  imageQuality?: number;
  imageChallenges?: string[];
  retakeNeeded?: boolean;
  retakeTips?: string[];
  searchStrategy?: string;
  sourcesUsed?: string[];
  verified?: boolean;
}

interface ProcessingStage {
  name: string;
  success: boolean;
  data?: unknown;
  processingTime: number;
  modelUsed?: string;
}

interface CriticalVisionData {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  description: string;
  strength: string;
  dosageForm: string;
  dosageAndAdmin: string;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  indications: string[];
  contraindications: string[];
  storage: string;
  prescriptionStatus: string;
  color: string;
  shape: string;
  imprint: string;
  expDate: string;
  mfgDate: string;
  batchNumber: string;
  mrp: string;
  confidenceScore: number;
  imageQuality: number;
  imageChallenges: string[];
  retakeNeeded: boolean;
  retakeTips: string[];
  verified: boolean;
  rawOcrText?: string;
  physicalCondition?: string;
  activeIngredients?: string[];
  packSize?: string;
  manufacturerAddress?: string;
  partialReads?: Array<{ text: string; confidence: number; likely: string }>;
  brandNames?: string[];
}

type UnknownRecord = Record<string, unknown>;

type StripCondition = 'torn' | 'damaged' | 'cut' | 'partial' | 'blurry' | 'good';

function getString(obj: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return '';
}

function getStringArray(obj: UnknownRecord, keys: string[]): string[] {
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

function mapPhysicalConditionToStripCondition(physicalCondition: string | undefined): StripCondition | undefined {
  if (!physicalCondition) return undefined;
  const s = physicalCondition.toLowerCase();
  if (s.includes('torn')) return 'torn';
  if (s.includes('cut')) return 'cut';
  if (s.includes('damage') || s.includes('broken')) return 'damaged';
  if (s.includes('partial')) return 'partial';
  if (s.includes('blur')) return 'blurry';
  if (s.includes('good') || s.includes('intact')) return 'good';
  return undefined;
}

function extractRawBase64Image(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:')) {
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex === -1) return '';
    const dataPart = trimmed.slice(commaIndex + 1);
    return dataPart.replace(/\s+/g, '');
  }

  if (trimmed.includes('base64,')) {
    const parts = trimmed.split('base64,');
    const last = parts[parts.length - 1] ?? '';
    return last.replace(/\s+/g, '');
  }

  return trimmed.replace(/\s+/g, '');
}

// ============================================================================
// HELPER: Create Response
// ============================================================================

function createResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function ensureConfirmedUser(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return createResponse({ error: 'Missing authorization token' }, 401);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return createResponse({ error: 'Server misconfiguration' }, 500);
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY
    }
  });

  if (!response.ok) {
    return createResponse({ error: 'Unauthorized' }, 401);
  }

  const user = await response.json();
  const isConfirmed = !!user?.email_confirmed_at || !!user?.confirmed_at;
  if (!isConfirmed) {
    return createResponse({ error: 'Email not confirmed' }, 403);
  }

  return null;
}

// ============================================================================
// STAGE 1: ADVANCED VISION (The "Eagle Eye")
// ============================================================================

async function performAdvancedVision(imageBase64: string): Promise<CriticalVisionData | null> {
  console.log('\n👁️ === STAGE 1: ADVANCED VISION ANALYSIS ===');
  
  try {
    const result = await performCriticalVisionAnalysis(imageBase64, {
      mode: 'enhanced',
      knownIssues: []
    });

    if (result.success && result.data) {
      console.log(`   ✅ Vision Success: ${result.data.name} (Conf: ${result.confidence}%)`);
      // Cast to CriticalVisionData to ensure type safety
      return result.data as unknown as CriticalVisionData;
    }
    
    throw new Error(result.error || 'Vision analysis failed');
  } catch (error) {
    console.error('   ❌ Vision Error:', error);
    return null;
  }
}

// ============================================================================
// STAGE 2: DATA ENRICHMENT (The "Brain")
// ============================================================================

async function enrichData(
  visionResult: CriticalVisionData, 
  stages: ProcessingStage[]
): Promise<DrugData> {
  console.log('\n🧠 === STAGE 2: INTELLIGENT ENRICHMENT ===');
  const startTime = Date.now();

  let currentData = normalizeCriticalToDrugData(visionResult);
  let enrichmentSource = 'vision-only';

  // 1. Check Cache & Database
  if (currentData.name !== 'Unknown Medication') {
    const variations = generateNameAliases(currentData.name);
    if (currentData.genericName) variations.push(currentData.genericName);
    
    const uniqueVariations = [...new Set(variations)].slice(0, 3);
    console.log(`   Searching DB/Cache for: ${uniqueVariations.join(', ')}`);

    for (const term of uniqueVariations) {
      // Parallel Cache & DB Search
      const [cacheRes, dbRes] = await Promise.allSettled([
        checkDrugCache(term),
        searchLocalDatabase(term)
      ]);

      let foundData: unknown = null;
      let source = '';

      if (cacheRes.status === 'fulfilled' && cacheRes.value) {
        foundData = cacheRes.value;
        source = 'cache';
      } else if (dbRes.status === 'fulfilled' && dbRes.value) {
        foundData = dbRes.value;
        source = 'database';
      }

      if (foundData && typeof foundData === 'object' && foundData !== null) {
        const candidate = foundData as UnknownRecord;
        const candidateName = getString(candidate, ['name', 'drug_name']);
        const candidateGeneric = getString(candidate, ['genericName', 'generic_name']);
        if (!candidateName) continue;

        // VALIDATE: Is this actually the same drug?
        const validation = await aiCompareDrugNames(
            currentData.name, 
            currentData.genericName, 
            candidateName,
            candidateGeneric || undefined
        );

        if (validation.isSame) {
            console.log(`   ✅ Found valid match in ${source}: ${candidateName}`);
            currentData = mergeData(currentData, normalizeToDrugData(candidate, 'high'));
            enrichmentSource = source;
            break;
        } else {
            console.log(`   ⚠️ Mismatch found in ${source}: ${candidateName} (AI Reason: ${validation.reasoning})`);
        }
      }
    }
  }

  // 2. Intelligent Web Search (if needed)
  // Check completeness: trigger if < 70% or if specific key fields are missing
  const completeness = calculateCompleteness(currentData);
  let shouldSearch = shouldUseIntelligentWebSearch(visionResult, completeness);

  // Force search if Name is known but vital info is missing (The user's specific case)
  if (currentData.name !== 'Unknown Medication' && completeness < 80) {
      console.log(`   ⚠️ Name known but data incomplete (${completeness}%) → Forcing Web Search`);
      shouldSearch = true;
  }
  
  if (shouldSearch && enrichmentSource !== 'cache' && enrichmentSource !== 'database') {
    console.log('   🌐 Triggering Intelligent Web Search...');
    
    const searchResult = await performIntelligentWebSearch({
        drugName: currentData.name !== 'Unknown Medication' ? currentData.name : undefined,
        genericName: currentData.genericName,
        imprint: currentData.imprint,
        stripCondition: mapPhysicalConditionToStripCondition(visionResult.physicalCondition),
        visibleText: visionResult.rawOcrText,
        partialReads: visionResult.partialReads || []
    });

    if (searchResult.success && searchResult.drugInfo) {
        console.log(`   ✅ Web Search Success: ${searchResult.drugInfo.name}`);
        currentData = mergeData(currentData, normalizeWebData(searchResult.drugInfo));
        enrichmentSource = 'web-search';
        currentData.searchStrategy = searchResult.searchStrategy;
        currentData.sourcesUsed = searchResult.sourcesSearched;
    }
  }

  // 3. AI Knowledge Enhancement (New Step)
  // If we still have missing fields, use AI knowledge to fill them
  if (enrichmentSource !== 'database' && enrichmentSource !== 'cache') {
    currentData = await enhanceWithAIKnowledge(currentData);
  }

  // 4. AI Hallucination Check & Final Polish
  if (enrichmentSource !== 'database' && enrichmentSource !== 'cache') {
    currentData = await polishWithAI(currentData);
  }

  currentData.dataSource = enrichmentSource;
  
  stages.push({
    name: 'enrichment',
    success: true,
    data: { source: enrichmentSource },
    processingTime: Date.now() - startTime
  });

  return currentData;
}

async function searchLocalDatabase(term: string): Promise<unknown> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_drugs_by_name`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ search_name: term, similarity_threshold: 0.75 })
      });
      if (!response.ok) return null;
      const json = await response.json();
      return json?.[0] || null;
}

// ============================================================================
// STAGE 3: AI KNOWLEDGE ENHANCEMENT (The "Expert")
// ============================================================================

async function enhanceWithAIKnowledge(
  currentData: DrugData
): Promise<DrugData> {
  const drugName = currentData.name;
  const genericName = currentData.genericName;

  // If name is still unknown, we can't enhance much
  if (!drugName || drugName === 'Unknown Medication') {
    return currentData;
  }

  console.log('\n🧪 === STAGE 2.5: AI KNOWLEDGE ENHANCEMENT ===');
  const targetName = drugName;
  console.log(`   Enhancing: "${targetName}"`);

  // Check which fields are missing
  const missingFields: string[] = [];
  if (!currentData.description || currentData.description.length < 20) missingFields.push('description');
  if (!currentData.mechanism || currentData.mechanism.length < 20) missingFields.push('mechanism');
  if (!currentData.sideEffects?.length) missingFields.push('sideEffects');
  if (!currentData.warnings?.length) missingFields.push('warnings');
  if (!currentData.indications?.length) missingFields.push('indications');
  if (!currentData.contraindications?.length) missingFields.push('contraindications');
  if (!currentData.interactions?.length) missingFields.push('interactions');
  if (!currentData.pregnancy) missingFields.push('pregnancy');
  if (!currentData.dosageAndAdmin) missingFields.push('dosageAndAdmin');
  if (!currentData.storage) missingFields.push('storage');
  if (!currentData.brandNames?.length) missingFields.push('brandNames');

  if (missingFields.length === 0) {
    console.log('   All fields present - no enhancement needed');
    return currentData;
  }

  console.log(`   Missing fields: ${missingFields.join(', ')}`);

  const prompt = `You are a Senior Clinical Pharmacist and Patient Educator with 20+ years of experience.
Your goal is to provide 99% ACCURATE, COMPREHENSIVE, and PATIENT-FRIENDLY information.

DRUG: "${targetName}"${genericName ? ` (Generic: ${genericName})` : ''}

TASK: Provide missing medical details for the following fields:
${missingFields.map(f => `- ${f}`).join('\n')}

CRITICAL STYLE GUIDELINES (S-TIER QUALITY):
1. **LAYMAN TERMS**: You MUST explain complex medical jargon in brackets immediately after the term.
   - Bad: "Antipyretic and analgesic."
   - Good: "Antipyretic (fever reducer) and analgesic (pain reliever)."
   - Bad: "Treats dyspepsia."
   - Good: "Treats dyspepsia (indigestion/heartburn)."

2. **COMPREHENSIVE LISTS**:
   - For 'sideEffects', 'warnings', 'indications', 'contraindications': Provide 5-7 distinct, actionable points.
   - Prioritize "Black Box" warnings and common severe reactions first.

3. **CLEAR DESCRIPTIONS**:
   - For 'description', 'mechanism', 'usage': Write clear, professional paragraphs (2-3 sentences).
   - Use natural, empathetic but authoritative language.

4. **SAFETY FIRST**:
   - Highlight pregnancy/breastfeeding risks clearly.
   - Mention critical drug interactions if asking for 'interactions'.

RETURN ONLY VALID JSON (No Markdown):
{
${missingFields.map(field => {
    if (['sideEffects', 'contraindications', 'interactions', 'warnings', 'indications', 'brandNames'].includes(field)) {
      return `  "${field}": ["item1", "item2", "item3"]`;
    } else {
      return `  "${field}": "Comprehensive description with medical terms explained (like this) for clarity."`;
    }
  }).join(',\n')}
}`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SUPABASE_URL,
        'X-Title': 'PharmaLens Knowledge Enhancement'
      },
      body: JSON.stringify({
        model: MODEL_ENHANCEMENT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      console.error(`❌ Enhancement API error: ${response.status}`);
      return currentData;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (content) {
      try {
        const enhancement = JSON.parse(content);
        const newData = { ...currentData };

        // Merge enhancement into data
        let enhancedCount = 0;
        missingFields.forEach(field => {
          const value = enhancement[field];
          if (value) {
            if (Array.isArray(value) && value.length > 0) {
              (newData as UnknownRecord)[field] = cleanTextArray(value);
              enhancedCount++;
              console.log(`   ✅ Enhanced ${field}: ${value.length} items`);
            } else if (typeof value === 'string' && value.length > 10) {
              (newData as UnknownRecord)[field] = cleanText(value);
              enhancedCount++;
              console.log(`   ✅ Enhanced ${field}`);
            }
          }
        });

        console.log(`🧪 Enhancement complete: ${enhancedCount}/${missingFields.length} fields filled`);
        return newData;
      } catch (e) {
        console.error('❌ Failed to parse enhancement JSON:', e);
      }
    }

  } catch (error) {
    console.error('❌ Enhancement error:', error);
  }

  return currentData;
}

// ============================================================================
// STAGE 4: SYNTHESIS & POLISH (The "Author")
// ============================================================================

async function polishWithAI(data: DrugData): Promise<DrugData> {
    console.log('   ✨ Polishing data with AI...');
    const prompt = `Review and standardise this drug data. Ensure medical accuracy.
    
    Input: ${JSON.stringify(data)}
    
    Task:
    1. Fix capitalization (Title Case for names).
    2. Ensure arrays (sideEffects, etc.) are clean lists.
    3. Fill missing "description" or "mechanism" if Generic Name is known.
    4. Remove "Unknown" placeholders if possible.
    5. Add warnings for: Alcohol, Pregnancy, Breastfeeding, Driving, Kidney, Liver if applicable.
    
    Return JSON only.`;

    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': SUPABASE_URL,
              'X-Title': 'PharmaLens Polish'
            },
            body: JSON.stringify({
              model: MODEL_FAST, // Use Lite for formatting
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' }
            })
          });

          const result = await response.json();
          const content = result.choices?.[0]?.message?.content;
          if (content) {
              const polished = JSON.parse(content);
              return ensureDrugDataForUI({ ...data, ...(polished as Partial<DrugData>) });
          }
    } catch (e) {
        console.warn('   ⚠️ Polish failed, returning original:', e);
    }
    return ensureDrugDataForUI(data);
}

// ============================================================================
// DATA NORMALIZERS
// ============================================================================

function normalizeCriticalToDrugData(cvData: CriticalVisionData): DrugData {
    return {
        id: cvData.id || crypto.randomUUID(),
        name: cvData.name,
        genericName: cvData.genericName,
        manufacturer: cvData.manufacturer,
        category: cvData.category,
        description: cvData.description,
        strength: cvData.strength,
        dosageForm: cvData.dosageForm,
        dosageAndAdmin: cvData.dosageAndAdmin,
        sideEffects: cvData.sideEffects || [],
        warnings: cvData.warnings || [],
        interactions: cvData.interactions || [],
        indications: cvData.indications || [],
        contraindications: cvData.contraindications || [],
        storage: cvData.storage,
        prescriptionStatus: cvData.prescriptionStatus,
        color: cvData.color,
        shape: cvData.shape,
        imprint: cvData.imprint,
        expDate: cvData.expDate,
        mfgDate: cvData.mfgDate,
        batchNumber: cvData.batchNumber,
        mrp: cvData.mrp,
        confidence: (cvData.confidenceScore >= 80 ? 'high' : cvData.confidenceScore >= 50 ? 'medium' : 'low'),
        dataSource: 'vision',
        imageQuality: cvData.imageQuality,
        imageChallenges: cvData.imageChallenges,
        retakeNeeded: cvData.retakeNeeded,
        retakeTips: cvData.retakeTips,
        verified: cvData.verified,
        activeIngredients: cvData.activeIngredients,
        packSize: cvData.packSize,
        manufacturerAddress: cvData.manufacturerAddress
    };
}

function normalizeToDrugData(data: UnknownRecord, confidence: 'high' | 'medium' | 'low'): DrugData {
    return {
      id: getString(data, ['id']) || crypto.randomUUID(),
      name: getString(data, ['name', 'drug_name']),
      genericName: getString(data, ['genericName', 'generic_name']),
      manufacturer: getString(data, ['manufacturer']),
      category: getString(data, ['category', 'drug_class']),
      description: getString(data, ['description']),
      strength: getString(data, ['strength']),
      dosageForm: getString(data, ['dosageForm', 'dosage_form']),
      dosageAndAdmin: getString(data, ['dosageAndAdmin', 'dosage_and_admin']),
      mechanism: getString(data, ['mechanism', 'mechanism_of_action']),
      sideEffects: cleanTextArray(getStringArray(data, ['sideEffects', 'side_effects'])),
      warnings: cleanTextArray(getStringArray(data, ['warnings'])),
      interactions: cleanTextArray(getStringArray(data, ['interactions', 'drug_interactions'])),
      indications: cleanTextArray(getStringArray(data, ['indications', 'uses'])),
      contraindications: cleanTextArray(getStringArray(data, ['contraindications'])),
      pregnancy: getString(data, ['pregnancy', 'pregnancy_category']),
      storage: getString(data, ['storage', 'storage_conditions']),
      prescriptionStatus: getString(data, ['prescriptionStatus', 'prescription_status']),
      color: getString(data, ['color']),
      shape: getString(data, ['shape']),
      imprint: getString(data, ['imprint']),
      expDate: getString(data, ['expDate', 'exp_date']),
      mfgDate: getString(data, ['mfgDate', 'mfg_date']),
      batchNumber: getString(data, ['batchNumber', 'batch_number']),
      mrp: getString(data, ['mrp']),
      confidence,
      dataSource: getString(data, ['dataSource']) || 'database',
      activeIngredients: getStringArray(data, ['activeIngredients']),
      packSize: getString(data, ['packSize', 'pack_size']),
      manufacturerAddress: getString(data, ['manufacturerAddress', 'manufacturer_address']),
      brandNames: getStringArray(data, ['brandNames', 'brand_names', 'popular_brands'])
    };
}

function normalizeWebData(data: UnknownRecord): Partial<DrugData> {
    return {
        name: getString(data, ['name', 'drug_name']),
        genericName: getString(data, ['genericName', 'generic_name']),
        manufacturer: getString(data, ['manufacturer']),
        category: getString(data, ['category']),
        description: getString(data, ['description']),
        indications: getStringArray(data, ['indications']),
        sideEffects: getStringArray(data, ['sideEffects']),
        warnings: getStringArray(data, ['warnings']),
        dosageAndAdmin: getString(data, ['dosageAndAdmin']),
        contraindications: getStringArray(data, ['contraindications']),
        mechanism: getString(data, ['mechanism']),
        storage: getString(data, ['storage']),
        prescriptionStatus: getString(data, ['prescriptionStatus']),
        interactions: getStringArray(data, ['interactions'])
    };
}

function mergeData(base: DrugData, update: Partial<DrugData>): DrugData {
    const merged: DrugData = { ...base };

    const arrayKeys = [
      'sideEffects',
      'warnings',
      'interactions',
      'indications',
      'contraindications',
      'activeIngredients',
      'brandNames'
    ] as const;

    const stringKeys = [
      'name',
      'genericName',
      'manufacturer',
      'manufacturerAddress',
      'category',
      'description',
      'strength',
      'dosageForm',
      'dosageAndAdmin',
      'mechanism',
      'pregnancy',
      'storage',
      'prescriptionStatus',
      'color',
      'shape',
      'imprint',
      'expDate',
      'mfgDate',
      'batchNumber',
      'mrp',
      'packSize',
      'alcoholWarning',
      'breastfeedingWarning',
      'drivingWarning',
      'kidneyWarning',
      'liverWarning',
      'searchStrategy'
    ] as const;

    for (const key of arrayKeys) {
      const value = update[key];
      if (!value) continue;
      if (!Array.isArray(value)) continue;
      const previous = merged[key] ?? [];
      merged[key] = [...new Set([...(previous as string[]), ...value])];
    }

    for (const key of stringKeys) {
      const value = update[key];
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      if (trimmed.toLowerCase() === 'unknown') continue;
      (merged as Record<(typeof stringKeys)[number], string | undefined>)[key] = trimmed;
    }

    if (update.sourcesUsed && Array.isArray(update.sourcesUsed)) {
      merged.sourcesUsed = [...new Set([...(merged.sourcesUsed ?? []), ...update.sourcesUsed])];
    }

    if (typeof update.imageQuality === 'number') merged.imageQuality = update.imageQuality;
    if (typeof update.retakeNeeded === 'boolean') merged.retakeNeeded = update.retakeNeeded;
    if (update.retakeTips && Array.isArray(update.retakeTips)) merged.retakeTips = update.retakeTips;
    if (typeof update.verified === 'boolean') merged.verified = update.verified;
    if (update.alternatives && Array.isArray(update.alternatives)) merged.alternatives = update.alternatives;
    if (update.imageChallenges && Array.isArray(update.imageChallenges)) merged.imageChallenges = update.imageChallenges;

    return merged;
}

function calculateCompleteness(data: DrugData): number {
    const checks: Array<boolean> = [
      !!data.name && data.name !== 'Unknown Medication',
      !!data.genericName,
      !!data.description,
      Array.isArray(data.sideEffects) && data.sideEffects.length > 0,
      Array.isArray(data.warnings) && data.warnings.length > 0,
      !!data.dosageAndAdmin,
      !!data.storage,
      Array.isArray(data.contraindications) && data.contraindications.length > 0
    ];
    const filled = checks.filter(Boolean).length;
    return (filled / checks.length) * 100;
}

function ensureDrugDataForUI(input: DrugData): DrugData {
  const output: DrugData = {
    ...input,
    id: input.id || crypto.randomUUID(),
    name: input.name || 'Unknown Medication',
    genericName: input.genericName || '',
    sideEffects: Array.isArray(input.sideEffects) ? input.sideEffects : [],
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    interactions: Array.isArray(input.interactions) ? input.interactions : [],
    indications: Array.isArray(input.indications) ? input.indications : [],
    contraindications: Array.isArray(input.contraindications) ? input.contraindications : [],
    confidence: input.confidence || 'low'
  };

  output.activeIngredients = Array.isArray(input.activeIngredients) ? input.activeIngredients : [];
  output.retakeTips = Array.isArray(input.retakeTips) ? input.retakeTips : [];
  output.sourcesUsed = Array.isArray(input.sourcesUsed) ? input.sourcesUsed : [];
  output.imageChallenges = Array.isArray(input.imageChallenges) ? input.imageChallenges : [];
  output.alternatives = Array.isArray(input.alternatives) ? input.alternatives : [];
  output.brandNames = Array.isArray(input.brandNames) ? input.brandNames : [];

  return output;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const confirmationError = await ensureConfirmedUser(req);
  if (confirmationError) {
    return confirmationError;
  }

  const startTime = Date.now();
  const stages: ProcessingStage[] = [];

  console.log('\n' + '='.repeat(60));
  console.log('🚀 ENHANCED DRUG IDENTIFY V4 (ZERO DEFECTS)');
  console.log('='.repeat(60));

  try {
    const body = await req.json();
    const rawImage = body.image || body.imageBase64;

    if (!rawImage) {
      return createResponse({ error: 'No image provided' }, 400);
    }

    const image = typeof rawImage === 'string' ? extractRawBase64Image(rawImage) : '';
    if (!image) {
      return createResponse({ error: 'Invalid image data provided' }, 400);
    }

    // --- STAGE 1: VISION ---
    const visionData = await performAdvancedVision(image);
    stages.push({
      name: 'vision-analysis',
      success: !!visionData,
      processingTime: Date.now() - startTime,
      modelUsed: MODEL_VISION
    });

    if (!visionData) {
      const processingTime = Date.now() - startTime;
      return createResponse({
        success: false,
        error: 'Could not process image. Please try a clearer photo.',
        data: ensureDrugDataForUI({
          id: crypto.randomUUID(),
          name: 'Unknown Medication',
          genericName: '',
          sideEffects: [],
          warnings: [],
          interactions: [],
          indications: [],
          contraindications: [],
          confidence: 'low',
          retakeNeeded: true,
          retakeTips: [
            'Ensure good lighting',
            'Keep the label in focus',
            'Capture the full packaging',
            'Avoid reflections and shadows'
          ]
        } as DrugData),
        processingStages: stages.map(s => s.name),
        confidence: 'low',
        processingTime
      }, 200);
    }

    // --- STAGE 2: ENRICHMENT ---
    
    // Start Janaushadhi lookup in parallel
    let janaushadhiPromise: Promise<JanaushadhiMatch> | null = null;
    if (visionData.name && visionData.name !== 'Unknown Medication') {
         console.log(`⚡ Starting parallel Janaushadhi lookup for: "${visionData.name}"`);
         janaushadhiPromise = findJanaushadhiAlternative(visionData.genericName || visionData.name);
    }

    const drugData = ensureDrugDataForUI(await enrichData(visionData, stages));

    // --- STAGE 3: JANAUSHADHI ---
    try {
        if (janaushadhiPromise) {
            const ja = await janaushadhiPromise;
            
            // Ensure MRP is a number to prevent "0" string issues
            if (ja.found && ja.mrp !== undefined) {
                ja.mrp = Number(ja.mrp);
            }

            // ALWAYS attach the result so frontend knows we checked
            drugData.janaushadhiAlternative = ja;
            
            if (ja.found) {
                // Add to alternatives list for UI visibility (legacy support)
                const janaushadhiEntry = {
                    name: ja.genericName,
                    brand: "Janaushadhi Pariyojana",
                    manufacturer: "Bureau of Pharma PSUs of India (BPPI)",
                    price: `₹${ja.mrp}`,
                    saved: ja.savings,
                    description: ja.advice,
                    drugCode: ja.drugCode,
                    strength: ja.strength,
                    formulation: ja.formulation,
                    isJanaushadhi: true,
                    type: 'Generic Alternative'
                };
                
                drugData.alternatives = drugData.alternatives || [];
                drugData.alternatives.unshift(janaushadhiEntry);

                console.log(`   🏥 Janaushadhi Found: ₹${ja.mrp}`);
            } else {
                console.log(`   🏥 Janaushadhi Not Found`);
            }
        } else {
             drugData.janaushadhiAlternative = { found: false };
        }
    } catch (e) {
        console.error('   ❌ Janaushadhi Stage Error:', e);
        drugData.janaushadhiAlternative = { found: false };
    }

    // Final safety check
    if (!drugData.janaushadhiAlternative) {
        drugData.janaushadhiAlternative = { found: false };
    }

    const isMeaningless =
      drugData.name === 'Unknown Medication' &&
      (!drugData.genericName || drugData.genericName.toLowerCase() === 'unknown');

    // --- FINAL: CACHE & RESPONSE ---
    const processingTime = Date.now() - startTime;
    drugData.processingTime = processingTime;

    if (isMeaningless) {
      const tips = drugData.retakeTips && drugData.retakeTips.length > 0
        ? drugData.retakeTips
        : [
            'Ensure good lighting',
            'Keep the label in focus',
            'Capture the full packaging',
            'Avoid reflections and shadows'
          ];

      return createResponse({
        success: false,
        error: 'Could not identify medication. Please try a clearer photo.',
        data: {
          ...drugData,
          retakeNeeded: true,
          retakeTips: tips
        },
        processingStages: stages.map(s => s.name),
        confidence: 'low',
        processingTime
      }, 200);
    }

    // Async Cache Save
    saveDrugToCache(drugData).catch(e => console.error('Cache save error:', e));

    console.log('\n' + '='.repeat(60));
    console.log('✅ IDENTIFICATION COMPLETE');
    console.log(`   Drug: ${drugData.name}`);
    console.log(`   Confidence: ${drugData.confidence}`);
    console.log(`   Source: ${drugData.dataSource}`);
    console.log(`   Time: ${processingTime}ms`);
    console.log('='.repeat(60) + '\n');

    return createResponse({
      success: true,
      data: drugData,
      processingStages: stages.map(s => s.name),
      confidence: drugData.confidence,
      fallbackUsed: drugData.dataSource !== 'database',
      processingTime
    });

  } catch (error: unknown) {
    console.error('❌ Fatal Error:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    if (isRateLimitError(err)) {
        logRateLimit('enhanced-drug-identify', err.message);
        return createResponse(createRateLimitResponse());
    }
    return createResponse({
        success: false,
        error: err.message,
        processingStages: stages.map(s => s.name)
    }, 500);
  }
});
