// Structured ID generation system for drugs
// Pattern: [CategoryAbbreviation][SequentialNumber]

export interface CategoryMapping {
  [key: string]: {
    abbreviation: string;
    counter: number;
  };
}

// Category abbreviation mappings with counters
// These mappings align with the actual ID prefixes used in data files
const categoryMappings: CategoryMapping = {
  // Core categories from mockDrugsData.ts (keeping ABT for backward compatibility)
  'Antibiotic': { abbreviation: 'ABT', counter: 0 },
  'ACE Inhibitor': { abbreviation: 'ACE', counter: 0 },
  'Statin': { abbreviation: 'STA', counter: 0 },
  'Biguanide': { abbreviation: 'BIG', counter: 0 },
  'NSAID': { abbreviation: 'NSA', counter: 0 },
  'Proton Pump Inhibitor': { abbreviation: 'PPI', counter: 0 },
  'Thyroid Hormone': { abbreviation: 'THY', counter: 0 },
  'Bronchodilator': { abbreviation: 'BRO', counter: 0 },
  'SSRI': { abbreviation: 'SSR', counter: 0 },
  'Thiazide Diuretic': { abbreviation: 'TDI', counter: 0 },
  
  // Data file specific mappings (matching actual prefixes used)
  'Antibiotic Drugs': { abbreviation: 'ABD', counter: 0 },  // antibioticDrugs.ts
  'Cardiovascular': { abbreviation: 'CVD', counter: 89 },    // cardiovascularDrugs.ts - updated to 89
  'Respiratory': { abbreviation: 'RD', counter: 53 },        // respiratoryDrugs.ts - updated to 53
  'Gastrointestinal': { abbreviation: 'GID', counter: 0 },  // gastrointestinalDrugs.ts
  'Endocrine': { abbreviation: 'ED', counter: 67 },          // endocrineDrugs.ts - updated to 67
  'Central Nervous System': { abbreviation: 'CNS', counter: 88 }, // centralNervousDrugs.ts - updated to 88
  'Antiviral': { abbreviation: 'AVD', counter: 0 },         // antiviralDrugs.ts
  'Antimalarial': { abbreviation: 'AMD', counter: 0 },      // antimalarialDrugs.ts
  'Supplement': { abbreviation: 'SUP', counter: 0 },        // supplementDrugs.ts
  'Other': { abbreviation: 'OTD', counter: 28 },             // otherDrugs.ts - updated to 28
  'Extra WHO': { abbreviation: 'EWD', counter: 0 },         // extraWHODrugs.ts
  'Additional': { abbreviation: 'ADD', counter: 0 },        // additionalDrugsData.ts
  'Antiparasitic': { abbreviation: 'APD', counter: 0 },     // antiparasiticDrugs.ts
  'Pain Management': { abbreviation: 'PMD', counter: 23 },   // painManagementDrugs.ts - updated to 23
  'Steroid Hormone': { abbreviation: 'SHD', counter: 0 },   // steroidHormoneDrugs.ts
  
  // New drug categories
  'Anesthetics': { abbreviation: 'ANE', counter: 0 },       // anestheticDrugs.ts
  'Dermatological': { abbreviation: 'DER', counter: 0 },    // dermatologicalDrugs.ts
  'Muscle Relaxant': { abbreviation: 'MRL', counter: 0 },   // muscleRelaxantDrugs.ts
  'Vaccines': { abbreviation: 'VAC', counter: 0 },          // vaccineDrugs.ts
  'Emergency': { abbreviation: 'EMG', counter: 0 },         // emergencyDrugs.ts
  'Oncology': { abbreviation: 'ONC', counter: 0 },          // oncologyDrugs.ts
  'Gastroenterology': { abbreviation: 'GASTRO', counter: 0 }, // gastroenterologyDrugs.ts
  'Immunology': { abbreviation: 'IMM', counter: 0 },        // immunologyDrugs.ts
  'Infectious Diseases': { abbreviation: 'INFECT', counter: 0 }, // infectiousDiseasesDrugs.ts
  'Neurology': { abbreviation: 'NEURO', counter: 0 },       // neurologyDrugs.ts
  'Hematology': { abbreviation: 'HEMA', counter: 0 },       // hematologyDrugs.ts
  'Obstetrics': { abbreviation: 'OBS', counter: 0 },        // obstetricsDrugs.ts
  'Urology': { abbreviation: 'URO', counter: 11 },           // urologyDrugs.ts - updated to 11
  'Miscellaneous': { abbreviation: 'MISCD', counter: 0 },    // miscellaneousDrugs.ts
  
  // Pain, Inflammation & Musculoskeletal
  'Pain, Inflammation & Musculoskeletal': { abbreviation: 'PIMS', counter: 50 }, // painInflammationMusculoskeletal.ts - 50 entries
  'Antibiotics & Antimicrobial Combinations': { abbreviation: 'AAC', counter: 60 }, // antibioticsAndAntimicrobialCombinations.ts - 60 entries
  
  // New comprehensive drug categories
  'Gastroenterology & Digestive Health': { abbreviation: 'GDH', counter: 60 }, // gastroenterologyDigestiveHealthDrugs.ts - 60 entries
  'Vitamins & Nutritional Supplements': { abbreviation: 'VNS', counter: 80 },   // vitaminsNutritionalSupplementsDrugs.ts - 80 entries
  
  // Additional specialized categories
  'Respiratory Combination': { abbreviation: 'RCOMB', counter: 27 },    // respiratoryCombinationDrugs.ts - 27 entries
  'Ophthalmology': { abbreviation: 'OPHT', counter: 19 },               // ophthalmologyDrugs.ts - 19 entries
  'Cognitive Enhancer': { abbreviation: 'COGN', counter: 6 },           // cognitiveNootropicDrugs.ts - 6 entries
  'Gynecology': { abbreviation: 'GYN', counter: 14 },                   // gynecologyDrugs.ts - 14 entries
  'Dermatology Expansion': { abbreviation: 'DEXP', counter: 20 },       // dermatologyExpansionDrugs.ts - 20 entries
  'Supplements Expansion': { abbreviation: 'SEXP', counter: 10 },       // supplementsExpansionDrugs.ts - 10 entries
  'Gastrointestinal Expansion': { abbreviation: 'GIEX', counter: 10 },  // gastrointestinalExpansionDrugs.ts - 10 entries
  'Permethrin Scabies': { abbreviation: 'PERM', counter: 1 },           // permethrinScabiesDrugs.ts - 1 entry
  'Additional Miscellaneous': { abbreviation: 'AMISC', counter: 20 },   // additionalMiscellaneousDrugs.ts - 20 entries
  'Final Expansion': { abbreviation: 'FEXP', counter: 20 },             // finalExpansionDrugs.ts - 20 entries
  'Miscellaneous Expansion': { abbreviation: 'MEXP', counter: 3 }       // miscellaneousExpansionDrugs.ts - 3 entries
};

