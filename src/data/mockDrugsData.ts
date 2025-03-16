import { DrugData } from "@/components/DrugCard";
import { DetailedDrugData } from "@/components/DrugDetails";

export const mockDrugsData: DrugData[] = [
  {
    id: '1',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    manufacturer: 'Generic',
    category: 'Analgesic',
    description: 'Used to treat pain and fever. It\'s often used for headaches, toothaches, and minor aches and pains.',
    drugClass: 'Non-opioid analgesic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006035601.jpg'
  },
  {
    id: '2',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'Non-steroidal anti-inflammatory drug used for relieving pain, fever, and inflammation.',
    drugClass: 'NSAID',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/167140352.jpg'
  },
  {
    id: '3',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    manufacturer: 'Generic',
    category: 'Antibiotic',
    description: 'Penicillin antibiotic used to treat bacterial infections of the ear, nose, throat, respiratory tract, urinary tract, and skin.',
    drugClass: 'Penicillin antibiotic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930111.jpg'
  },
  {
    id: '4',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure, heart failure, and to improve survival after a heart attack.',
    drugClass: 'ACE inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/311550147.jpg'
  },
  {
    id: '5',
    name: 'Loratadine',
    genericName: 'Loratadine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Antihistamine used to temporarily relieve symptoms of hay fever and other allergies.',
    drugClass: 'Second-generation antihistamine',
    verified: false,
    image: 'https://www.drugs.com/images/pills/nlm/007810258.jpg'
  },
  {
    id: '6',
    name: 'Metformin',
    genericName: 'Metformin hydrochloride',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Oral medication used to treat type 2 diabetes by improving how the body handles insulin.',
    drugClass: 'Biguanide',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930748.jpg'
  },
  {
    id: '7',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin calcium',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Used to lower cholesterol and triglycerides in the blood and reduce the risk of heart attack and stroke.',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/007810401.jpg'
  },
  {
    id: '8',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor that decreases the amount of acid produced in the stomach. Used to treat conditions like gastroesophageal reflux disease (GERD).',
    drugClass: 'Proton pump inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/550110467.jpg'
  },
  {
    id: '9',
    name: 'Amlodipine',
    genericName: 'Amlodipine besylate',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure and angina (chest pain).',
    drugClass: 'Calcium channel blocker',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/003780159.jpg'
  },
  {
    id: '10',
    name: 'Sertraline',
    genericName: 'Sertraline hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression, obsessive-compulsive disorder, panic attacks, and anxiety disorders.',
    drugClass: 'SSRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/493450068.jpg'
  },
  {
    id: '11',
    name: 'Fluoxetine',
    genericName: 'Fluoxetine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression, panic attacks, obsessive-compulsive disorder, and bulimia nervosa.',
    drugClass: 'SSRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930172.jpg'
  },
  {
    id: '12',
    name: 'Losartan',
    genericName: 'Losartan potassium',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin II receptor blocker used to treat high blood pressure and to help protect the kidneys from damage due to diabetes.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mmx/t113505f/losartan-potassium.jpg'
  },
  {
    id: '13',
    name: 'Albuterol',
    genericName: 'Albuterol sulfate',
    manufacturer: 'Various',
    category: 'Bronchodilator',
    description: 'Bronchodilator that relaxes muscles in the airways and increases air flow to the lungs. Used to treat asthma and COPD.',
    drugClass: 'Beta2-adrenergic agonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mtm/Albuterol%20Sulfate%202%20mg-MYL.jpg'
  },
  {
    id: '14',
    name: 'Levothyroxine',
    genericName: 'Levothyroxine sodium',
    manufacturer: 'Various',
    category: 'Hormone',
    description: 'Synthetic form of the thyroid hormone thyroxine used to treat hypothyroidism and to prevent goiter.',
    drugClass: 'Thyroid hormone',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/003786860.jpg'
  },
  {
    id: '15',
    name: 'Simvastatin',
    genericName: 'Simvastatin',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Used to lower cholesterol and triglycerides in the blood and reduce the risk of heart attack and stroke.',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/003786980.jpg'
  },
  {
    id: '16',
    name: 'Gabapentin',
    genericName: 'Gabapentin',
    manufacturer: 'Various',
    category: 'Anticonvulsant',
    description: 'Anticonvulsant and analgesic used to treat seizures and neuropathic pain.',
    drugClass: 'Anticonvulsant',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/180880101.jpg'
  },
  {
    id: '17',
    name: 'Hydrochlorothiazide',
    genericName: 'Hydrochlorothiazide',
    manufacturer: 'Various',
    category: 'Diuretic',
    description: 'Thiazide diuretic used to treat high blood pressure and fluid retention.',
    drugClass: 'Thiazide diuretic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/008910371.jpg'
  },
  {
    id: '18',
    name: 'Metoprolol',
    genericName: 'Metoprolol tartrate',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Beta-blocker used to treat high blood pressure, chest pain, and heart failure.',
    drugClass: 'Beta blocker',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930748.jpg'
  },
  {
    id: '19',
    name: 'Warfarin',
    genericName: 'Warfarin sodium',
    manufacturer: 'Various',
    category: 'Anticoagulant',
    description: 'Anticoagulant used to prevent blood clots from forming or growing larger.',
    drugClass: 'Vitamin K antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/551110588.jpg'
  },
  {
    id: '20',
    name: 'Prednisone',
    genericName: 'Prednisone',
    manufacturer: 'Various',
    category: 'Corticosteroid',
    description: 'Corticosteroid used to reduce inflammation and suppress the immune system.',
    drugClass: 'Corticosteroid',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/003782608.jpg'
  },
  {
    id: '21',
    name: 'Alprazolam',
    genericName: 'Alprazolam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat anxiety disorders and panic disorders.',
    drugClass: 'Benzodiazepine',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/003780032.jpg'
  },
  {
    id: '22',
    name: 'Citalopram',
    genericName: 'Citalopram hydrobromide',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression.',
    drugClass: 'SSRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/167140270.jpg'
  },
  {
    id: '23',
    name: 'Furosemide',
    genericName: 'Furosemide',
    manufacturer: 'Various',
    category: 'Diuretic',
    description: 'Loop diuretic used to treat fluid retention (edema) and high blood pressure.',
    drugClass: 'Loop diuretic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/493450085.jpg'
  },
  {
    id: '24',
    name: 'Escitalopram',
    genericName: 'Escitalopram oxalate',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression and anxiety disorders.',
    drugClass: 'SSRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/597810288.jpg'
  },
  {
    id: '25',
    name: 'Pantoprazole',
    genericName: 'Pantoprazole sodium',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor used to treat certain stomach and esophagus problems such as acid reflux.',
    drugClass: 'Proton pump inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mtm/Pantoprazole%20Sodium%2040%20mg-TEV.jpg'
  },
  {
    id: '26',
    name: 'Lipitor',
    genericName: 'Atorvastatin',
    manufacturer: 'Pfizer',
    category: 'Antilipemic',
    description: 'Brand name for atorvastatin, used to lower cholesterol and reduce the risk of heart disease.',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/594150770.jpg'
  },
  {
    id: '27',
    name: 'Norvasc',
    genericName: 'Amlodipine',
    manufacturer: 'Pfizer',
    category: 'Antihypertensive',
    description: 'Brand name for amlodipine, used to treat high blood pressure and chest pain (angina).',
    drugClass: 'Calcium channel blocker',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mtm/Amlodipine%20Besylate%205%20mg-MYL.jpg'
  },
  {
    id: '28',
    name: 'Prinivil',
    genericName: 'Lisinopril',
    manufacturer: 'Merck',
    category: 'Antihypertensive',
    description: 'Brand name for lisinopril, used to treat high blood pressure and heart failure.',
    drugClass: 'ACE inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000060111.jpg'
  },
  {
    id: '29',
    name: 'Nexium',
    genericName: 'Esomeprazole',
    manufacturer: 'AstraZeneca',
    category: 'Gastrointestinal',
    description: 'Brand name for esomeprazole, used to treat gastroesophageal reflux disease (GERD) and other conditions caused by excess stomach acid.',
    drugClass: 'Proton pump inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/001860756.jpg'
  },
  {
    id: '30',
    name: 'Zoloft',
    genericName: 'Sertraline',
    manufacturer: 'Pfizer',
    category: 'Antidepressant',
    description: 'Brand name for sertraline, used to treat depression, panic attacks, obsessive compulsive disorder, and anxiety disorders.',
    drugClass: 'SSRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000690365.jpg'
  },
  {
    id: '31',
    name: 'Prozac',
    genericName: 'Fluoxetine',
    manufacturer: 'Eli Lilly',
    category: 'Antidepressant',
    description: 'Brand name for fluoxetine, used to treat depression, panic attacks, and obsessive-compulsive disorder.',
    drugClass: 'SSRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/005190079.jpg'
  },
  {
    id: '32',
    name: 'Cozaar',
    genericName: 'Losartan',
    manufacturer: 'Merck',
    category: 'Antihypertensive',
    description: 'Brand name for losartan, used to treat high blood pressure and to help protect the kidneys from damage due to diabetes.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000060552.jpg'
  },
  {
    id: '33',
    name: 'Advair',
    genericName: 'Fluticasone/Salmeterol',
    manufacturer: 'GlaxoSmithKline',
    category: 'Respiratory',
    description: 'Combination medication containing a corticosteroid and a long-acting bronchodilator, used to treat asthma and COPD.',
    drugClass: 'Corticosteroid/Long-acting beta agonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mtm/Advair%20Diskus%20250-50-GLA.jpg'
  },
  {
    id: '34',
    name: 'Synthroid',
    genericName: 'Levothyroxine',
    manufacturer: 'AbbVie',
    category: 'Hormone',
    description: 'Brand name for levothyroxine, used to treat hypothyroidism.',
    drugClass: 'Thyroid hormone',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000741525.jpg'
  },
  {
    id: '35',
    name: 'Xanax',
    genericName: 'Alprazolam',
    manufacturer: 'Pfizer',
    category: 'Anxiolytic',
    description: 'Brand name for alprazolam, used to treat anxiety and panic disorders.',
    drugClass: 'Benzodiazepine',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000090029.jpg'
  },
  {
    id: '36',
    name: 'Celebrex',
    genericName: 'Celecoxib',
    manufacturer: 'Pfizer',
    category: 'Anti-inflammatory',
    description: 'Brand name for celecoxib, used to treat pain and inflammation caused by arthritis, ankylosing spondylitis, and menstrual cramps.',
    drugClass: 'COX-2 inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006035477.jpg'
  },
  {
    id: '37',
    name: 'Zocor',
    genericName: 'Simvastatin',
    manufacturer: 'Merck',
    category: 'Antilipemic',
    description: 'Brand name for simvastatin, used to lower cholesterol and reduce the risk of heart disease.',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006035789.jpg'
  },
  {
    id: '38',
    name: 'Lexapro',
    genericName: 'Escitalopram',
    manufacturer: 'Forest Laboratories',
    category: 'Antidepressant',
    description: 'Brand name for escitalopram, used to treat anxiety and depression.',
    drugClass: 'SSRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006035453.jpg'
  },
  {
    id: '39',
    name: 'Protonix',
    genericName: 'Pantoprazole',
    manufacturer: 'Pfizer',
    category: 'Gastrointestinal',
    description: 'Brand name for pantoprazole, used to treat erosive esophagitis and other conditions involving excess stomach acid.',
    drugClass: 'Proton pump inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000080715.jpg'
  },
  {
    id: '40',
    name: 'Zyrtec',
    genericName: 'Cetirizine',
    manufacturer: 'Johnson & Johnson',
    category: 'Antihistamine',
    description: 'Brand name for cetirizine, used to relieve allergy symptoms such as watery eyes, runny nose, itching, sneezing, and hives.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/501070177.jpg'
  }
];

