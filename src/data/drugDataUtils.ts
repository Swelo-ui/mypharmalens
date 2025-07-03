
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

// Enhanced function to generate comprehensive drug details based on category and drug class
const generateDetailedDrugInfo = (drug: DrugData): Partial<DetailedDrugData> => {
  const category = drug.category?.toLowerCase() || '';
  const drugClass = drug.drugClass?.toLowerCase() || '';
  const name = drug.name;
  
  // Generate detailed information based on drug category and class
  let dosageAndAdmin = 'Consult your healthcare provider for proper dosage information.';
  let mechanism = 'Mechanism of action information not available.';
  let indications: string[] = ['Consult your healthcare provider for information on approved uses.'];
  let contraindications: string[] = ['Hypersensitivity to active ingredient or excipients.'];
  let warnings: string[] = ['Always consult your healthcare provider before using this medication.'];
  let sideEffects: string[] = ['Common side effects information not available.'];
  let interactions: string[] = ['Information on drug interactions not available.'];
  let pregnancy = 'Safety during pregnancy not established. Consult your healthcare provider.';
  let prescriptionStatus: 'OTC' | 'Prescription Only' | 'Controlled' = 'Prescription Only';
  
  // Cardiovascular drugs
  if (category.includes('antihypertensive') || category.includes('cardiac') || category.includes('cardiovascular')) {
    if (drugClass.includes('ace inhibitor')) {
      dosageAndAdmin = 'Usually started at low dose (2.5-10mg daily) and gradually increased. Take at the same time each day, with or without food.';
      mechanism = 'Inhibits angiotensin-converting enzyme (ACE), preventing conversion of angiotensin I to angiotensin II, reducing blood pressure and cardiac workload.';
      indications = ['Hypertension (high blood pressure)', 'Heart failure', 'Post-myocardial infarction', 'Diabetic nephropathy'];
      contraindications = ['History of angioedema with ACE inhibitors', 'Pregnancy (second and third trimesters)', 'Bilateral renal artery stenosis'];
      warnings = ['Monitor for angioedema', 'Check kidney function regularly', 'May cause persistent dry cough', 'Avoid potassium supplements'];
      sideEffects = ['Dry cough', 'Dizziness', 'Fatigue', 'Hyperkalemia', 'Hypotension', 'Headache'];
      interactions = ['NSAIDs may reduce effectiveness', 'Potassium supplements increase hyperkalemia risk', 'Lithium levels may increase'];
      pregnancy = 'Contraindicated in pregnancy. Can cause fetal harm and death.';
    } else if (drugClass.includes('beta blocker')) {
      dosageAndAdmin = 'Start with low dose and gradually increase. Take with food to reduce stomach upset. Do not stop suddenly.';
      mechanism = 'Blocks beta-adrenergic receptors, reducing heart rate, blood pressure, and cardiac output.';
      indications = ['Hypertension', 'Angina', 'Heart failure', 'Arrhythmias', 'Post-myocardial infarction'];
      contraindications = ['Severe bradycardia', 'Heart block', 'Cardiogenic shock', 'Severe asthma'];
      warnings = ['Do not discontinue abruptly', 'May mask signs of hypoglycemia', 'Use caution in diabetes', 'Monitor heart rate'];
      sideEffects = ['Fatigue', 'Dizziness', 'Cold hands and feet', 'Bradycardia', 'Depression', 'Sleep disturbances'];
      interactions = ['Calcium channel blockers increase cardiac depression risk', 'Insulin effects may be prolonged', 'NSAIDs may reduce antihypertensive effect'];
      pregnancy = 'Use only if benefits outweigh risks. Monitor fetal growth.';
    } else if (drugClass.includes('calcium channel blocker')) {
      dosageAndAdmin = 'Usually taken once daily. May be taken with or without food. Swallow tablets whole, do not crush.';
      mechanism = 'Blocks calcium channels in vascular smooth muscle and cardiac muscle, causing vasodilation and reduced cardiac contractility.';
      indications = ['Hypertension', 'Angina', 'Coronary artery disease', 'Certain arrhythmias'];
      contraindications = ['Severe hypotension', 'Cardiogenic shock', 'Severe aortic stenosis'];
      warnings = ['Monitor for peripheral edema', 'May cause gingival hyperplasia', 'Use caution in heart failure', 'Avoid grapefruit juice'];
      sideEffects = ['Peripheral edema', 'Dizziness', 'Flushing', 'Headache', 'Fatigue', 'Constipation'];
      interactions = ['CYP3A4 inhibitors increase levels', 'Grapefruit juice increases absorption', 'May enhance effects of other antihypertensives'];
      pregnancy = 'Use only if clearly needed. Limited human data available.';
    } else if (drugClass.includes('statin')) {
      dosageAndAdmin = 'Usually taken once daily in the evening. May be taken with or without food.';
      mechanism = 'Inhibits HMG-CoA reductase, the rate-limiting enzyme in cholesterol synthesis, reducing cholesterol production.';
      indications = ['Hypercholesterolemia', 'Prevention of cardiovascular disease', 'Familial hypercholesterolemia'];
      contraindications = ['Active liver disease', 'Pregnancy', 'Breastfeeding', 'Hypersensitivity to statins'];
      warnings = ['Monitor liver function', 'Watch for muscle pain or weakness', 'May cause rhabdomyolysis', 'Avoid excessive alcohol'];
      sideEffects = ['Muscle pain', 'Headache', 'Nausea', 'Elevated liver enzymes', 'Digestive problems'];
      interactions = ['Warfarin effects may be enhanced', 'CYP3A4 inhibitors increase statin levels', 'Fibrates increase myopathy risk'];
      pregnancy = 'Contraindicated in pregnancy. May cause fetal harm.';
    }
  }
  
  // Respiratory drugs
  else if (category.includes('respiratory') || category.includes('bronchodilator') || category.includes('asthma')) {
    if (drugClass.includes('beta2 agonist')) {
      dosageAndAdmin = 'Inhaled as needed for symptoms or regularly as prescribed. Rinse mouth after use.';
      mechanism = 'Stimulates beta2-adrenergic receptors in bronchial smooth muscle, causing bronchodilation.';
      indications = ['Asthma', 'COPD', 'Exercise-induced bronchospasm', 'Acute bronchospasm'];
      contraindications = ['Hypersensitivity to sympathomimetics', 'Severe cardiovascular disease'];
      warnings = ['May cause paradoxical bronchospasm', 'Monitor for cardiovascular effects', 'Do not exceed recommended dose'];
      sideEffects = ['Tremor', 'Nervousness', 'Headache', 'Palpitations', 'Throat irritation'];
      interactions = ['Beta-blockers may antagonize effects', 'MAO inhibitors may potentiate cardiovascular effects'];
      pregnancy = 'Generally considered safe during pregnancy when needed for asthma control.';
      prescriptionStatus = 'OTC';
    } else if (drugClass.includes('corticosteroid')) {
      dosageAndAdmin = 'Inhaled regularly as prescribed. Rinse mouth and throat after each use to prevent thrush.';
      mechanism = 'Reduces inflammation in airways by suppressing inflammatory mediators and immune responses.';
      indications = ['Asthma maintenance therapy', 'COPD', 'Allergic rhinitis', 'Inflammatory airway conditions'];
      contraindications = ['Primary treatment of status asthmaticus', 'Untreated fungal infections', 'Hypersensitivity'];
      warnings = ['May suppress immune system', 'Monitor growth in children', 'Risk of oral thrush', 'Do not stop abruptly'];
      sideEffects = ['Oral thrush', 'Hoarse voice', 'Cough', 'Headache', 'Upper respiratory infection'];
      interactions = ['CYP3A4 inhibitors may increase systemic exposure', 'Live vaccines should be avoided'];
      pregnancy = 'Use when benefits outweigh risks. Monitor fetal growth.';
    }
  }
  
  // Antibiotics
  else if (category.includes('antibiotic') || drugClass.includes('antibiotic')) {
    dosageAndAdmin = 'Take exactly as prescribed. Complete the full course even if feeling better. Take with food if stomach upset occurs.';
    mechanism = 'Inhibits bacterial growth or kills bacteria through various mechanisms depending on antibiotic class.';
    indications = ['Bacterial infections', 'Prophylaxis of bacterial infections', 'Treatment of specific bacterial pathogens'];
    contraindications = ['Known hypersensitivity to the antibiotic class', 'Previous severe allergic reactions'];
    warnings = ['Complete full course of treatment', 'May cause antibiotic-associated diarrhea', 'Monitor for allergic reactions'];
    sideEffects = ['Nausea', 'Diarrhea', 'Abdominal pain', 'Headache', 'Allergic reactions'];
    interactions = ['May affect oral contraceptive efficacy', 'Antacids may reduce absorption', 'Warfarin effects may be enhanced'];
    pregnancy = 'Use only when clearly needed. Consult healthcare provider for safety in pregnancy.';
  }
  
  // Analgesics and NSAIDs
  else if (category.includes('analgesic') || category.includes('anti-inflammatory') || drugClass.includes('nsaid')) {
    dosageAndAdmin = 'Take with food or milk to reduce stomach irritation. Use lowest effective dose for shortest duration.';
    mechanism = 'Inhibits cyclooxygenase (COX) enzymes, reducing prostaglandin synthesis and inflammation.';
    indications = ['Pain relief', 'Inflammation', 'Fever reduction', 'Arthritis', 'Musculoskeletal conditions'];
    contraindications = ['Active peptic ulcer disease', 'Severe heart failure', 'Severe kidney disease', 'Aspirin allergy'];
    warnings = ['Increased risk of cardiovascular events', 'May cause GI bleeding', 'Monitor kidney function', 'Avoid in late pregnancy'];
    sideEffects = ['Stomach upset', 'Nausea', 'Headache', 'Dizziness', 'Fluid retention', 'Elevated blood pressure'];
    interactions = ['Warfarin bleeding risk increased', 'ACE inhibitors effects reduced', 'Lithium levels may increase'];
    pregnancy = 'Avoid in third trimester. Use lowest dose if needed in first two trimesters.';
    prescriptionStatus = 'OTC';
  }
  
  // Antidiabetic drugs
  else if (category.includes('antidiabetic') || category.includes('diabetes') || drugClass.includes('antidiabetic')) {
    dosageAndAdmin = 'Take as prescribed, usually with meals. Monitor blood glucose regularly.';
    mechanism = 'Varies by drug class - may increase insulin sensitivity, stimulate insulin release, or slow glucose absorption.';
    indications = ['Type 2 diabetes mellitus', 'Glycemic control', 'Prevention of diabetic complications'];
    contraindications = ['Type 1 diabetes (for some agents)', 'Diabetic ketoacidosis', 'Severe kidney disease'];
    warnings = ['Monitor for hypoglycemia', 'Regular blood glucose monitoring required', 'May need dose adjustment with illness'];
    sideEffects = ['Hypoglycemia', 'Nausea', 'Diarrhea', 'Weight changes', 'Headache'];
    interactions = ['Beta-blockers may mask hypoglycemia', 'Corticosteroids may increase blood glucose', 'Alcohol may cause hypoglycemia'];
    pregnancy = 'Insulin is preferred for diabetes management during pregnancy.';
  }
  
  // Antiviral drugs
  else if (category.includes('antiviral') || drugClass.includes('antiviral')) {
    dosageAndAdmin = 'Take exactly as prescribed. Complete the full course of treatment even if symptoms improve.';
    mechanism = 'Interferes with viral replication processes, preventing viral spread in the body.';
    indications = ['Viral infections', 'HIV/AIDS', 'Hepatitis', 'Influenza', 'Herpes infections'];
    contraindications = ['Hypersensitivity to the medication', 'Severe liver or kidney disease (for some agents)'];
    warnings = ['Monitor liver and kidney function', 'May cause drug resistance if not taken as prescribed', 'Some antivirals require regular blood tests'];
    sideEffects = ['Nausea', 'Headache', 'Fatigue', 'Diarrhea', 'Rash', 'Sleep disturbances'];
    interactions = ['May interact with other medications metabolized by the liver', 'Some antivirals affect blood levels of other drugs', 'Certain combinations may increase toxicity'];
    pregnancy = 'Use only when benefits clearly outweigh risks. Some antivirals are contraindicated in pregnancy.';
  }
  
  // Antimalarial drugs
  else if (category.includes('antimalarial') || drugClass.includes('antimalarial')) {
    dosageAndAdmin = 'Take exactly as prescribed. May need to start before travel to malaria-endemic areas and continue after return.';
    mechanism = 'Interferes with parasite metabolism or reproduction in red blood cells.';
    indications = ['Prevention of malaria', 'Treatment of malaria', 'Some autoimmune conditions'];
    contraindications = ['Hypersensitivity to the medication', 'Certain cardiac conditions (for some agents)', 'Retinal disorders (for some agents)'];
    warnings = ['May cause psychiatric effects', 'Some require eye exams before and during treatment', 'May lower seizure threshold'];
    sideEffects = ['Nausea', 'Dizziness', 'Headache', 'Sleep disturbances', 'Visual disturbances', 'Psychiatric effects'];
    interactions = ['May interact with cardiac medications', 'Some affect blood levels of other drugs', 'May increase risk of QT prolongation with other medications'];
    pregnancy = 'Some antimalarials are safe during pregnancy, others are contraindicated. Consult healthcare provider.';
  }
  
  // Central nervous system drugs
  else if (category.includes('central nervous') || category.includes('antidepressant') || category.includes('antipsychotic') || category.includes('anxiolytic')) {
    dosageAndAdmin = 'Take exactly as prescribed. Do not stop suddenly. May take several weeks for full effect.';
    mechanism = 'Affects neurotransmitters in the brain such as serotonin, dopamine, or GABA.';
    indications = ['Depression', 'Anxiety disorders', 'Bipolar disorder', 'Schizophrenia', 'Insomnia', 'Seizure disorders'];
    contraindications = ['Hypersensitivity to the medication', 'Recent MAO inhibitor use (for some agents)', 'Uncontrolled narrow-angle glaucoma'];
    warnings = ['May increase suicidal thoughts, especially in young adults', 'Monitor for unusual behavior changes', 'May cause withdrawal if stopped abruptly', 'May impair driving ability'];
    sideEffects = ['Drowsiness', 'Dizziness', 'Dry mouth', 'Weight changes', 'Sexual dysfunction', 'Insomnia', 'Nausea'];
    interactions = ['MAO inhibitors may cause serotonin syndrome', 'May interact with other CNS depressants', 'Some affect blood levels of other drugs'];
    pregnancy = 'Use only when benefits clearly outweigh risks. Some may cause withdrawal in newborns.';
  }
  
  // Gastrointestinal drugs
  else if (category.includes('gastrointestinal') || category.includes('antiemetic') || category.includes('antacid') || category.includes('proton pump')) {
    dosageAndAdmin = 'Take as directed. Some are taken before meals, others after meals or at bedtime.';
    mechanism = 'May reduce acid production, neutralize stomach acid, increase gut motility, or affect serotonin receptors.';
    indications = ['Gastroesophageal reflux disease (GERD)', 'Peptic ulcer disease', 'Nausea and vomiting', 'Irritable bowel syndrome', 'Inflammatory bowel disease'];
    contraindications = ['Hypersensitivity to the medication', 'Certain GI conditions that may be worsened'];
    warnings = ['Long-term use of acid suppressants may increase risk of infections', 'May mask symptoms of more serious conditions', 'Some may affect nutrient absorption'];
    sideEffects = ['Headache', 'Diarrhea', 'Constipation', 'Abdominal pain', 'Nausea', 'Flatulence'];
    interactions = ['May affect absorption of other medications', 'Some affect blood levels of other drugs', 'Antacids may bind to other medications'];
    pregnancy = 'Some GI medications are safe during pregnancy, others should be avoided. Consult healthcare provider.';
    prescriptionStatus = 'OTC';
  }
  
  // Supplements and vitamins
  else if (category.includes('supplement') || category.includes('vitamin') || category.includes('mineral')) {
    dosageAndAdmin = 'Take as directed on the label or as advised by healthcare provider. May be taken with food for better absorption.';
    mechanism = 'Provides essential nutrients that may be deficient in diet or needed in higher amounts due to certain conditions.';
    indications = ['Nutritional deficiencies', 'Support for specific health conditions', 'Preventive health maintenance'];
    contraindications = ['Hypersensitivity to ingredients', 'Certain medical conditions that may be worsened by specific supplements'];
    warnings = ['Not regulated as strictly as medications', 'May interact with prescription medications', 'More is not always better - follow recommended dosages'];
    sideEffects = ['Digestive upset', 'Headache', 'Allergic reactions', 'Specific side effects vary by supplement'];
    interactions = ['May interact with prescription medications', 'Some affect blood levels of other drugs', 'May affect laboratory test results'];
    pregnancy = 'Some supplements are recommended during pregnancy, others should be avoided. Consult healthcare provider.';
    prescriptionStatus = 'OTC';
  }
  
  return {
    dosageAndAdmin,
    mechanism,
    indications,
    contraindications,
    warnings,
    sideEffects,
    interactions,
    pregnancy,
    prescriptionStatus
  };
};