/**
 * Generates a structured ID for a drug based on its category
 * @param category - The drug category
 * @returns A structured ID in the format [CategoryAbbreviation][SequentialNumber]
 */
export function generateStructuredDrugId(category: string): string {
  // Check if category exists in mappings
  if (!categoryMappings[category]) {
    // For unknown categories, create a generic abbreviation
    const genericAbbr = category
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    
    categoryMappings[category] = {
      abbreviation: genericAbbr,
      counter: 0
    };
  }

  // Increment counter for this category
  categoryMappings[category].counter += 1;
  
  // Format the sequential number with leading zeros (3 digits)
  const sequentialNumber = categoryMappings[category].counter.toString().padStart(3, '0');
  
  // Return the structured ID
  return `${categoryMappings[category].abbreviation}${sequentialNumber}`;
}

/**
 * Resets all category counters (useful for testing or reinitialization)
 */
export function resetCategoryCounters(): void {
  Object.keys(categoryMappings).forEach(category => {
    categoryMappings[category].counter = 0;
  });
}

/**
 * Gets the current counter value for a category
 * @param category - The drug category
 * @returns The current counter value
 */
export function getCategoryCounter(category: string): number {
  return categoryMappings[category]?.counter || 0;
}

/**
 * Gets all available category mappings
 * @returns The complete category mappings object
 */
export function getCategoryMappings(): CategoryMapping {
  return { ...categoryMappings };
}

/**
 * Adds or updates a category mapping
 * @param category - The category name
 * @param abbreviation - The category abbreviation
 * @param startingCounter - Optional starting counter value (default: 0)
 */
export function addCategoryMapping(category: string, abbreviation: string, startingCounter: number = 0): void {
  categoryMappings[category] = {
    abbreviation,
    counter: startingCounter
  };
}