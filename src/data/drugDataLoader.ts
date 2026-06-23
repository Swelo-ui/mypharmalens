import { DrugData } from "@/components/DrugCard";
import { getDrugsFromOffline, isOfflineDataAvailable } from "@/services/offlineDrugStorage";

function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Lazy loading functions for drug data
const drugDataLoaders = {
  cardiovascular: () => import("./cardiovascularDrugs").then(m => m.cardiovascularDrugs),
  respiratory: () => import("./respiratoryDrugs").then(m => m.respiratoryDrugs),
  gastrointestinal: () => import("./gastrointestinalDrugs").then(m => m.gastrointestinalDrugs),
  endocrine: () => import("./endocrineDrugs").then(m => m.endocrineDrugs),
  centralNervous: () => import("./centralNervousDrugs").then(m => m.centralNervousDrugs),
  antibiotic: () => import("./antibioticDrugs").then(m => m.antibioticDrugs),
  antiviral: () => import("./antiviralDrugs").then(m => m.antiviralDrugs),
  antimalarial: () => import("./antimalarialDrugs").then(m => m.antimalarialDrugs),
  supplement: () => import("./supplementDrugs").then(m => m.supplementDrugs),
  other: () => import("./otherDrugs").then(m => m.otherDrugs),
  extraWHO: () => import("./extraWHODrugs").then(m => m.extraWHODrugs),
  additional: () => import("./additionalDrugsData").then(m => m.additionalDrugsData),
  antiparasitic: () => import("./antiparasiticDrugs").then(m => m.antiparasiticDrugs),
  miscellaneous: () => import("./miscellaneousDrugs").then(m => m.miscellaneousDrugs),
  painManagement: () => import("./painManagementDrugs").then(m => m.painManagementDrugs),
  steroidHormone: () => import("./steroidHormoneDrugs").then(m => m.steroidHormoneDrugs),
  oncology: () => import("./oncologyDrugs").then(m => m.oncologyDrugs),
  immunology: () => import("./immunologyDrugs").then(m => m.immunologyDrugs),
  emergency: () => import("./emergencyDrugs").then(m => m.emergencyDrugs),
  obstetrics: () => import("./obstetricsDrugs").then(m => m.obstetricsDrugs),
  gastroenterology: () => import("./gastroenterologyDrugs").then(m => m.gastroenterologyDrugs),
  hematology: () => import("./hematologyDrugs").then(m => m.hematologyDrugs),
  neurology: () => import("./neurologyDrugs").then(m => m.neurologyDrugs),
  infectiousDiseases: () => import("./infectiousDiseasesDrugs").then(m => m.infectiousDiseasesDrugs),
  anesthetic: () => import("./anestheticDrugs").then(m => m.anestheticDrugs),
  dermatological: () => import("./dermatologicalDrugs").then(m => m.dermatologicalDrugs),
  muscleRelaxant: () => import("./muscleRelaxantDrugs").then(m => m.muscleRelaxantDrugs),
  vaccine: () => import("./vaccineDrugs").then(m => m.vaccineDrugs),
  urology: () => import("./urologyDrugs").then(m => m.urologyDrugs),
  // Recently added combination drug files
  cardiovascularCombination: () => import("./cardiovascularCombinationDrugs").then(m => m.cardiovascularCombinationDrugs),
  antidiabeticCombination: () => import("./antidiabeticCombinationDrugs").then(m => m.antidiabeticCombinationDrugs),
  painInflammationMusculoskeletal: () => import("./painInflammationMusculoskeletal").then(m => m.painInflammationMusculoskeletal),
  antibioticsAntimicrobialCombinations: () => import("./antibioticsAndAntimicrobialCombinations").then(m => m.antibioticsAndAntimicrobialCombinations),
  // Additional drug files
  gastroenterologyDigestiveHealth: () => import("./gastroenterologyDigestiveHealthDrugs").then(m => m.gastroenterologyDigestiveHealthDrugs),
  vitaminsNutritionalSupplements: () => import("./vitaminsNutritionalSupplementsDrugs").then(m => m.vitaminsNutritionalSupplementsDrugs),
  // New specialized categories
  respiratoryCombination: () => import("./respiratoryCombinationDrugs").then(m => m.respiratoryCombinationDrugs),
  ophthalmology: () => import("./ophthalmologyDrugs").then(m => m.ophthalmologyDrugs),
  cognitiveNootropic: () => import("./cognitiveNootropicDrugs").then(m => m.cognitiveNootropicDrugs),
  gynecology: () => import("./gynecologyDrugs").then(m => m.gynecologyDrugs),
  dermatologyExpansion: () => import("./dermatologyExpansionDrugs").then(m => m.dermatologyExpansionDrugs),
  supplementsExpansion: () => import("./supplementsExpansionDrugs").then(m => m.supplementsExpansionDrugs),
  gastrointestinalExpansion: () => import("./gastrointestinalExpansionDrugs").then(m => m.gastrointestinalExpansionDrugs),
  permethrinScabies: () => import("./permethrinScabiesDrugs").then(m => m.permethrinScabiesDrugs),
  additionalMiscellaneous: () => import("./additionalMiscellaneousDrugs").then(m => m.additionalMiscellaneousDrugs),
  finalExpansion: () => import("./finalExpansionDrugs").then(m => m.finalExpansionDrugs),
  miscellaneousExpansion: () => import("./miscellaneousExpansionDrugs").then(m => m.miscellaneousExpansionDrugs),
  // New specialized categories
  addictionTreatment: () => import("./addictionTreatmentDrugs").then(m => m.addictionTreatmentDrugs),
  enzymeDigestive: () => import("./enzymeDigestiveDrugs").then(m => m.enzymeDigestiveDrugs),
  contrastAgents: () => import("./contrastAgentsDrugs").then(m => m.contrastAgentsDrugs),
  fertility: () => import("./fertilityDrugs").then(m => m.fertilityDrugs),
  painInflammationCombination: () => import("./painInflammationCombinationDrugs").then(m => m.painInflammationCombinationDrugs),
  dermatology: () => import("./dermatologyDrugs").then(m => m.dermatologyDrugs),
  // Jan Aushadhi Missing Expansions
  antiDiabeticExpansion: () => import("./antiDiabeticExpansionDrugs").then(m => m.antiDiabeticExpansionDrugs),
  respiratoryExpansion: () => import("./respiratoryExpansionDrugs").then(m => m.respiratoryExpansionDrugs),
  cvsExpansion: () => import("./cvsExpansionDrugs").then(m => m.cvsExpansionDrugs),
  cnsExpansion: () => import("./cnsExpansionDrugs").then(m => m.cnsExpansionDrugs),
  oncologyExpansion: () => import("./oncologyExpansionDrugs").then(m => m.oncologyExpansionDrugs),
  supplementExpansion: () => import("./supplementExpansionDrugs").then(m => m.supplementExpansionDrugs),
  antibioticExpansion: () => import("./antibioticExpansionDrugs").then(m => m.antibioticExpansionDrugs),
  gastrointestinalExpansion2: () => import("./gastrointestinalExpansionDrugs").then(m => m.gastrointestinalExpansionDrugs), // Named 2 to avoid collision with gastrointestinalExpansion
  painRheumatologyExpansion: () => import("./painRheumatologyExpansionDrugs").then(m => m.painRheumatologyExpansionDrugs),
  neurologyPsychiatryExpansion: () => import("./neurologyPsychiatryExpansionDrugs").then(m => m.neurologyPsychiatryExpansionDrugs),
  endocrineWomensHealthExpansion: () => import("./endocrineWomensHealthExpansionDrugs").then(m => m.endocrineWomensHealthExpansionDrugs),
  batch3Expansion: () => import("./batch3ExpansionDrugs").then(m => m.batch3ExpansionDrugs),
  batch4Expansion: () => import("./batch4ExpansionDrugs").then(m => m.batch4ExpansionDrugs),
};

