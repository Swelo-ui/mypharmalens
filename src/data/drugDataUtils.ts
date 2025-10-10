
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
