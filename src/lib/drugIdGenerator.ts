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
  'Cardiovascular': { abbreviation: 'CVD', counter: 0 },    // cardiovascularDrugs.ts
  'Respiratory': { abbreviation: 'RD', counter: 0 },        // respiratoryDrugs.ts
  'Gastrointestinal': { abbreviation: 'GID', counter: 0 },  // gastrointestinalDrugs.ts
  'Endocrine': { abbreviation: 'ED', counter: 0 },          // endocrineDrugs.ts
  'Central Nervous System': { abbreviation: 'CNS', counter: 0 }, // centralNervousDrugs.ts
  'Antiviral': { abbreviation: 'AVD', counter: 0 },         // antiviralDrugs.ts
  'Antimalarial': { abbreviation: 'AMD', counter: 0 },      // antimalarialDrugs.ts
  'Supplement': { abbreviation: 'SUP', counter: 0 },        // supplementDrugs.ts
  'Other': { abbreviation: 'OTD', counter: 0 },             // otherDrugs.ts
  'Extra WHO': { abbreviation: 'EWD', counter: 0 },         // extraWHODrugs.ts
  'Additional': { abbreviation: 'ADD', counter: 0 },        // additionalDrugsData.ts
  'Antiparasitic': { abbreviation: 'APD', counter: 0 },     // antiparasiticDrugs.ts
  'Pain Management': { abbreviation: 'PMD', counter: 0 },   // painManagementDrugs.ts
  'Steroid Hormone': { abbreviation: 'SHD', counter: 0 },   // steroidHormoneDrugs.ts
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