// Cache for loaded drug data
const drugDataCache = new Map<string, DrugData[]>();
let allDrugsCache: DrugData[] | null = null;

// Load specific drug category
export const loadDrugCategory = async (category: keyof typeof drugDataLoaders): Promise<DrugData[]> => {
  if (drugDataCache.has(category)) {
    return drugDataCache.get(category)!;
  }

  const drugs = await drugDataLoaders[category]();
  drugDataCache.set(category, drugs);
  return drugs;
};

// Load all drug data with offline-first support
export const loadAllDrugs = async (): Promise<DrugData[]> => {
  // Return cached data if available
  if (allDrugsCache) {
    return allDrugsCache;
  }

  // If offline and offline data is available, use IndexedDB data
  if (!navigator.onLine) {
    try {
      const hasOfflineData = await isOfflineDataAvailable();
      if (hasOfflineData) {
        console.log('📴 Offline mode: Loading drugs from IndexedDB');
        const offlineDrugs = await getDrugsFromOffline();
        if (offlineDrugs.length > 0) {
          // Cast offline data to DrugData type
          allDrugsCache = offlineDrugs as unknown as DrugData[];
          return allDrugsCache;
        }
      }
    } catch (error) {
      console.warn('Failed to load offline data, falling back to bundled data:', error);
    }
  }

  // Load from bundled data (normal flow)
  const allCategories = Object.keys(drugDataLoaders) as (keyof typeof drugDataLoaders)[];
  const allDrugsArrays = await Promise.all(
    allCategories.map(category => loadDrugCategory(category))
  );

  const allDrugs = allDrugsArrays.flat();

  // Remove duplicates by ID
  const uniqueDrugs = allDrugs.reduce((unique: DrugData[], drug: DrugData) => {
    if (!unique.find(existingDrug => existingDrug.id === drug.id)) {
      unique.push(drug);
    }
    return unique;
  }, []);

  allDrugsCache = uniqueDrugs;
  return uniqueDrugs;
};

