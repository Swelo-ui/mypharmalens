
import { DrugData } from "@/components/DrugCard";
import { 
  DetailedDrugData, 
  getDetailedDrugData,
  validateDrugDataset,
  detectAllDuplicates,
  ValidationResult,
  DuplicateDetectionResult
} from "./drugDataUtils";
import { cardiovascularDrugs } from "./cardiovascularDrugs";
import { respiratoryDrugs } from "./respiratoryDrugs";
import { gastrointestinalDrugs } from "./gastrointestinalDrugs";
import { endocrineDrugs } from "./endocrineDrugs";
import { centralNervousDrugs } from "./centralNervousDrugs";
import { antibioticDrugs } from "./antibioticDrugs";
import { antiviralDrugs } from "./antiviralDrugs";
import { antimalarialDrugs } from "./antimalarialDrugs";
import { supplementDrugs } from "./supplementDrugs";
import { otherDrugs } from "./otherDrugs";
import { extraWHODrugs } from "./extraWHODrugs";
import { additionalDrugsData } from "./additionalDrugsData";

// Create a map to track drug sources for validation reporting
const drugSources = new Map<string, string>();

// Helper function to add drugs with source tracking
function addDrugsWithSource(drugs: DrugData[], sourceName: string): DrugData[] {
  drugs.forEach(drug => {
    drugSources.set(drug.id, sourceName);
  });
  return drugs;
}

// Combine all drug data from different categories with source tracking
const allDrugsData: DrugData[] = [
  ...addDrugsWithSource(cardiovascularDrugs, 'cardiovascularDrugs.ts'),
  ...addDrugsWithSource(respiratoryDrugs, 'respiratoryDrugs.ts'),
  ...addDrugsWithSource(gastrointestinalDrugs, 'gastrointestinalDrugs.ts'),
  ...addDrugsWithSource(endocrineDrugs, 'endocrineDrugs.ts'),
  ...addDrugsWithSource(centralNervousDrugs, 'centralNervousDrugs.ts'),
  ...addDrugsWithSource(antibioticDrugs, 'antibioticDrugs.ts'), 
  ...addDrugsWithSource(antiviralDrugs, 'antiviralDrugs.ts'),
  ...addDrugsWithSource(antimalarialDrugs, 'antimalarialDrugs.ts'),
  ...addDrugsWithSource(supplementDrugs, 'supplementDrugs.ts'),
  ...addDrugsWithSource(otherDrugs, 'otherDrugs.ts'),
  ...addDrugsWithSource(extraWHODrugs, 'extraWHODrugs.ts'),
  ...addDrugsWithSource(additionalDrugsData, 'additionalDrugsData.ts')
];

// Enhanced deduplication with validation logging for both ID and name duplicates
let duplicatesFound = 0;
let duplicateLog: Array<{id: string, kept: string, replaced: string[]}> = [];

export const combinedDrugsData: DrugData[] = allDrugsData.reduce((unique: DrugData[], drug: DrugData) => {
  // Check for ID duplicates first
  const existingIdIndex = unique.findIndex(existingDrug => existingDrug.id === drug.id);
  if (existingIdIndex !== -1) {
    // Log duplicate found
    duplicatesFound++;
    const existingDrug = unique[existingIdIndex];
    const existingSource = drugSources.get(existingDrug.id) || 'unknown';
    const currentSource = drugSources.get(drug.id) || 'unknown';
    
    // Find existing log entry or create new one
    let logEntry = duplicateLog.find(entry => entry.id === drug.id);
    if (!logEntry) {
      logEntry = {
        id: drug.id,
        kept: currentSource, // additionalDrugsData takes precedence (last in array)
        replaced: [existingSource]
      };
      duplicateLog.push(logEntry);
    } else {
      logEntry.replaced.push(existingSource);
    }
    
    // Replace with current drug (additionalDrugsData takes precedence)
    unique[existingIdIndex] = drug;
    return unique;
  }
  
  // Check for name duplicates (case-insensitive)
  const existingNameIndex = unique.findIndex(existingDrug => 
    existingDrug.name.toLowerCase().trim() === drug.name.toLowerCase().trim()
  );
  if (existingNameIndex !== -1) {
    // Log name duplicate found
    duplicatesFound++;
    const existingDrug = unique[existingNameIndex];
    const existingSource = drugSources.get(existingDrug.id) || 'unknown';
    const currentSource = drugSources.get(drug.id) || 'unknown';
    
    // Create log entry for name duplicate
    const logEntry = {
      id: `${drug.name} (ID: ${drug.id} vs ${existingDrug.id})`,
      kept: currentSource, // additionalDrugsData takes precedence (last in array)
      replaced: [existingSource]
    };
    duplicateLog.push(logEntry);
    
    // Replace with current drug (additionalDrugsData takes precedence)
    unique[existingNameIndex] = drug;
    return unique;
  }
  
  unique.push(drug);
  return unique;
}, []);

