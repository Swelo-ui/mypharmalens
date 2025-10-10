
import { DrugData } from "@/components/DrugCard";
import { DetailedDrugData as DrugDetailsInterface } from "@/components/DrugDetails";

// Define the DetailedDrugData interface to match the one from DrugDetails.tsx
export interface DetailedDrugData {
  id: string;
  name: string;
  genericName: string; 
  manufacturer: string;
  category: string;
  description: string;
  drugClass?: string;
  verified: boolean;
  prescriptionStatus: 'OTC' | 'Prescription Only' | 'Controlled';
  dosageAndAdmin: string;
  mechanism: string;
  indications: string[];
  contraindications: string[];
  warnings: string[];
  sideEffects: string[];
  interactions: string[];
  pregnancy: string;
  storage: string;
  image?: string;
  packageImage?: string;
  brandNames?: string[];
  similarDrugs?: {id: string, name: string}[];
}

// Centralized detailed drug data repository
export const detailedDrugDataRepository: Record<string, DetailedDrugData> = {
  '1': {
    id: '1',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure and heart failure',
    drugClass: 'ACE inhibitor',
    verified: true,
    prescriptionStatus: 'Prescription Only',
    dosageAndAdmin: 'Initially 10mg once daily, may be increased to 20-40mg daily. For heart failure, start with 2.5mg once daily.',
    mechanism: 'Lisinopril inhibits the angiotensin-converting enzyme (ACE) which prevents the conversion of angiotensin I to angiotensin II, a potent vasoconstrictor.',
    indications: ['Hypertension (High blood pressure)', 'Heart failure', 'Post-myocardial infarction (heart attack)', 'Diabetic nephropathy'],
    contraindications: ['History of angioedema related to previous ACE inhibitor therapy', 'Hereditary or idiopathic angioedema', 'Pregnancy (second and third trimesters)'],
    warnings: ['May cause angioedema of face, extremities, lips, tongue, glottis, and larynx', 'Anaphylactoid reactions during desensitization or dialysis', 'Excessive hypotension may occur in patients with heart failure', 'Monitor for worsening renal function'],
    sideEffects: ['Dizziness', 'Headache', 'Fatigue', 'Dry cough', 'Hyperkalemia (high potassium levels)', 'Hypotension (low blood pressure)', 'Renal impairment', 'Angioedema'],
    interactions: ['NSAIDs may reduce antihypertensive effect', 'Potassium supplements or potassium-sparing diuretics may cause hyperkalemia', 'Lithium levels may increase when used with ACE inhibitors', 'Dual blockade with ARBs or aliskiren increases adverse effects'],
    pregnancy: 'Contraindicated in pregnancy, especially second and third trimesters. Can cause injury and death to the developing fetus.',
    storage: 'Store at room temperature between 15-30°C (59-86°F). Keep container tightly closed and protect from moisture.',
    brandNames: ['Prinivil', 'Zestril'],
    similarDrugs: [
      { id: '2', name: 'Enalapril' },
      { id: '5', name: 'Losartan' }
    ]
  },
  '2': {
    id: '2',
    name: 'Enalapril',
    genericName: 'Enalapril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure and heart failure',
    drugClass: 'ACE inhibitor',
    verified: true,
    prescriptionStatus: 'Prescription Only',
    dosageAndAdmin: 'Initially 5mg once daily, may be increased to 10-40mg daily in divided doses. For heart failure, start with 2.5mg once or twice daily.',
    mechanism: 'Enalapril inhibits the angiotensin-converting enzyme (ACE) which prevents the conversion of angiotensin I to angiotensin II, a potent vasoconstrictor.',
    indications: ['Hypertension (High blood pressure)', 'Heart failure', 'Asymptomatic left ventricular dysfunction'],
    contraindications: ['History of angioedema related to previous ACE inhibitor therapy', 'Hereditary or idiopathic angioedema', 'Pregnancy (second and third trimesters)'],
    warnings: ['May cause angioedema of face, extremities, lips, tongue, glottis, and larynx', 'Anaphylactoid reactions during desensitization or dialysis', 'Excessive hypotension may occur in patients with heart failure', 'Monitor for worsening renal function'],
    sideEffects: ['Dizziness', 'Headache', 'Fatigue', 'Dry cough', 'Hyperkalemia (high potassium levels)', 'Hypotension (low blood pressure)', 'Renal impairment', 'Angioedema'],
    interactions: ['NSAIDs may reduce antihypertensive effect', 'Potassium supplements or potassium-sparing diuretics may cause hyperkalemia', 'Lithium levels may increase when used with ACE inhibitors', 'Dual blockade with ARBs or aliskiren increases adverse effects'],
    pregnancy: 'Contraindicated in pregnancy, especially second and third trimesters. Can cause injury and death to the developing fetus.',
    storage: 'Store at room temperature between 15-30°C (59-86°F). Keep container tightly closed and protect from moisture.',
    brandNames: ['Vasotec'],
    similarDrugs: [
      { id: '1', name: 'Lisinopril' },
      { id: '5', name: 'Losartan' }
    ]
  },
  '3': {
    id: '3',
    name: 'Amlodipine',
    genericName: 'Amlodipine',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure and angina',
    drugClass: 'Calcium channel blocker',
    verified: true,
    prescriptionStatus: 'Prescription Only',
    dosageAndAdmin: 'Initially 5mg once daily, may be increased to 10mg daily.',
    mechanism: 'Amlodipine inhibits the movement of calcium ions into vascular smooth muscle cells and cardiac muscle cells, leading to relaxation of coronary and vascular smooth muscle.',
    indications: ['Hypertension (High blood pressure)', 'Angina pectoris (Chest pain)', 'Coronary artery disease'],
    contraindications: ['Known hypersensitivity to dihydropyridine calcium channel blockers', 'Severe hypotension', 'Cardiogenic shock'],
    warnings: ['May cause peripheral edema', 'Monitor for hypotension', 'More likely to cause hypotension in elderly patients', 'Use caution in patients with heart failure'],
    sideEffects: ['Peripheral edema (swelling of ankles and feet)', 'Dizziness', 'Flushing', 'Headache', 'Fatigue', 'Palpitations', 'Nausea'],
    interactions: ['CYP3A4 inhibitors may increase amlodipine levels', 'CYP3A4 inducers may decrease amlodipine levels', 'May enhance the hypotensive effects of other antihypertensives'],
    pregnancy: 'Should be used during pregnancy only if the potential benefit justifies the potential risk to the fetus.',
    storage: 'Store at room temperature between 15-30°C (59-86°F). Protect from light and moisture.',
    brandNames: ['Norvasc'],
    similarDrugs: [
      { id: '4', name: 'Metoprolol' },
      { id: '5', name: 'Losartan' }
    ]
  }
};

