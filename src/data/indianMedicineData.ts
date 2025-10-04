import { DrugData } from "@/components/DrugCard";

// Interface for the raw Indian medicine data structure
interface RawIndianMedicineData {
  id: string;
  name: string;
  "price(₹)": string;
  Is_discontinued: string;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  short_composition1: string;
  short_composition2: string;
}

// Function to categorize medicines based on composition and name
const categorizeMedicine = (name: string, composition1: string, composition2: string): string => {
  const fullText = `${name} ${composition1} ${composition2}`.toLowerCase();
  
  // Cardiovascular medicines
  if (fullText.includes('amlodipine') || fullText.includes('atenolol') || fullText.includes('metoprolol') || 
      fullText.includes('lisinopril') || fullText.includes('enalapril') || fullText.includes('losartan') ||
      fullText.includes('valsartan') || fullText.includes('telmisartan') || fullText.includes('ramipril') ||
      fullText.includes('carvedilol') || fullText.includes('bisoprolol') || fullText.includes('diltiazem') ||
      fullText.includes('nifedipine') || fullText.includes('furosemide') || fullText.includes('hydrochlorothiazide')) {
    return 'Cardiovascular';
  }
  
  // Antibiotics
  if (fullText.includes('amoxicillin') || fullText.includes('azithromycin') || fullText.includes('ciprofloxacin') ||
      fullText.includes('doxycycline') || fullText.includes('cephalexin') || fullText.includes('clindamycin') ||
      fullText.includes('erythromycin') || fullText.includes('penicillin') || fullText.includes('ampicillin') ||
      fullText.includes('clavulanic') || fullText.includes('augmentin') || fullText.includes('cefixime') ||
      fullText.includes('levofloxacin') || fullText.includes('ofloxacin') || fullText.includes('norfloxacin')) {
    return 'Antibiotic';
  }
  
  // Respiratory medicines
  if (fullText.includes('salbutamol') || fullText.includes('levosalbutamol') || fullText.includes('ambroxol') ||
      fullText.includes('bromhexine') || fullText.includes('montelukast') || fullText.includes('cetirizine') ||
      fullText.includes('loratadine') || fullText.includes('fexofenadine') || fullText.includes('phenylephrine') ||
      fullText.includes('chlorpheniramine') || fullText.includes('dextromethorphan') || fullText.includes('guaifenesin') ||
      fullText.includes('terbutaline') || fullText.includes('theophylline') || fullText.includes('budesonide')) {
    return 'Respiratory';
  }
  
  // Gastrointestinal medicines
  if (fullText.includes('omeprazole') || fullText.includes('pantoprazole') || fullText.includes('ranitidine') ||
      fullText.includes('domperidone') || fullText.includes('ondansetron') || fullText.includes('metoclopramide') ||
      fullText.includes('loperamide') || fullText.includes('simethicone') || fullText.includes('lansoprazole') ||
      fullText.includes('esomeprazole') || fullText.includes('rabeprazole') || fullText.includes('famotidine') ||
      fullText.includes('sucralfate') || fullText.includes('antacid')) {
    return 'Gastrointestinal';
  }
  
  // Pain & Anti-inflammatory
  if (fullText.includes('paracetamol') || fullText.includes('acetaminophen') || fullText.includes('ibuprofen') ||
      fullText.includes('diclofenac') || fullText.includes('aspirin') || fullText.includes('naproxen') ||
      fullText.includes('celecoxib') || fullText.includes('etoricoxib') || fullText.includes('nimesulide') ||
      fullText.includes('aceclofenac') || fullText.includes('piroxicam') || fullText.includes('indomethacin') ||
      fullText.includes('ketorolac') || fullText.includes('tramadol') || fullText.includes('morphine')) {
    return 'Analgesic';
  }
  
  // Endocrine medicines
  if (fullText.includes('metformin') || fullText.includes('glimepiride') || fullText.includes('gliclazide') ||
      fullText.includes('insulin') || fullText.includes('levothyroxine') || fullText.includes('thyroxine') ||
      fullText.includes('glibenclamide') || fullText.includes('pioglitazone') || fullText.includes('sitagliptin') ||
      fullText.includes('vildagliptin') || fullText.includes('empagliflozin') || fullText.includes('dapagliflozin')) {
    return 'Endocrine';
  }
  
  // Central Nervous System
  if (fullText.includes('diazepam') || fullText.includes('lorazepam') || fullText.includes('alprazolam') ||
      fullText.includes('clonazepam') || fullText.includes('phenytoin') || fullText.includes('carbamazepine') ||
      fullText.includes('valproate') || fullText.includes('levetiracetam') || fullText.includes('gabapentin') ||
      fullText.includes('pregabalin') || fullText.includes('amitriptyline') || fullText.includes('fluoxetine') ||
      fullText.includes('sertraline') || fullText.includes('escitalopram') || fullText.includes('risperidone') ||
      fullText.includes('olanzapine') || fullText.includes('quetiapine') || fullText.includes('haloperidol')) {
    return 'Central Nervous System';
  }
  
  // Dermatological
  if (fullText.includes('cream') || fullText.includes('ointment') || fullText.includes('gel') ||
      fullText.includes('lotion') || fullText.includes('betamethasone') || fullText.includes('hydrocortisone') ||
      fullText.includes('clobetasol') || fullText.includes('mometasone') || fullText.includes('fluticasone') ||
      fullText.includes('clotrimazole') || fullText.includes('ketoconazole') || fullText.includes('terbinafine') ||
      fullText.includes('mupirocin') || fullText.includes('fusidic')) {
    return 'Dermatological';
  }
  
  // Vitamins & Supplements
  if (fullText.includes('vitamin') || fullText.includes('calcium') || fullText.includes('iron') ||
      fullText.includes('folic acid') || fullText.includes('cyanocobalamin') || fullText.includes('cholecalciferol') ||
      fullText.includes('ascorbic acid') || fullText.includes('tocopherol') || fullText.includes('biotin') ||
      fullText.includes('zinc') || fullText.includes('magnesium') || fullText.includes('multivitamin') ||
      fullText.includes('omega') || fullText.includes('protein')) {
    return 'Supplement';
  }
  
  // Default category based on type
  return 'Other';
};

