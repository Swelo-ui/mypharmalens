
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
import { expandedDrugsData } from "./expandedDrugsData";
import { comprehensiveDrugsData } from "./comprehensiveDrugsData";
import { seoOptimizedDrugsData } from "./seoOptimizedDrugsData";
import { generateDrugSEOData, generateCanonicalUrl, generateDrugSitemapEntries } from "@/utils/seoUtils";

// Combine all drug data from different categories including comprehensive dataset for better SEO coverage
// Now includes 800+ medications with SEO-optimized data for better Google rankings
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
  ...extraWHODrugs,
  ...expandedDrugsData,
  ...comprehensiveDrugsData,
  ...seoOptimizedDrugsData
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

// Advanced search function for SearchBar component with SEO optimization
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

// SEO Functions for better Google rankings

// Generate SEO data for a specific drug
export const getDrugSEOData = (drugId: string) => {
  const drug = combinedDrugsData.find(d => d.id === drugId);
  if (!drug) return null;
  return generateDrugSEOData(drug);
};

// Generate canonical URL for a drug
export const getDrugCanonicalUrl = (drugId: string): string | null => {
  const drug = combinedDrugsData.find(d => d.id === drugId);
  if (!drug) return null;
  return generateCanonicalUrl(drug.id, drug.name);
};

// Generate sitemap for all drugs (for SEO)
export const generateDrugsSitemap = (): string[] => {
  return generateDrugSitemapEntries(combinedDrugsData);
};

// Get popular drugs for homepage SEO
export const getPopularDrugs = (limit: number = 20): DrugData[] => {
  // Return verified drugs from different categories for better SEO coverage
  const popularCategories = [
    'Pain Management',
    'Cardiovascular',
    'Respiratory',
    'Dermatology',
    'Ophthalmology',
    'Antibiotics',
    'Gastrointestinal'
  ];
  
  const popularDrugs: DrugData[] = [];
  
  popularCategories.forEach(category => {
    const categoryDrugs = combinedDrugsData
      .filter(drug => drug.category === category && drug.verified)
      .slice(0, 3); // Get top 3 from each category
    popularDrugs.push(...categoryDrugs);
  });
  
  return popularDrugs.slice(0, limit);
};

// Get trending searches for SEO keywords
export const getTrendingSearchTerms = (): string[] => {
  const trendingTerms = [
    'ibuprofen',
    'acetaminophen',
    'aspirin',
    'metformin',
    'lisinopril',
    'amlodipine',
    'omeprazole',
    'simvastatin',
    'levothyroxine',
    'azithromycin',
    'amoxicillin',
    'prednisone',
    'gabapentin',
    'tramadol',
    'losartan',
    'atorvastatin',
    'sertraline',
    'metoprolol',
    'furosemide',
    'hydrochlorothiazide'
  ];
  
  return trendingTerms;
};

// Generate drug comparison data for SEO
export const getDrugComparisons = (drugId: string): DrugData[] => {
  const drug = combinedDrugsData.find(d => d.id === drugId);
  if (!drug) return [];
  
  // Find similar drugs in the same category and drug class
  return combinedDrugsData
    .filter(d => 
      d.id !== drugId && 
      (d.category === drug.category || d.drugClass === drug.drugClass)
    )
    .slice(0, 5);
};

// Get drug alternatives for SEO content
export const getDrugAlternatives = (drugId: string): DrugData[] => {
  const drug = combinedDrugsData.find(d => d.id === drugId);
  if (!drug) return [];
  
  // Find drugs with same generic name or in same drug class
  return combinedDrugsData
    .filter(d => 
      d.id !== drugId && 
      (d.genericName === drug.genericName || d.drugClass === drug.drugClass)
    )
    .slice(0, 8);
};