// Function to get detailed drug data by ID (moved from mockDrugsData.ts)
export const getDetailedDrugData = (id: string, allDrugs: DrugData[]): DetailedDrugData | null => {
  // Check if we have detailed data for this ID
  if (detailedDrugDataRepository[id]) {
    return detailedDrugDataRepository[id];
  }
  
  // If not found in detailed data, try to find in combinedDrugsData and use the comprehensive data
  const basicDrugData = allDrugs.find(drug => drug.id === id);
  
  if (basicDrugData) {
    // Check if the drug data already has comprehensive information
    const hasComprehensiveData = basicDrugData.mechanism && 
                                 basicDrugData.sideEffects && 
                                 basicDrugData.interactions &&
                                 basicDrugData.indications &&
                                 basicDrugData.contraindications &&
                                 basicDrugData.warnings &&
                                 basicDrugData.pregnancy &&
                                 basicDrugData.storage &&
                                 basicDrugData.dosageAndAdmin;
    
    if (hasComprehensiveData) {
      // Use the comprehensive data directly from the drug files
      return {
        id: basicDrugData.id,
        name: basicDrugData.name,
        genericName: basicDrugData.genericName || basicDrugData.name,
        manufacturer: basicDrugData.manufacturer || 'Various',
        category: basicDrugData.category || 'Unknown',
        description: basicDrugData.description || 'No description available.',
        drugClass: basicDrugData.drugClass,
        verified: basicDrugData.verified || false,
        prescriptionStatus: basicDrugData.prescriptionStatus || 'Prescription Only',
        dosageAndAdmin: basicDrugData.dosageAndAdmin,
        mechanism: basicDrugData.mechanism,
        indications: basicDrugData.indications,
        contraindications: basicDrugData.contraindications,
        warnings: basicDrugData.warnings,
        sideEffects: basicDrugData.sideEffects,
        interactions: basicDrugData.interactions,
        pregnancy: basicDrugData.pregnancy,
        storage: basicDrugData.storage,
        brandNames: basicDrugData.brandNames || [],
        similarDrugs: []
      };
    } else {
      // Create a minimum viable DetailedDrugData object from the basic drug data
      return {
        id: basicDrugData.id,
        name: basicDrugData.name,
        genericName: basicDrugData.genericName || basicDrugData.name,
        manufacturer: basicDrugData.manufacturer || 'Various',
        category: basicDrugData.category || 'Unknown',
        description: basicDrugData.description || 'No description available.',
        drugClass: basicDrugData.drugClass,
        verified: basicDrugData.verified || false,
        prescriptionStatus: 'Prescription Only' as 'Prescription Only',
        dosageAndAdmin: 'Consult your healthcare provider for proper dosage information.',
        mechanism: 'Mechanism of action information not available.',
        indications: ['Consult your healthcare provider for information on approved uses.'],
        contraindications: ['Hypersensitivity to active ingredient or excipients.'],
        warnings: ['Always consult your healthcare provider before using this medication.'],
        sideEffects: ['Common side effects information not available.'],
        interactions: ['Information on drug interactions not available.'],
        pregnancy: 'Safety during pregnancy not established. Consult your healthcare provider.',
        storage: 'Store at room temperature away from moisture and heat.',
        brandNames: basicDrugData.brandNames || [],
        similarDrugs: []
      };
    }
  }
  
  return null;
};