export const getDetailedDrugData = (id: string): DetailedDrugData | undefined => {
  const basicDrug = mockDrugsData.find(drug => drug.id === id);
  
  if (!basicDrug) return undefined;
  
  const detailedData: Record<string, Partial<DetailedDrugData>> = {
    '1': {
      dosageAndAdmin: 'Adults and adolescents (aged 12 years and over): 500-1000 mg every 4-6 hours as needed, not exceeding 4000 mg in 24 hours.',
      sideEffects: [
        'Nausea or vomiting',
        'Headache',
        'Stomach pain',
        'Liver damage (with overdose or long-term use)',
        'Rash or allergic reactions (rare)'
      ],
      warnings: [
        'Do not exceed recommended dosage',
        'Alcohol use may increase the risk of liver damage',
        'Consult a doctor if symptoms persist for more than 10 days',
        'May cause liver damage if taken in large doses or for extended periods'
      ],
      interactions: [
        'Warfarin (may increase anticoagulant effect)',
        'Alcohol (increases risk of liver damage)',
        'Isoniazid (may increase risk of liver toxicity)'
      ],
      storage: 'Store at room temperature away from moisture and heat.',
      mechanism: 'Paracetamol works by inhibiting the synthesis of prostaglandins in the central nervous system and peripherally blocks pain impulse generation. It has antipyretic effects by acting on the hypothalamic heat-regulating center.',
      indications: [
        'Relief of mild to moderate pain',
        'Reduction of fever',
        'Treatment of headache, muscle aches, arthritis, backache, toothaches, and cold/flu symptoms'
      ],
      contraindications: [
        'Hypersensitivity to paracetamol',
        'Severe liver impairment',
        'Alcohol dependency'
      ],
      prescriptionStatus: 'OTC',
      pregnancy: 'Category B. Paracetamol crosses the placenta but is considered safe to use during pregnancy when used as directed. It is the preferred pain reliever for pregnant women.',
      verified: true
    },
    '2': {
      dosageAndAdmin: 'Adults: 200-400 mg every 4-6 hours as needed. Do not exceed 3200 mg per day.',
      sideEffects: [
        'Upset stomach, nausea, vomiting',
        'Heartburn, diarrhea, constipation',
        'Dizziness, headache',
        'Mild itching or rash',
        'Ringing in ears'
      ],
      warnings: [
        'May increase risk of heart attack or stroke',
        'Can cause stomach bleeding, especially in older adults',
        'Not recommended for use during the last trimester of pregnancy',
        'May worsen asthma symptoms in some people'
      ],
      interactions: [
        'Aspirin (increased bleeding risk)',
        'Blood thinners such as warfarin (increased bleeding risk)',
        'ACE inhibitors (reduced effectiveness)',
        'Lithium (increased lithium levels)',
        'Diuretics (reduced effectiveness)'
      ],
      storage: 'Store at room temperature away from moisture and heat.',
      mechanism: 'Ibuprofen works by inhibiting the activity of cyclooxygenase enzymes (COX-1 and COX-2), reducing the production of prostaglandins that cause inflammation, pain, and fever.',
      indications: [
        'Relief of mild to moderate pain',
        'Reduction of fever',
        'Treatment of inflammatory conditions such as arthritis',
        'Management of menstrual cramps'
      ],
      contraindications: [
        'Hypersensitivity to ibuprofen or other NSAIDs',
        'History of asthma attacks triggered by aspirin or other NSAIDs',
        'Third trimester of pregnancy',
        'Severe heart failure',
        'Active stomach/intestinal bleeding'
      ],
      prescriptionStatus: 'OTC',
      pregnancy: 'Category C (first and second trimesters). Category D (third trimester). Use during the first and second trimesters only if clearly needed. Avoid use during the third trimester as it may cause premature closure of the ductus arteriosus.',
      verified: true
    }
  };
  
  return {
    ...basicDrug,
    genericName: basicDrug.genericName || '',
    manufacturer: basicDrug.manufacturer || 'Unknown',
    category: basicDrug.category || 'Unknown',
    dosageAndAdmin: detailedData[id]?.dosageAndAdmin || 'Please consult a healthcare professional for proper dosage instructions.',
    sideEffects: detailedData[id]?.sideEffects || [
      'Consult a healthcare professional for information about possible side effects'
    ],
    warnings: detailedData[id]?.warnings || [
      'Always read the medication guide or package insert',
      'Follow the directions provided by your healthcare provider'
    ],
    interactions: detailedData[id]?.interactions || [
      'May interact with other medications'
    ],
    storage: detailedData[id]?.storage || 'Store according to package instructions.',
    mechanism: detailedData[id]?.mechanism || 'The mechanism of action for this medication may involve specific biochemical pathways.',
    indications: detailedData[id]?.indications || [
      'Consult healthcare provider for approved uses of this medication'
    ],
    contraindications: detailedData[id]?.contraindications || [
      'May not be suitable for all patients'
    ],
    prescriptionStatus: detailedData[id]?.prescriptionStatus || 'OTC',
    pregnancy: detailedData[id]?.pregnancy || 'Consult a healthcare professional before using this medication during pregnancy or breastfeeding.',
    verified: basicDrug.verified || false,
    similarDrugs: getSimilarDrugs(id)
  };
};

const getSimilarDrugs = (drugId: string): { id: string; name: string }[] => {
  const drug = mockDrugsData.find(d => d.id === drugId);
  if (!drug) return [];
  
  return mockDrugsData
    .filter(d => d.id !== drugId && (d.category === drug.category || d.drugClass === drug.drugClass))
    .slice(0, 4)
    .map(d => ({ id: d.id, name: d.name }));
};
