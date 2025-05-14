
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

// Combine all drug data from different categories
export const combinedDrugsData: DrugData[] = [
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

// Export the getDetailedDrugData function for use elsewhere
export { getDetailedDrugData };

// Wrap the function to include combinedDrugsData by default
export const getDrugDetails = (id: string): DetailedDrugData | null => {
  return getDetailedDrugData(id, combinedDrugsData);
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
  }).slice(0, 50); // Limit to 50 results for performance
};