// Function to extract generic name from composition
const extractGenericName = (composition1: string, composition2: string): string => {
  const comp1 = composition1.trim();
  const comp2 = composition2.trim();
  
  if (comp1 && comp2) {
    return `${comp1} + ${comp2}`;
  } else if (comp1) {
    return comp1;
  } else if (comp2) {
    return comp2;
  }
  
  return '';
};

// Function to create description from available data
const createDescription = (name: string, composition1: string, composition2: string, packSize: string): string => {
  const compositions = [composition1, composition2].filter(comp => comp && comp.trim()).join(' + ');
  
  if (compositions && packSize) {
    return `${compositions}. Available as ${packSize}.`;
  } else if (compositions) {
    return compositions;
  } else if (packSize) {
    return `Available as ${packSize}.`;
  }
  
  return `${name} - Pharmaceutical product`;
};

// Function to load and transform Indian medicine data
const loadIndianMedicineData = async (): Promise<DrugData[]> => {
  try {
    const response = await fetch('/drug-dataset/indian_medicine_data.json');
    if (!response.ok) {
      throw new Error(`Failed to load Indian medicine data: ${response.status}`);
    }
    const indianMedicineRawData: RawIndianMedicineData[] = await response.json();
    
    // Take only first 10000 records to avoid performance issues
    const limitedData = indianMedicineRawData.slice(0, 10000);
    
    return limitedData
      .filter(item => item.Is_discontinued === 'FALSE') // Only include non-discontinued medicines
      .map((item): DrugData => {
        const category = categorizeMedicine(item.name, item.short_composition1, item.short_composition2);
        const genericName = extractGenericName(item.short_composition1, item.short_composition2);
        const description = createDescription(item.name, item.short_composition1, item.short_composition2, item.pack_size_label);
        
        return {
          id: `indian_${item.id}`, // Prefix to avoid ID conflicts
          name: item.name,
          genericName: genericName || undefined,
          manufacturer: item.manufacturer_name || undefined,
          category: category,
          description: description,
          drugClass: item.type === 'allopathy' ? 'Allopathic' : item.type,
          verified: true // Mark as verified since this is from official dataset
        };
      });
  } catch (error) {
    console.error('Error loading Indian medicine data:', error);
    return [];
  }
};

// Transform raw Indian medicine data to DrugData format (legacy sync function)
export const transformIndianMedicineData = (): DrugData[] => {
  // This function is now deprecated, use loadIndianMedicineData instead
  console.warn('transformIndianMedicineData is deprecated, use loadIndianMedicineData instead');
  return [];
};

// Cache for loaded data
let cachedIndianMedicineData: DrugData[] | null = null;

// Export the async data loading function
export const getIndianMedicineData = async (): Promise<DrugData[]> => {
  if (cachedIndianMedicineData === null) {
    cachedIndianMedicineData = await loadIndianMedicineData();
  }
  return cachedIndianMedicineData;
};

// Export the transformed data (for backward compatibility)
export const indianMedicineData: DrugData[] = [];

// Export count for reference
export const getIndianMedicineCount = async (): Promise<number> => {
  const data = await getIndianMedicineData();
  return data.length;
};

// Export categories from Indian medicine data
export const getIndianMedicineCategories = async (): Promise<string[]> => {
  const data = await getIndianMedicineData();
  const categoriesSet = new Set(data.map(drug => drug.category));
  return Array.from(categoriesSet).sort();
};

// Synchronous fallback functions (return empty until data is loaded)
export const getIndianMedicineCountSync = (): number => {
  return cachedIndianMedicineData?.length || 0;
};

export const getIndianMedicineCategoriesSync = (): string[] => {
  if (!cachedIndianMedicineData) return [];
  const categoriesSet = new Set(cachedIndianMedicineData.map(drug => drug.category));
  return Array.from(categoriesSet).sort();
};