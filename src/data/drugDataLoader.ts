import { DrugData } from "@/components/DrugCard";
import { DetailedDrugData, getDetailedDrugData } from "./drugDataUtils";

// Cache for loaded drug categories
const drugDataCache = new Map<string, DrugData[]>();
let allDrugsCache: DrugData[] | null = null;

// Dynamic imports for drug categories
const drugCategoryLoaders = {
  cardiovascular: () => import('./cardiovascularDrugs').then(m => m.cardiovascularDrugs),
  respiratory: () => import('./respiratoryDrugs').then(m => m.respiratoryDrugs),
  gastrointestinal: () => import('./gastrointestinalDrugs').then(m => m.gastrointestinalDrugs),
  endocrine: () => import('./endocrineDrugs').then(m => m.endocrineDrugs),
  centralNervous: () => import('./centralNervousDrugs').then(m => m.centralNervousDrugs),
  antibiotic: () => import('./antibioticDrugs').then(m => m.antibioticDrugs),
  antiviral: () => import('./antiviralDrugs').then(m => m.antiviralDrugs),
  antimalarial: () => import('./antimalarialDrugs').then(m => m.antimalarialDrugs),
  supplement: () => import('./supplementDrugs').then(m => m.supplementDrugs),
  other: () => import('./otherDrugs').then(m => m.otherDrugs),
  extraWHO: () => import('./extraWHODrugs').then(m => m.extraWHODrugs),
  expanded: () => import('./expandedDrugsData').then(m => m.expandedDrugsData),
};

type DrugCategory = keyof typeof drugCategoryLoaders;

// Load a specific drug category
export const loadDrugCategory = async (category: DrugCategory): Promise<DrugData[]> => {
  if (drugDataCache.has(category)) {
    return drugDataCache.get(category)!;
  }

  try {
    const loader = drugCategoryLoaders[category];
    if (!loader) {
      console.warn(`Unknown drug category: ${category}`);
      return [];
    }

    const drugs = await loader();
    drugDataCache.set(category, drugs);
    return drugs;
  } catch (error) {
    console.error(`Failed to load drug category ${category}:`, error);
    return [];
  }
};

// Load multiple drug categories
export const loadDrugCategories = async (categories: DrugCategory[]): Promise<DrugData[]> => {
  const promises = categories.map(category => loadDrugCategory(category));
  const results = await Promise.all(promises);
  return results.flat();
};

// Load all drug data (lazy)
export const loadAllDrugs = async (): Promise<DrugData[]> => {
  if (allDrugsCache) {
    return allDrugsCache;
  }

  const allCategories = Object.keys(drugCategoryLoaders) as DrugCategory[];
  const allDrugs = await loadDrugCategories(allCategories);
  allDrugsCache = allDrugs;
  return allDrugs;
};

// Search drugs with dynamic loading
export const searchDrugsAsync = async (query: string, categories?: DrugCategory[]): Promise<DrugData[]> => {
  // Load specific categories or all drugs
  const drugsToSearch = categories 
    ? await loadDrugCategories(categories)
    : await loadAllDrugs();

  // If no query provided, return all drugs (with reasonable limit)
  if (!query || query.trim().length === 0) {
    return drugsToSearch.slice(0, 100); // Return first 100 drugs for performance
  }

  // If query is too short (less than 2 characters), return limited results
  if (query.trim().length < 2) {
    return drugsToSearch.slice(0, 20); // Return first 20 drugs for very short queries
  }

  const searchTerm = query.toLowerCase().trim();

  return drugsToSearch.filter(drug => {
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
    
    // Levenshtein distance for fuzzy matching
    const nameLower = drug.name.toLowerCase();
    const threshold = Math.min(2, Math.max(1, Math.floor(searchTerm.length / 4)));
    
    const distance = calculateLevenshteinDistance(nameLower, searchTerm);
    return distance <= threshold;
  }).slice(0, 50); // Limit to 50 results for performance
};

// Helper function to calculate Levenshtein distance
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,      // deletion
        matrix[i][j-1] + 1,      // insertion
        matrix[i-1][j-1] + cost  // substitution
      );
    }
  }
  
  return matrix[str1.length][str2.length];
}

// Get drug details with dynamic loading
export const getDrugDetailsAsync = async (id: string): Promise<DetailedDrugData | null> => {
  const allDrugs = await loadAllDrugs();
  return getDetailedDrugData(id, allDrugs);
};

// Helper functions for backward compatibility
export const getTotalDrugCountAsync = async (): Promise<number> => {
  const allDrugs = await loadAllDrugs();
  return allDrugs.length;
};

export const getDrugsByCategoryAsync = async (category: string): Promise<DrugData[]> => {
  const allDrugs = await loadAllDrugs();
  return allDrugs.filter(drug => drug.category === category);
};

export const getDrugsByClassAsync = async (drugClass: string): Promise<DrugData[]> => {
  const allDrugs = await loadAllDrugs();
  return allDrugs.filter(drug => drug.drugClass === drugClass);
};

export const getAllCategoriesAsync = async (): Promise<string[]> => {
  const allDrugs = await loadAllDrugs();
  const categoriesSet = new Set(allDrugs.map(drug => drug.category));
  return Array.from(categoriesSet).sort();
};

export const getAllDrugClassesAsync = async (): Promise<string[]> => {
  const allDrugs = await loadAllDrugs();
  const drugClassesSet = new Set(
    allDrugs
      .filter(drug => drug.drugClass)
      .map(drug => drug.drugClass as string)
  );
  return Array.from(drugClassesSet).sort();
};

// Clear cache (useful for testing or memory management)
export const clearDrugDataCache = (): void => {
  drugDataCache.clear();
  allDrugsCache = null;
};

// Preload essential drug categories for better UX
export const preloadEssentialCategories = async (): Promise<void> => {
  const essentialCategories: DrugCategory[] = ['cardiovascular', 'respiratory', 'antibiotic', 'expanded'];
  await loadDrugCategories(essentialCategories);
};