// Search drugs with lazy loading
export const searchDrugs = async (query: string): Promise<DrugData[]> => {
  const allDrugs = await loadAllDrugs();
  const raw = query.toLowerCase().trim();

  if (!raw) return [];

  const searchTerm = raw.replace(/\s+/g, " ");

  const scored = allDrugs
    .map((drug) => {
      const name = (drug.name || "").toLowerCase();
      const generic = (drug.genericName || "").toLowerCase();
      const category = (drug.category || "").toLowerCase();
      const drugClass = (drug.drugClass || "").toLowerCase();
      const brands = (drug.brandNames || []).map((b) => b.toLowerCase());

      let score = 0;

      // Exact matches get highest weight
      if (name === searchTerm) score += 140;
      if (generic && generic === searchTerm) score += 135;
      if (brands.some((b) => b === searchTerm)) score += 130;

      // Starts-with matches (very strong signal for typed search)
      if (name.startsWith(searchTerm)) score += 70;
      if (generic && generic.startsWith(searchTerm)) score += 60;
      if (brands.some((b) => b.startsWith(searchTerm))) score += 60;

      // Substring matches (keep existing behavior but ranked)
      if (name.includes(searchTerm)) score += 35;
      if (generic && generic.includes(searchTerm)) score += 30;
      if (brands.some((b) => b.includes(searchTerm))) score += 30;
      if (category.includes(searchTerm)) score += 18;
      if (drugClass.includes(searchTerm)) score += 18;

      // Fuzzy distance across primary identifiers to help voice/spelling errors
      const candidates: string[] = [];
      if (name) candidates.push(name);
      if (generic) candidates.push(generic);
      candidates.push(...brands);

      if (candidates.length > 0) {
        let bestDistance = Number.MAX_SAFE_INTEGER;
        for (const text of candidates) {
          const distance = calculateLevenshteinDistance(searchTerm, text);
          if (distance < bestDistance) bestDistance = distance;
        }

        const maxLen = Math.max(searchTerm.length, 1);
        const normalized = bestDistance / maxLen; // 0 = perfect, >1 = very different

        // Only reward reasonably close fuzzy matches
        if (normalized <= 0.5) {
          // Closer terms get up to +60 extra
          const fuzzyScore = Math.max(0, 60 - normalized * 60);
          score += fuzzyScore;
        }
      }

      return { drug, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.drug);

  return scored;
};

// Helper to map drug ID prefixes to their respective category loader keys
const getCategoryById = (id: string): keyof typeof drugDataLoaders | null => {
  if (id.startsWith('ATD')) return 'addictionTreatment';
  if (id.startsWith('ADD')) return 'additional';
  if (id.startsWith('AMISC')) return 'additionalMiscellaneous';
  if (id.startsWith('ANE')) return 'anesthetic';
  if (id.startsWith('ABD')) return 'antibiotic';
  if (id.startsWith('JAD_ABX') || id.startsWith('JAD_TB')) return 'antibioticExpansion';
  if (id.startsWith('AAC')) return 'antibioticsAntimicrobialCombinations';
  if (id.startsWith('ADC')) return 'antidiabeticCombination';
  if (id.startsWith('JAD_AD')) return 'antiDiabeticExpansion';
  if (id.startsWith('AMD')) return 'antimalarial';
  if (id.startsWith('APD')) return 'antiparasitic';
  if (id.startsWith('AVD')) return 'antiviral';
  if (id.startsWith('JAD_MISSING_')) {
    const num = parseInt(id.replace('JAD_MISSING_', ''), 10);
    if (num <= 5) return 'batch3Expansion';
    if (num <= 10) return 'batch4Expansion';
  }
  if (id.startsWith('CVC')) return 'cardiovascularCombination';
  if (id.startsWith('CVD')) return 'cardiovascular';
  if (id.startsWith('CNS')) return 'centralNervous';
  if (id.startsWith('JAD_CNS')) return 'cnsExpansion';
  if (id.startsWith('COGN')) return 'cognitiveNootropic';
  if (id.startsWith('CAD')) return 'contrastAgents';
  if (id.startsWith('JAD_CVS')) return 'cvsExpansion';
  if (id.startsWith('DERM')) return 'dermatology';
  if (id.startsWith('DER')) return 'dermatological';
  if (id.startsWith('DEXP')) return 'dermatologyExpansion';
  if (id.startsWith('EMG')) return 'emergency';
  if (id.startsWith('EDD')) return 'enzymeDigestive';
  if (id.startsWith('ED')) return 'endocrine';
  if (id.startsWith('JAD_EWH')) return 'endocrineWomensHealthExpansion';
  if (id.startsWith('EWD')) return 'extraWHO';
  if (id.startsWith('FRD')) return 'fertility';
  if (id.startsWith('FEXP')) return 'finalExpansion';
  if (id.startsWith('GDH')) return 'gastroenterologyDigestiveHealth';
  if (id.startsWith('GASTRO')) return 'gastroenterology';
  if (id.startsWith('GID')) return 'gastrointestinal';
  if (id.startsWith('JAD_GAS')) return 'gastrointestinalExpansion';
  if (id.startsWith('GYN')) return 'gynecology';
  if (id.startsWith('HEMA')) return 'hematology';
  if (id.startsWith('IMM')) return 'immunology';
  if (id.startsWith('INFECT')) return 'infectiousDiseases';
  if (id.startsWith('MISCD')) return 'miscellaneous';
  if (id.startsWith('MEXP')) return 'miscellaneousExpansion';
  if (id.startsWith('MRL')) return 'muscleRelaxant';
  if (id.startsWith('NEURO')) return 'neurology';
  if (id.startsWith('JAD_NEU')) return 'neurologyPsychiatryExpansion';
  if (id.startsWith('OBS')) return 'obstetrics';
  if (id.startsWith('ONC')) return 'oncology';
  if (id.startsWith('JAD_ONC')) return 'oncologyExpansion';
  if (id.startsWith('OPHT')) return 'ophthalmology';
  if (id.startsWith('OTD')) return 'other';
  if (id.startsWith('PIC')) return 'painInflammationCombination';
  if (id.startsWith('PIM')) return 'painInflammationMusculoskeletal';
  if (id.startsWith('PMD')) return 'painManagement';
  if (id.startsWith('JAD_PR')) return 'painRheumatologyExpansion';
  if (id.startsWith('PERM')) return 'permethrinScabies';
  if (id.startsWith('RCOMB')) return 'respiratoryCombination';
  if (id.startsWith('RD')) return 'respiratory';
  if (id.startsWith('JAD_RES')) return 'respiratoryExpansion';
  if (id.startsWith('SHD')) return 'steroidHormone';
  if (id.startsWith('SUP')) return 'supplement';
  if (id.startsWith('JAD_SUP')) return 'supplementExpansion';
  if (id.startsWith('SEXP')) return 'supplementsExpansion';
  if (id.startsWith('URO')) return 'urology';
  if (id.startsWith('VAC')) return 'vaccine';
  if (id.startsWith('VNS')) return 'vitaminsNutritionalSupplements';

  return null;
};

// Get drug by ID with lazy loading (highly optimized for quick search engine indexing)
export const getDrugById = async (id: string): Promise<DrugData | null> => {
  // 1. Check if the drug is already cached in memory
  for (const drugs of drugDataCache.values()) {
    const found = drugs.find(d => d.id === id);
    if (found) return found;
  }
  if (allDrugsCache) {
    const found = allDrugsCache.find(d => d.id === id);
    if (found) return found;
  }

  // 2. Try to load only the specific category matching the ID prefix
  const category = getCategoryById(id);
  if (category) {
    try {
      const drugs = await loadDrugCategory(category);
      const found = drugs.find(d => d.id === id);
      if (found) return found;
    } catch (e) {
      console.warn(`Failed to lazy load category ${category} for ID ${id}:`, e);
    }
  }

  // 3. Fallback to loading all drugs if the mapping fails or not found
  const allDrugs = await loadAllDrugs();
  return allDrugs.find(drug => drug.id === id) || null;
};

// Get total drug count
export const getTotalDrugCount = async (): Promise<number> => {
  const allDrugs = await loadAllDrugs();
  return allDrugs.length;
};

// Get drugs by category
export const getDrugsByCategory = async (category: string): Promise<DrugData[]> => {
  const allDrugs = await loadAllDrugs();
  return allDrugs.filter(drug => drug.category === category);
};

// Clear cache (useful for testing or memory management)
export const clearDrugDataCache = (): void => {
  drugDataCache.clear();
  allDrugsCache = null;
};