// Log deduplication results in development
if (process.env.NODE_ENV === 'development' && duplicatesFound > 0) {
  console.warn(`🔍 Drug Data Deduplication Report:`);
  console.warn(`📊 Total duplicates resolved: ${duplicatesFound}`);
  console.warn(`📋 Duplicate details:`, duplicateLog);
  console.warn(`ℹ️  Note: Later sources take precedence (additionalDrugsData.ts has highest priority)`);
}

// Export validation functions for external use
export { 
  getDetailedDrugData,
  validateDrugDataset,
  detectAllDuplicates,
  type ValidationResult,
  type DuplicateDetectionResult
};

// Wrap the function to include combinedDrugsData by default
export const getDrugDetails = (id: string): DetailedDrugData | null => {
  return getDetailedDrugData(id, combinedDrugsData);
};

// Validation functions for the combined dataset
export const validateCombinedDrugData = (): ValidationResult => {
  return validateDrugDataset(combinedDrugsData);
};

export const detectCombinedDrugDuplicates = (): DuplicateDetectionResult => {
  return detectAllDuplicates(combinedDrugsData, drugSources);
};

// Get validation report for debugging
export const getValidationReport = (): {
  totalDrugs: number;
  duplicatesResolved: number;
  duplicateLog: Array<{id: string, kept: string, replaced: string[]}>;
  validation: ValidationResult;
  duplicateDetection: DuplicateDetectionResult;
} => {
  return {
    totalDrugs: combinedDrugsData.length,
    duplicatesResolved: duplicatesFound,
    duplicateLog,
    validation: validateCombinedDrugData(),
    duplicateDetection: detectCombinedDrugDuplicates()
  };
};

// Helper function to get total drug count
export const getTotalDrugCount = (): number => {
  return combinedDrugsData.length;
};

// Helper function to get drugs by category
export const getDrugsByCategory = (category: string): DrugData[] => {
  return combinedDrugsData.filter(drug => drug.category === category);
};

// Helper function to get drugs by drug class
export const getDrugsByClass = (drugClass: string): DrugData[] => {
  return combinedDrugsData.filter(drug => drug.drugClass === drugClass);
};

// Helper function to get all available categories
export const getAllCategories = (): string[] => {
  const categoriesSet = new Set(combinedDrugsData.map(drug => drug.category));
  return Array.from(categoriesSet).sort();
};

// Helper function to get all available drug classes
export const getAllDrugClasses = (): string[] => {
  const drugClassesSet = new Set(
    combinedDrugsData
      .filter(drug => drug.drugClass) // Filter out undefined drugClass values
      .map(drug => drug.drugClass as string)
  );
  return Array.from(drugClassesSet).sort();
};

// Advanced search function for SearchBar component
export const searchDrugs = (query: string): DrugData[] => {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return combinedDrugsData.filter(drug => {
    // Direct name match
    if (drug.name.toLowerCase().includes(searchTerm)) return true;
    
    // Generic name match
    if (drug.genericName && drug.genericName.toLowerCase().includes(searchTerm)) return true;
    
    // Brand name match
    if (drug.brandNames && drug.brandNames.some(brand => brand.toLowerCase().includes(searchTerm))) return true;
    
    // Manufacturer match
    if (drug.manufacturer && drug.manufacturer.toLowerCase().includes(searchTerm)) return true;
    
    // Category match
    if (drug.category && drug.category.toLowerCase().includes(searchTerm)) return true;
    
    // Drug class match
    if (drug.drugClass && drug.drugClass.toLowerCase().includes(searchTerm)) return true;
    
    // Advanced Levenshtein distance for fuzzy matching with improved threshold
    const nameLower = drug.name.toLowerCase();
    // Adjust threshold based on search term length for more accurate fuzzy matching
    const threshold = Math.min(2, Math.max(1, Math.floor(searchTerm.length / 4)));
    
    // Calculate Levenshtein distance
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= nameLower.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= searchTerm.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= nameLower.length; i++) {
      for (let j = 1; j <= searchTerm.length; j++) {
        const cost = nameLower.charAt(i - 1) === searchTerm.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,      // deletion
          matrix[i][j-1] + 1,      // insertion
          matrix[i-1][j-1] + cost  // substitution
        );
      }
    }
    
    return matrix[nameLower.length][searchTerm.length] <= threshold;
  }); // Removed slice limit - pagination will handle performance
};
