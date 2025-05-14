
import { DrugData } from "@/components/DrugCard";
import { DetailedDrugData as DrugDetailsInterface } from "@/components/DrugDetails";
import { additionalDrugsData } from "./additionalDrugsData";
import { generateUniqueId } from "@/lib/utils";

// Define the DetailedDrugData interface
export interface DetailedDrugData {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  drugClass?: string;
  verified?: boolean;
  prescriptionStatus?: string;
  dosageAndAdmin?: string;
  mechanism?: string;
  indications?: string[];
  contraindications?: string[];
  warnings?: string[];
  sideEffects?: string[];
  interactions?: string[];
  pregnancy?: string;
  storage?: string;
  image?: string;
  packageImage?: string;
  brandNames?: string[];
  similarDrugs?: string[];
}

// Original drug data
export const mockDrugsData: DrugData[] = [
  {
    id: '1',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure and heart failure',
    drugClass: 'ACE inhibitor',
    verified: true,
    brandNames: ['Prinivil', 'Zestril']
  },
  {
    id: '2',
    name: 'Enalapril',
    genericName: 'Enalapril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure and heart failure',
    drugClass: 'ACE inhibitor',
    verified: true,
    brandNames: ['Vasotec']
  },
  {
    id: '3',
    name: 'Amlodipine',
    genericName: 'Amlodipine',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure and angina',
    drugClass: 'Calcium channel blocker',
    verified: true,
    brandNames: ['Norvasc']
  },
  {
    id: '4',
    name: 'Metoprolol',
    genericName: 'Metoprolol',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Beta-blocker used to treat high blood pressure, angina, and heart failure',
    drugClass: 'Beta Blocker',
    verified: true,
    brandNames: ['Lopressor', 'Toprol XL']
  },
  {
    id: '5',
    name: 'Losartan',
    genericName: 'Losartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin receptor blocker used to treat high blood pressure and reduce the risk of stroke',
    drugClass: 'Angiotensin Receptor Blocker',
    verified: true,
    brandNames: ['Cozaar']
  },
  {
    id: '6',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Statin used to lower cholesterol and reduce the risk of heart disease',
    drugClass: 'Statin',
    verified: true,
    brandNames: ['Lipitor']
  },
  {
    id: '7',
    name: 'Simvastatin',
    genericName: 'Simvastatin',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Statin used to lower cholesterol and reduce the risk of heart disease',
    drugClass: 'Statin',
    verified: true,
    brandNames: ['Zocor']
  },
  {
    id: '8',
    name: 'Levothyroxine',
    genericName: 'Levothyroxine',
    manufacturer: 'Various',
    category: 'Hormone Replacement',
    description: 'Thyroid hormone used to treat hypothyroidism',
    drugClass: 'Thyroid Hormone',
    verified: true,
    brandNames: ['Synthroid', 'Levoxyl']
  },
  {
    id: '9',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor used to reduce stomach acid',
    drugClass: 'Proton Pump Inhibitor',
    verified: true,
    brandNames: ['Prilosec']
  },
  {
    id: '10',
    name: 'Pantoprazole',
    genericName: 'Pantoprazole',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor used to reduce stomach acid',
    drugClass: 'Proton Pump Inhibitor',
    verified: true,
    brandNames: ['Protonix']
  },
  {
    id: '11',
    name: 'Metformin',
    genericName: 'Metformin',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Biguanide used to treat type 2 diabetes',
    drugClass: 'Biguanide',
    verified: true,
    brandNames: ['Glucophage']
  },
  {
    id: '12',
    name: 'Insulin Glargine',
    genericName: 'Insulin Glargine',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Long-acting insulin used to treat diabetes',
    drugClass: 'Insulin',
    verified: true,
    brandNames: ['Lantus', 'Toujeo']
  },
  {
    id: '13',
    name: 'Albuterol',
    genericName: 'Albuterol',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Bronchodilator used to treat asthma and COPD',
    drugClass: 'Bronchodilator',
    verified: true,
    brandNames: ['Ventolin', 'ProAir']
  },
  {
    id: '14',
    name: 'Prednisone',
    genericName: 'Prednisone',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'Corticosteroid used to treat inflammation and suppress the immune system',
    drugClass: 'Corticosteroid',
    verified: true,
    brandNames: ['Deltasone']
  },
  {
    id: '15',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Penicillin antibiotic used to treat bacterial infections',
    drugClass: 'Penicillin',
    verified: true,
    brandNames: ['Amoxil']
  },
  {
    id: '16',
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Macrolide antibiotic used to treat bacterial infections',
    drugClass: 'Macrolide',
    verified: true,
    brandNames: ['Zithromax']
  },
  {
    id: '17',
    name: 'Citalopram',
    genericName: 'Citalopram',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'SSRI antidepressant used to treat depression',
    drugClass: 'SSRI',
    verified: true,
    brandNames: ['Celexa']
  },
  {
    id: '18',
    name: 'Sertraline',
    genericName: 'Sertraline',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'SSRI antidepressant used to treat depression, OCD, and anxiety',
    drugClass: 'SSRI',
    verified: true,
    brandNames: ['Zoloft']
  },
  {
    id: '19',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain, fever, and inflammation',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Advil', 'Motrin']
  },
  {
    id: '20',
    name: 'Acetaminophen',
    genericName: 'Acetaminophen',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Analgesic and antipyretic used to treat pain and fever',
    drugClass: 'Analgesic',
    verified: true,
    brandNames: ['Tylenol']
  },
  {
    id: '21',
    name: 'Hydrocodone/Acetaminophen',
    genericName: 'Hydrocodone/Acetaminophen',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat moderate to severe pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['Vicodin', 'Norco']
  },
  {
    id: '22',
    name: 'Tramadol',
    genericName: 'Tramadol',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat moderate to severe pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['Ultram']
  },
  {
    id: '23',
    name: 'Warfarin',
    genericName: 'Warfarin',
    manufacturer: 'Various',
    category: 'Anticoagulant',
    description: 'Anticoagulant used to prevent blood clots',
    drugClass: 'Anticoagulant',
    verified: true,
    brandNames: ['Coumadin']
  },
  {
    id: '24',
    name: 'Clopidogrel',
    genericName: 'Clopidogrel',
    manufacturer: 'Various',
    category: 'Antiplatelet',
    description: 'Antiplatelet drug used to prevent blood clots',
    drugClass: 'Antiplatelet',
    verified: true,
    brandNames: ['Plavix']
  },
  {
    id: '25',
    name: 'Aspirin',
    genericName: 'Aspirin',
    manufacturer: 'Various',
    category: 'Antiplatelet',
    description: 'Antiplatelet drug used to prevent blood clots and reduce the risk of heart attack and stroke',
    drugClass: 'Antiplatelet',
    verified: true,
    brandNames: ['Bayer', 'Ecotrin']
  },
  {
    id: '26',
    name: 'Diphenhydramine',
    genericName: 'Diphenhydramine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Antihistamine used to treat allergies and insomnia',
    drugClass: 'Antihistamine',
    verified: true,
    brandNames: ['Benadryl']
  },
  {
    id: '27',
    name: 'Loratadine',
    genericName: 'Loratadine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Antihistamine used to treat allergies',
    drugClass: 'Antihistamine',
    verified: true,
    brandNames: ['Claritin']
  },
  {
    id: '28',
    name: 'Cetirizine',
    genericName: 'Cetirizine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Antihistamine used to treat allergies',
    drugClass: 'Antihistamine',
    verified: true,
    brandNames: ['Zyrtec']
  },
  {
    id: '29',
    name: 'Fluoxetine',
    genericName: 'Fluoxetine',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'SSRI antidepressant used to treat depression, OCD, and bulimia',
    drugClass: 'SSRI',
    verified: true,
    brandNames: ['Prozac']
  },
  {
    id: '30',
    name: 'Trazodone',
    genericName: 'Trazodone',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Antidepressant and sedative used to treat depression and insomnia',
    drugClass: 'Antidepressant',
    verified: true,
    brandNames: ['Desyrel']
  },
  {
    id: '31',
    name: 'Clonazepam',
    genericName: 'Clonazepam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat anxiety and seizures',
    drugClass: 'Benzodiazepine',
    verified: true,
    brandNames: ['Klonopin']
  },
  {
    id: '32',
    name: 'Alprazolam',
    genericName: 'Alprazolam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat anxiety and panic disorder',
    drugClass: 'Benzodiazepine',
    verified: true,
    brandNames: ['Xanax']
  },
  {
    id: '33',
    name: 'Zolpidem',
    genericName: 'Zolpidem',
    manufacturer: 'Various',
    category: 'Sedative',
    description: 'Sedative used to treat insomnia',
    drugClass: 'Sedative',
    verified: true,
    brandNames: ['Ambien']
  },
  {
    id: '34',
    name: 'Melatonin',
    genericName: 'Melatonin',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Hormone used to treat insomnia and jet lag',
    drugClass: 'Hormone',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '35',
    name: 'Vitamin D',
    genericName: 'Vitamin D',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin used to treat vitamin D deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '36',
    name: 'Vitamin B12',
    genericName: 'Vitamin B12',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin used to treat vitamin B12 deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '37',
    name: 'Furosemide',
    genericName: 'Furosemide',
    manufacturer: 'Various',
    category: 'Diuretic',
    description: 'Loop diuretic used to treat edema and high blood pressure',
    drugClass: 'Diuretic',
    verified: true,
    brandNames: ['Lasix']
  },
  {
    id: '38',
    name: 'Hydrochlorothiazide',
    genericName: 'Hydrochlorothiazide',
    manufacturer: 'Various',
    category: 'Diuretic',
    description: 'Thiazide diuretic used to treat edema and high blood pressure',
    drugClass: 'Diuretic',
    verified: true,
    brandNames: ['Microzide']
  },
  {
    id: '39',
    name: 'Potassium Chloride',
    genericName: 'Potassium Chloride',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Electrolyte supplement used to treat potassium deficiency',
    drugClass: 'Electrolyte',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '40',
    name: 'Calcium Carbonate',
    genericName: 'Calcium Carbonate',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat calcium deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Tums']
  },
  {
    id: '41',
    name: 'Iron Sulfate',
    genericName: 'Iron Sulfate',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat iron deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '42',
    name: 'Magnesium Oxide',
    genericName: 'Magnesium Oxide',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat magnesium deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '43',
    name: 'Cyanocobalamin',
    genericName: 'Cyanocobalamin',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat vitamin B12 deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '44',
    name: 'Cholecalciferol',
    genericName: 'Cholecalciferol',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat vitamin D deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '45',
    name: 'Ergocalciferol',
    genericName: 'Ergocalciferol',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat vitamin D deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '46',
    name: 'Folic Acid',
    genericName: 'Folic Acid',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat folic acid deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '47',
    name: 'Niacin',
    genericName: 'Niacin',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat niacin deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '48',
    name: 'Riboflavin',
    genericName: 'Riboflavin',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat riboflavin deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '49',
    name: 'Thiamine',
    genericName: 'Thiamine',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat thiamine deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '50',
    name: 'Pyridoxine',
    genericName: 'Pyridoxine',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat pyridoxine deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '51',
    name: 'Ascorbic Acid',
    genericName: 'Ascorbic Acid',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat ascorbic acid deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '52',
    name: 'Retinol',
    genericName: 'Retinol',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat retinol deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '53',
    name: 'Tocopherol',
    genericName: 'Tocopherol',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat tocopherol deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '54',
    name: 'Phytonadione',
    genericName: 'Phytonadione',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin supplement used to treat phytonadione deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '55',
    name: 'Zinc Sulfate',
    genericName: 'Zinc Sulfate',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat zinc deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '56',
    name: 'Copper Sulfate',
    genericName: 'Copper Sulfate',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat copper deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '57',
    name: 'Selenium',
    genericName: 'Selenium',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat selenium deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '58',
    name: 'Chromium',
    genericName: 'Chromium',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat chromium deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '59',
    name: 'Molybdenum',
    genericName: 'Molybdenum',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat molybdenum deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '60',
    name: 'Manganese',
    genericName: 'Manganese',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat manganese deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '61',
    name: 'Fluoride',
    genericName: 'Fluoride',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat fluoride deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '62',
    name: 'Iodide',
    genericName: 'Iodide',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat iodide deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '63',
    name: 'Omega-3 Fatty Acids',
    genericName: 'Omega-3 Fatty Acids',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Fatty acid supplement used to treat omega-3 fatty acid deficiency',
    drugClass: 'Fatty Acid',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '64',
    name: 'Coenzyme Q10',
    genericName: 'Coenzyme Q10',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Coenzyme supplement used to treat coenzyme Q10 deficiency',
    drugClass: 'Coenzyme',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '65',
    name: 'Glucosamine',
    genericName: 'Glucosamine',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Supplement used to treat osteoarthritis',
    drugClass: 'Supplement',
    verified: true,
    brandNames: ['Various']
  },
    {
    id: '66',
    name: 'Chondroitin',
    genericName: 'Chondroitin',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Supplement used to treat osteoarthritis',
    drugClass: 'Supplement',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '67',
    name: 'Meloxicam',
    genericName: 'Meloxicam',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain and inflammation',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Mobic']
  },
  {
    id: '68',
    name: 'Gabapentin',
    genericName: 'Gabapentin',
    manufacturer: 'Various',
    category: 'Neurologic',
    description: 'Anticonvulsant used to treat seizures and nerve pain',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Neurontin']
  },
  {
    id: '69',
    name: 'Pregabalin',
    genericName: 'Pregabalin',
    manufacturer: 'Various',
    category: 'Neurologic',
    description: 'Anticonvulsant used to treat seizures and nerve pain',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Lyrica']
  },
  {
    id: '70',
    name: 'Cyclobenzaprine',
    genericName: 'Cyclobenzaprine',
    manufacturer: 'Various',
    category: 'Muscle Relaxant',
    description: 'Muscle relaxant used to treat muscle spasms',
    drugClass: 'Muscle Relaxant',
    verified: true,
    brandNames: ['Flexeril']
  },
  {
    id: '71',
    name: 'Tizanidine',
    genericName: 'Tizanidine',
    manufacturer: 'Various',
    category: 'Muscle Relaxant',
    description: 'Muscle relaxant used to treat muscle spasms',
    drugClass: 'Muscle Relaxant',
    verified: true,
    brandNames: ['Zanaflex']
  },
  {
    id: '72',
    name: 'Oxycodone',
    genericName: 'Oxycodone',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat moderate to severe pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['OxyContin']
  },
  {
    id: '73',
    name: 'Morphine',
    genericName: 'Morphine',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat severe pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['MS Contin']
  },
  {
    id: '74',
    name: 'Codeine',
    genericName: 'Codeine',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat mild to moderate pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '75',
    name: 'Promethazine',
    genericName: 'Promethazine',
    manufacturer: 'Various',
    category: 'Antiemetic',
    description: 'Antiemetic used to treat nausea and vomiting',
    drugClass: 'Antiemetic',
    verified: true,
    brandNames: ['Phenergan']
  },
  {
    id: '76',
    name: 'Ondansetron',
    genericName: 'Ondansetron',
    manufacturer: 'Various',
    category: 'Antiemetic',
    description: 'Antiemetic used to treat nausea and vomiting',
    drugClass: 'Antiemetic',
    verified: true,
    brandNames: ['Zofran']
  },
  {
    id: '77',
    name: 'Loperamide',
    genericName: 'Loperamide',
    manufacturer: 'Various',
    category: 'Antidiarrheal',
    description: 'Antidiarrheal used to treat diarrhea',
    drugClass: 'Antidiarrheal',
    verified: true,
    brandNames: ['Imodium']
  },
  {
    id: '78',
    name: 'Bisacodyl',
    genericName: 'Bisacodyl',
    manufacturer: 'Various',
    category: 'Laxative',
    description: 'Laxative used to treat constipation',
    drugClass: 'Laxative',
    verified: true,
    brandNames: ['Dulcolax']
  },
  {
    id: '79',
    name: 'Docusate',
    genericName: 'Docusate',
    manufacturer: 'Various',
    category: 'Stool Softener',
    description: 'Stool softener used to treat constipation',
    drugClass: 'Stool Softener',
    verified: true,
    brandNames: ['Colace']
  },
  {
    id: '80',
    name: 'Polyethylene Glycol',
    genericName: 'Polyethylene Glycol',
    manufacturer: 'Various',
    category: 'Laxative',
    description: 'Laxative used to treat constipation',
    drugClass: 'Laxative',
    verified: true,
    brandNames: ['Miralax']
  },
  {
    id: '81',
    name: 'Ranitidine',
    genericName: 'Ranitidine',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'H2 blocker used to reduce stomach acid',
    drugClass: 'H2 Blocker',
    verified: true,
    brandNames: ['Zantac']
  },
  {
    id: '82',
    name: 'Famotidine',
    genericName: 'Famotidine',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'H2 blocker used to reduce stomach acid',
    drugClass: 'H2 Blocker',
    verified: true,
    brandNames: ['Pepcid']
  },
  {
    id: '83',
    name: 'Calcium Carbonate',
    genericName: 'Calcium Carbonate',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'Antacid used to reduce stomach acid',
    drugClass: 'Antacid',
    verified: true,
    brandNames: ['Tums']
  },
  {
    id: '84',
    name: 'Aluminum Hydroxide',
    genericName: 'Aluminum Hydroxide',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'Antacid used to reduce stomach acid',
    drugClass: 'Antacid',
    verified: true,
    brandNames: ['Amphojel']
  },
  {
    id: '85',
    name: 'Magnesium Hydroxide',
    genericName: 'Magnesium Hydroxide',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'Antacid used to reduce stomach acid',
    drugClass: 'Antacid',
    verified: true,
    brandNames: ['Milk of Magnesia']
  },
  {
    id: '86',
    name: 'Simethicone',
    genericName: 'Simethicone',
    manufacturer: 'Various',
    category: 'Antiflatulent',
    description: 'Antiflatulent used to reduce gas',
    drugClass: 'Antiflatulent',
    verified: true,
    brandNames: ['Gas-X']
  },
  {
    id: '87',
    name: 'Dimenhydrinate',
    genericName: 'Dimenhydrinate',
    manufacturer: 'Various',
    category: 'Antiemetic',
    description: 'Antiemetic used to treat motion sickness',
    drugClass: 'Antiemetic',
    verified: true,
    brandNames: ['Dramamine']
  },
  {
    id: '88',
    name: 'Meclizine',
    genericName: 'Meclizine',
    manufacturer: 'Various',
    category: 'Antiemetic',
    description: 'Antiemetic used to treat motion sickness',
    drugClass: 'Antiemetic',
    verified: true,
    brandNames: ['Bonine']
  },
  {
    id: '89',
    name: 'Scopolamine',
    genericName: 'Scopolamine',
    manufacturer: 'Various',
    category: 'Antiemetic',
    description: 'Antiemetic used to treat motion sickness',
    drugClass: 'Antiemetic',
    verified: true,
    brandNames: ['Transderm Scop']
  },
  {
    id: '90',
    name: 'Bismuth Subsalicylate',
    genericName: 'Bismuth Subsalicylate',
    manufacturer: 'Various',
    category: 'Antidiarrheal',
    description: 'Antidiarrheal used to treat diarrhea and upset stomach',
    drugClass: 'Antidiarrheal',
    verified: true,
    brandNames: ['Pepto-Bismol']
  }
];
