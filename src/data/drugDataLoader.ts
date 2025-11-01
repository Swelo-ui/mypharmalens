import { DrugData } from "@/components/DrugCard";

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

// Load all drug data (for search functionality)
export const loadAllDrugs = async (): Promise<DrugData[]> => {
  if (allDrugsCache) {
    return allDrugsCache;
  }

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
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return [];

  return allDrugs.filter(drug => {
    const nameMatch = drug.name.toLowerCase().includes(searchTerm);
    const genericMatch = drug.genericName?.toLowerCase().includes(searchTerm);
    const categoryMatch = drug.category.toLowerCase().includes(searchTerm);
    const classMatch = drug.drugClass?.toLowerCase().includes(searchTerm);
    const brandMatch = drug.brandNames?.some(brand => 
      brand.toLowerCase().includes(searchTerm)
    );

    return nameMatch || genericMatch || categoryMatch || classMatch || brandMatch;
  });
};

// Get drug by ID with lazy loading
export const getDrugById = async (id: string): Promise<DrugData | null> => {
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