// ===== VALIDATION FUNCTIONS =====

// Interface for validation results
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Interface for duplicate detection results
export interface DuplicateDetectionResult {
  duplicateIds: Array<{id: string, drugs: DrugData[], files: string[]}>;
  duplicateNames: Array<{name: string, drugs: DrugData[], files: string[]}>;
  duplicateGenericNames: Array<{genericName: string, drugs: DrugData[], files: string[]}>;
  duplicateBrandNames: Array<{brandName: string, drugs: DrugData[], files: string[]}>;
  similarEntries: Array<{drug1: DrugData, drug2: DrugData, similarity: number, reason: string}>;
}

// Levenshtein distance calculation for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate string similarity percentage
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return ((maxLength - distance) / maxLength) * 100;
}

// Normalize drug names for comparison
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Check if two drug names are similar
function areNamesSimilar(name1: string, name2: string, threshold: number = 85): boolean {
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check similarity percentage
  const similarity = calculateSimilarity(normalized1, normalized2);
  return similarity >= threshold;
}

// Validate unique IDs across all drug data
export function validateUniqueIds(allDrugs: DrugData[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const idMap = new Map<string, DrugData[]>();
  
  // Group drugs by ID
  allDrugs.forEach(drug => {
    if (!idMap.has(drug.id)) {
      idMap.set(drug.id, []);
    }
    idMap.get(drug.id)!.push(drug);
  });
  
  // Check for duplicate IDs
  idMap.forEach((drugs, id) => {
    if (drugs.length > 1) {
      const drugNames = drugs.map(d => d.name).join(', ');
      errors.push(`Duplicate ID "${id}" found for drugs: ${drugNames}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Detect duplicate drug names
export function detectDuplicateNames(allDrugs: DrugData[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nameMap = new Map<string, DrugData[]>();
  
  // Group drugs by normalized name
  allDrugs.forEach(drug => {
    const normalizedName = normalizeName(drug.name);
    if (!nameMap.has(normalizedName)) {
      nameMap.set(normalizedName, []);
    }
    nameMap.get(normalizedName)!.push(drug);
  });
  
  // Check for duplicate names
  nameMap.forEach((drugs, normalizedName) => {
    if (drugs.length > 1) {
      const uniqueNames = [...new Set(drugs.map(d => d.name))];
      const drugIds = drugs.map(d => `${d.name} (ID: ${d.id})`).join(', ');
      
      if (uniqueNames.length === 1) {
        errors.push(`Exact duplicate name "${uniqueNames[0]}" found for: ${drugIds}`);
      } else {
        warnings.push(`Similar names detected: ${drugIds}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Identify similar drug entries
export function identifySimilarEntries(allDrugs: DrugData[], similarityThreshold: number = 85): Array<{drug1: DrugData, drug2: DrugData, similarity: number, reason: string}> {
  const similarEntries: Array<{drug1: DrugData, drug2: DrugData, similarity: number, reason: string}> = [];
  
  for (let i = 0; i < allDrugs.length; i++) {
    for (let j = i + 1; j < allDrugs.length; j++) {
      const drug1 = allDrugs[i];
      const drug2 = allDrugs[j];
      
      // Skip if same drug (same ID)
      if (drug1.id === drug2.id) continue;
      
      // Check name similarity
      const nameSimilarity = calculateSimilarity(drug1.name, drug2.name);
      if (nameSimilarity >= similarityThreshold) {
        similarEntries.push({
          drug1,
          drug2,
          similarity: nameSimilarity,
          reason: `Similar names: "${drug1.name}" vs "${drug2.name}"`
        });
        continue;
      }
      
      // Check generic name similarity
      if (drug1.genericName && drug2.genericName) {
        const genericSimilarity = calculateSimilarity(drug1.genericName, drug2.genericName);
        if (genericSimilarity >= similarityThreshold) {
          similarEntries.push({
            drug1,
            drug2,
            similarity: genericSimilarity,
            reason: `Similar generic names: "${drug1.genericName}" vs "${drug2.genericName}"`
          });
          continue;
        }
      }
      
      // Check if one is a brand name of the other
      if (drug1.brandNames && drug2.name) {
        const isBrandMatch = drug1.brandNames.some(brand => 
          areNamesSimilar(brand, drug2.name, similarityThreshold)
        );
        if (isBrandMatch) {
          similarEntries.push({
            drug1,
            drug2,
            similarity: 95,
            reason: `"${drug2.name}" appears to be a brand name of "${drug1.name}"`
          });
        }
      }
      
      if (drug2.brandNames && drug1.name) {
        const isBrandMatch = drug2.brandNames.some(brand => 
          areNamesSimilar(brand, drug1.name, similarityThreshold)
        );
        if (isBrandMatch) {
          similarEntries.push({
            drug1,
            drug2,
            similarity: 95,
            reason: `"${drug1.name}" appears to be a brand name of "${drug2.name}"`
          });
        }
      }
    }
  }
  
  return similarEntries;
}

// Resolve brand name conflicts
export function resolveBrandNameConflicts(allDrugs: DrugData[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const brandNameMap = new Map<string, DrugData[]>();
  
  // Collect all brand names and their associated drugs
  allDrugs.forEach(drug => {
    if (drug.brandNames) {
      drug.brandNames.forEach(brandName => {
        const normalizedBrand = normalizeName(brandName);
        if (!brandNameMap.has(normalizedBrand)) {
          brandNameMap.set(normalizedBrand, []);
        }
        brandNameMap.get(normalizedBrand)!.push(drug);
      });
    }
  });
  
  // Check for conflicts
  brandNameMap.forEach((drugs, normalizedBrand) => {
    if (drugs.length > 1) {
      const uniqueDrugs = drugs.filter((drug, index, self) => 
        self.findIndex(d => d.id === drug.id) === index
      );
      
      if (uniqueDrugs.length > 1) {
        const drugInfo = uniqueDrugs.map(d => `${d.name} (ID: ${d.id})`).join(', ');
        errors.push(`Brand name conflict: "${normalizedBrand}" is used by multiple drugs: ${drugInfo}`);
      }
    }
  });
  
  // Check if any drug name matches another drug's brand name
  allDrugs.forEach(drug => {
    allDrugs.forEach(otherDrug => {
      if (drug.id !== otherDrug.id && otherDrug.brandNames) {
        const nameMatchesBrand = otherDrug.brandNames.some(brand => 
          areNamesSimilar(drug.name, brand, 90)
        );
        if (nameMatchesBrand) {
          warnings.push(`Drug name "${drug.name}" (ID: ${drug.id}) is similar to a brand name of "${otherDrug.name}" (ID: ${otherDrug.id})`);
        }
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Comprehensive duplicate detection
export function detectAllDuplicates(allDrugs: DrugData[], drugSources?: Map<string, string>): DuplicateDetectionResult {
  const duplicateIds: Array<{id: string, drugs: DrugData[], files: string[]}> = [];
  const duplicateNames: Array<{name: string, drugs: DrugData[], files: string[]}> = [];
  const duplicateGenericNames: Array<{genericName: string, drugs: DrugData[], files: string[]}> = [];
  const duplicateBrandNames: Array<{brandName: string, drugs: DrugData[], files: string[]}> = [];
  
  // Group by ID
  const idMap = new Map<string, DrugData[]>();
  allDrugs.forEach(drug => {
    if (!idMap.has(drug.id)) {
      idMap.set(drug.id, []);
    }
    idMap.get(drug.id)!.push(drug);
  });
  
  idMap.forEach((drugs, id) => {
    if (drugs.length > 1) {
      const files = drugSources ? [...new Set(drugs.map(d => drugSources.get(d.id) || 'unknown'))] : [];
      duplicateIds.push({ id, drugs, files });
    }
  });
  
  // Group by name
  const nameMap = new Map<string, DrugData[]>();
  allDrugs.forEach(drug => {
    const normalizedName = normalizeName(drug.name);
    if (!nameMap.has(normalizedName)) {
      nameMap.set(normalizedName, []);
    }
    nameMap.get(normalizedName)!.push(drug);
  });
  
  nameMap.forEach((drugs, name) => {
    if (drugs.length > 1) {
      const files = drugSources ? [...new Set(drugs.map(d => drugSources.get(d.id) || 'unknown'))] : [];
      duplicateNames.push({ name, drugs, files });
    }
  });
  
  // Group by generic name
  const genericNameMap = new Map<string, DrugData[]>();
  allDrugs.forEach(drug => {
    if (drug.genericName) {
      const normalizedGeneric = normalizeName(drug.genericName);
      if (!genericNameMap.has(normalizedGeneric)) {
        genericNameMap.set(normalizedGeneric, []);
      }
      genericNameMap.get(normalizedGeneric)!.push(drug);
    }
  });
  
  genericNameMap.forEach((drugs, genericName) => {
    if (drugs.length > 1) {
      const files = drugSources ? [...new Set(drugs.map(d => drugSources.get(d.id) || 'unknown'))] : [];
      duplicateGenericNames.push({ genericName, drugs, files });
    }
  });
  
  // Group by brand names
  const brandNameMap = new Map<string, DrugData[]>();
  allDrugs.forEach(drug => {
    if (drug.brandNames) {
      drug.brandNames.forEach(brandName => {
        const normalizedBrand = normalizeName(brandName);
        if (!brandNameMap.has(normalizedBrand)) {
          brandNameMap.set(normalizedBrand, []);
        }
        brandNameMap.get(normalizedBrand)!.push(drug);
      });
    }
  });
  
  brandNameMap.forEach((drugs, brandName) => {
    if (drugs.length > 1) {
      const uniqueDrugs = drugs.filter((drug, index, self) => 
        self.findIndex(d => d.id === drug.id) === index
      );
      if (uniqueDrugs.length > 1) {
        const files = drugSources ? [...new Set(uniqueDrugs.map(d => drugSources.get(d.id) || 'unknown'))] : [];
        duplicateBrandNames.push({ brandName, drugs: uniqueDrugs, files });
      }
    }
  });
  
  // Identify similar entries
  const similarEntries = identifySimilarEntries(allDrugs);
  
  return {
    duplicateIds,
    duplicateNames,
    duplicateGenericNames,
    duplicateBrandNames,
    similarEntries
  };
}

// Validate entire drug dataset
export function validateDrugDataset(allDrugs: DrugData[]): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  
  // Run all validation checks
  const idValidation = validateUniqueIds(allDrugs);
  const nameValidation = detectDuplicateNames(allDrugs);
  const brandValidation = resolveBrandNameConflicts(allDrugs);
  
  // Combine results
  allErrors.push(...idValidation.errors, ...nameValidation.errors, ...brandValidation.errors);
  allWarnings.push(...idValidation.warnings, ...nameValidation.warnings, ...brandValidation.warnings);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}
