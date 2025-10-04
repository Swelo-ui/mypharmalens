
import { DrugData } from "@/components/DrugCard";
import { DetailedDrugData, getDetailedDrugData } from "./drugDataUtils";
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

// Static drug data (without Indian medicines)
const staticDrugsData: DrugData[] = [
  ...cardiovascularDrugs,
  ...respiratoryDrugs,
  ...gastrointestinalDrugs,
  ...endocrineDrugs,
  ...centralNervousDrugs,
  ...antibioticDrugs, 
  ...antiviralDrugs,
  ...antimalarialDrugs,
  ...supplementDrugs,
  ...otherDrugs,
  ...extraWHODrugs
];

// Cache for combined data
let cachedCombinedData: DrugData[] | null = null;

// Async function to get all combined drug data
export const getCombinedDrugsData = async (): Promise<DrugData[]> => {
  if (cachedCombinedData === null) {
    // Dynamically import to avoid static import linting issues
    const { getIndianMedicineData } = await import("./indianMedicineData");
    const indianData = await getIndianMedicineData();
    cachedCombinedData = [...staticDrugsData, ...indianData];
  }
  return cachedCombinedData;
};

// Combine all drug data from different categories (for backward compatibility)
export const combinedDrugsData: DrugData[] = staticDrugsData;

// Export the getDetailedDrugData function for use elsewhere
export { getDetailedDrugData };

// Wrap the function to include combinedDrugsData by default
export const getDrugDetails = (id: string): DetailedDrugData | null => {
  return getDetailedDrugData(id, combinedDrugsData);
};

// Async helper functions
export const getTotalDrugCount = async (): Promise<number> => {
  const data = await getCombinedDrugsData();
  return data.length;
};

export const getDrugsByCategory = async (category: string): Promise<DrugData[]> => {
  const data = await getCombinedDrugsData();
  return data.filter(drug => drug.category === category);
};

export const getDrugsByClass = async (drugClass: string): Promise<DrugData[]> => {
  const data = await getCombinedDrugsData();
  return data.filter(drug => drug.drugClass === drugClass);
};

export const getAllCategories = async (): Promise<string[]> => {
  const data = await getCombinedDrugsData();
  const categoriesSet = new Set(data.map(drug => drug.category));
  return Array.from(categoriesSet).sort();
};

export const getAllDrugClasses = async (): Promise<string[]> => {
  const data = await getCombinedDrugsData();
  const drugClassesSet = new Set(
    data
      .filter(drug => drug.drugClass) // Filter out undefined drugClass values
      .map(drug => drug.drugClass as string)
  );
  return Array.from(drugClassesSet).sort();
};

// Synchronous helper functions (for backward compatibility, work with static data only)
export const getTotalDrugCountSync = (): number => {
  return combinedDrugsData.length;
};

export const getDrugsByCategorySync = (category: string): DrugData[] => {
  return combinedDrugsData.filter(drug => drug.category === category);
};

export const getDrugsByClassSync = (drugClass: string): DrugData[] => {
  return combinedDrugsData.filter(drug => drug.drugClass === drugClass);
};

export const getAllCategoriesSync = (): string[] => {
  const categoriesSet = new Set(combinedDrugsData.map(drug => drug.category));
  return Array.from(categoriesSet).sort();
};

export const getAllDrugClassesSync = (): string[] => {
  const drugClassesSet = new Set(
    combinedDrugsData
      .filter(drug => drug.drugClass) // Filter out undefined drugClass values
      .map(drug => drug.drugClass as string)
  );
  return Array.from(drugClassesSet).sort();
};

// Advanced search function for SearchBar component (async version)
export const searchDrugs = async (query: string): Promise<DrugData[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const searchTerm = query.toLowerCase().trim();
  const data = await getCombinedDrugsData();
  
  return data.filter(drug => {
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
    const matrix = [] as number[][];
    
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
  }).slice(0, 50); // Limit to 50 results for performance
};

// Synchronous search function (for backward compatibility, searches static data only)
export const searchDrugsSync = (query: string): DrugData[] => {
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
    
    return false;
  }).slice(0, 50); // Limit to 50 results for performance
};