// Function to get detailed drug data by ID (moved from mockDrugsData.ts)
export const getDetailedDrugData = (id: string, allDrugs: DrugData[]): DetailedDrugData | null => {
  // Check if we have detailed data for this ID
  if (detailedDrugDataRepository[id]) {
    return detailedDrugDataRepository[id];
  }
  
  // If not found in detailed data, try to find in combinedDrugsData and create a comprehensive DetailedDrugData object
  const basicDrugData = allDrugs.find(drug => drug.id === id);
  
  if (basicDrugData) {
    // Generate comprehensive details based on drug category and class
    const generatedDetails = generateDetailedDrugInfo(basicDrugData);
    
    // Create a comprehensive DetailedDrugData object from the basic drug data
    return {
      id: basicDrugData.id,
      name: basicDrugData.name,
      genericName: basicDrugData.genericName || basicDrugData.name,
      manufacturer: basicDrugData.manufacturer || 'Various',
      category: basicDrugData.category || 'Unknown',
      description: basicDrugData.description || `${basicDrugData.name} is a medication used for therapeutic purposes. Consult your healthcare provider for specific information about this medication.`,
      drugClass: basicDrugData.drugClass,
      verified: basicDrugData.verified || false,
      prescriptionStatus: generatedDetails.prescriptionStatus || 'Prescription Only',
      dosageAndAdmin: generatedDetails.dosageAndAdmin || 'Consult your healthcare provider for proper dosage information.',
      mechanism: generatedDetails.mechanism || 'Mechanism of action information not available.',
      indications: generatedDetails.indications || ['Consult your healthcare provider for information on approved uses.'],
      contraindications: generatedDetails.contraindications || ['Hypersensitivity to active ingredient or excipients.'],
      warnings: generatedDetails.warnings || ['Always consult your healthcare provider before using this medication.'],
      sideEffects: generatedDetails.sideEffects || ['Common side effects information not available.'],
      interactions: generatedDetails.interactions || ['Information on drug interactions not available.'],
      pregnancy: generatedDetails.pregnancy || 'Safety during pregnancy not established. Consult your healthcare provider.',
      storage: 'Store at room temperature away from moisture and heat.',
      brandNames: basicDrugData.brandNames || [],
      similarDrugs: []
    };
  }
  
  return null;
};

// Helper function to generate a unique ID
export function generateDrugId(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
