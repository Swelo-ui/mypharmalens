
import { DrugData } from "@/components/DrugCard";
import { DetailedDrugData } from "@/components/DrugDetails";
import { additionalDrugsData } from './additionalDrugsData';

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
    brandNames: ['Tylenol', 'Panadol', 'Calpol']
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
    brandNames: ['Advil', 'Motrin', 'Nurofen']
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
    brandNames: ['Amoxil', 'Trimox', 'Moxatag']
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
    brandNames: ['Prinivil', 'Zestril']
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
    brandNames: ['Claritin', 'Alavert']
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
    brandNames: ['Glucophage', 'Fortamet', 'Riomet']
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
    brandNames: ['Lipitor']
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
    brandNames: ['Prilosec', 'Prilosec OTC', 'Losec']
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
    brandNames: ['Norvasc', 'Katerzia']
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
    brandNames: ['Zoloft']
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
    brandNames: ['Prozac']
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
    brandNames: ['Cozaar']
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
    brandNames: ['Ventolin', 'ProAir']
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
    brandNames: ['Synthroid']
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
    brandNames: ['Zocor']
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
    brandNames: ['Neurontin']
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
    brandNames: ['Microzide']
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
    brandNames: ['Lopressor']
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
    brandNames: ['Coumadin']
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
    brandNames: ['Deltasone']
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
    brandNames: ['Xanax']
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
    brandNames: ['Celexa']
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
    brandNames: ['Lasix']
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
    brandNames: ['Lexapro']
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
    brandNames: ['Protonix']
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
    brandNames: ['Lipitor']
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
    brandNames: ['Norvasc']
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
    brandNames: ['Prinivil']
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
    brandNames: ['Nexium']
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
    brandNames: ['Zoloft']
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
    brandNames: ['Prozac']
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
    brandNames: ['Cozaar']
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
    brandNames: ['Advair']
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
    brandNames: ['Synthroid']
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
    brandNames: ['Xanax']
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
    brandNames: ['Celebrex']
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
    brandNames: ['Zocor']
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
    brandNames: ['Lexapro']
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
    brandNames: ['Protonix']
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
    brandNames: ['Zyrtec']
  },
  
  // Additional drugs to ensure at least 15 per category
  // Adding Essential Antibiotics
  {
    id: '41',
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Macrolide antibiotic used to treat a wide variety of bacterial infections including respiratory infections, skin infections, ear infections, and sexually transmitted diseases.',
    drugClass: 'Macrolide antibiotic',
    verified: true,
    brandNames: ['Zithromax', 'Azithral']
  },
  {
    id: '42',
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Fluoroquinolone antibiotic used to treat a variety of bacterial infections, including infections of the skin, bone, joint, respiratory tract, and urinary tract.',
    drugClass: 'Fluoroquinolone antibiotic',
    verified: true,
    brandNames: ['Cipro', 'Ciloxan']
  },
  {
    id: '43',
    name: 'Doxycycline',
    genericName: 'Doxycycline',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Tetracycline antibiotic used to treat a wide variety of bacterial infections, including respiratory tract infections, urinary tract infections, and severe acne.',
    drugClass: 'Tetracycline antibiotic',
    verified: true,
    brandNames: ['Vibramycin', 'Doryx']
  },
  {
    id: '44',
    name: 'Ceftriaxone',
    genericName: 'Ceftriaxone',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Third-generation cephalosporin antibiotic used to treat a variety of bacterial infections including meningitis, pneumonia, and gonorrhea.',
    drugClass: 'Cephalosporin antibiotic',
    verified: true,
    brandNames: ['Rocephin']
  },
  // Adding WHO Essential Medicines
  {
    id: '45',
    name: 'Insulin',
    genericName: 'Insulin',
    manufacturer: 'Various',
    category: 'Hormone',
    description: 'Hormone used to control blood sugar levels in diabetes mellitus.',
    drugClass: 'Antidiabetic',
    verified: true,
    brandNames: ['Humulin', 'Novolin']
  },
  {
    id: '46',
    name: 'Morphine',
    genericName: 'Morphine sulfate',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid medication used to treat moderate to severe pain.',
    drugClass: 'Opioid analgesic',
    verified: true,
    brandNames: ['MS Contin', 'Oramorph']
  },
  {
    id: '47',
    name: 'Aspirin',
    genericName: 'Acetylsalicylic acid',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Medication used to treat pain, fever, or inflammation.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Bayer', 'Ecotrin']
  },
  {
    id: '48',
    name: 'Methotrexate',
    genericName: 'Methotrexate',
    manufacturer: 'Various',
    category: 'Antineoplastic',
    description: 'Antimetabolite used to treat certain types of cancer and autoimmune diseases.',
    drugClass: 'Antimetabolite',
    verified: true,
    brandNames: ['Trexall', 'Rheumatrex']
  },
  {
    id: '49',
    name: 'Diazepam',
    genericName: 'Diazepam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat anxiety, alcohol withdrawal, and seizures.',
    drugClass: 'Benzodiazepine',
    verified: true,
    brandNames: ['Valium']
  },
  {
    id: '50',
    name: 'Phenytoin',
    genericName: 'Phenytoin',
    manufacturer: 'Various',
    category: 'Anticonvulsant',
    description: 'Anticonvulsant used to control seizures.',
    drugClass: 'Hydantoin anticonvulsant',
    verified: true,
    brandNames: ['Dilantin']
  },
  {
    id: '51',
    name: 'Valproic Acid',
    genericName: 'Valproic acid',
    manufacturer: 'Various',
    category: 'Anticonvulsant',
    description: 'Medication used to treat epilepsy and bipolar disorder.',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Depakote']
  },
  {
    id: '52',
    name: 'Digoxin',
    genericName: 'Digoxin',
    manufacturer: 'Various',
    category: 'Cardiac glycoside',
    description: 'Cardiac glycoside used to treat various heart conditions.',
    drugClass: 'Cardiac glycoside',
    verified: true,
    brandNames: ['Lanoxin']
  },
  {
    id: '53',
    name: 'Isoniazid',
    genericName: 'Isoniazid',
    manufacturer: 'Various',
    category: 'Antimycobacterial',
    description: 'Medication used for the treatment of tuberculosis.',
    drugClass: 'Antimycobacterial',
    verified: true,
    brandNames: ['INH']
  },
  {
    id: '54',
    name: 'Rifampicin',
    genericName: 'Rifampicin',
    manufacturer: 'Various',
    category: 'Antimycobacterial',
    description: 'Antibiotic used to treat several types of bacterial infections, particularly tuberculosis.',
    drugClass: 'Rifamycin antibiotic',
    verified: true,
    brandNames: ['Rifadin']
  },
  {
    id: '55',
    name: 'Ethambutol',
    genericName: 'Ethambutol',
    manufacturer: 'Various',
    category: 'Antimycobacterial',
    description: 'Medication used to treat tuberculosis.',
    drugClass: 'Antimycobacterial',
    verified: true,
    brandNames: ['Myambutol']
  },
  {
    id: '56',
    name: 'Chloramphenicol',
    genericName: 'Chloramphenicol',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Broad-spectrum antibiotic used to treat serious infections.',
    drugClass: 'Amphenicol antibiotic',
    verified: true,
    brandNames: ['Chloromycetin']
  },
  {
    id: '57',
    name: 'Gentamicin',
    genericName: 'Gentamicin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Aminoglycoside antibiotic used to treat many bacterial infections.',
    drugClass: 'Aminoglycoside antibiotic',
    verified: true,
    brandNames: ['Garamycin']
  },
  {
    id: '58',
    name: 'Mebendazole',
    genericName: 'Mebendazole',
    manufacturer: 'Various',
    category: 'Anthelmintic',
    description: 'Medication used to treat parasitic worm infestations.',
    drugClass: 'Anthelmintic',
    verified: true,
    brandNames: ['Vermox']
  },
  {
    id: '59',
    name: 'Albendazole',
    genericName: 'Albendazole',
    manufacturer: 'Various',
    category: 'Anthelmintic',
    description: 'Medication used to treat parasitic worm infestations.',
    drugClass: 'Anthelmintic',
    verified: true,
    brandNames: ['Albenza']
  },
  {
    id: '60',
    name: 'Chloroquine',
    genericName: 'Chloroquine phosphate',
    manufacturer: 'Various',
    category: 'Antimalarial',
    description: 'Medication used primarily to prevent and treat malaria.',
    drugClass: 'Antimalarial',
    verified: true,
    brandNames: ['Aralen']
  },
  {
    id: '61',
    name: 'Artemether',
    genericName: 'Artemether',
    manufacturer: 'Various',
    category: 'Antimalarial',
    description: 'Medication used to treat malaria.',
    drugClass: 'Antimalarial',
    verified: true,
    brandNames: ['Coartem']
  },
  {
    id: '62',
    name: 'Acyclovir',
    genericName: 'Acyclovir',
    manufacturer: 'Various',
    category: 'Antiviral',
    description: 'Antiviral medication used to treat herpes simplex virus infections.',
    drugClass: 'Antiviral',
    verified: true,
    brandNames: ['Zovirax']
  },
  {
    id: '63',
    name: 'Zidovudine',
    genericName: 'Zidovudine',
    manufacturer: 'Various',
    category: 'Antiviral',
    description: 'Antiretroviral medication used to prevent and treat HIV/AIDS.',
    drugClass: 'Nucleoside reverse transcriptase inhibitor',
    verified: true,
    brandNames: ['Retrovir']
  },
  {
    id: '64',
    name: 'Lamivudine',
    genericName: 'Lamivudine',
    manufacturer: 'Various',
    category: 'Antiviral',
    description: 'Antiviral medication used to treat HIV/AIDS and hepatitis B virus infections.',
    drugClass: 'Nucleoside reverse transcriptase inhibitor',
    verified: true,
    brandNames: ['Epivir']
  },
  {
    id: '65',
    name: 'Nevirapine',
    genericName: 'Nevirapine',
    manufacturer: 'Various',
    category: 'Antiviral',
    description: 'Antiretroviral medication used to treat and prevent HIV/AIDS.',
    drugClass: 'Non-nucleoside reverse transcriptase inhibitor',
    verified: true,
    brandNames: ['Viramune']
  },
  {
    id: '66',
    name: 'Misoprostol',
    genericName: 'Misoprostol',
    manufacturer: 'Various',
    category: 'Prostaglandin',
    description: 'Medication used to prevent and treat stomach ulcers, induce labor, cause an abortion, and treat postpartum bleeding.',
    drugClass: 'Prostaglandin',
    verified: true,
    brandNames: ['Cytotec']
  },
  {
    id: '67',
    name: 'Oxytocin',
    genericName: 'Oxytocin',
    manufacturer: 'Various',
    category: 'Hormone',
    description: 'Medication and hormone that causes contraction of the uterus and is used to induce labor, control bleeding after delivery, and help with abortion.',
    drugClass: 'Hormone',
    verified: true,
    brandNames: ['Pitocin']
  },
  {
    id: '68',
    name: 'Magnesium Sulfate',
    genericName: 'Magnesium sulfate',
    manufacturer: 'Various',
    category: 'Mineral supplement',
    description: 'Medication used to treat and prevent low blood magnesium and seizures in women with eclampsia.',
    drugClass: 'Mineral supplement',
    verified: true,
    brandNames: ['Epsom Salt']
  },
  {
    id: '69',
    name: 'Folic Acid',
    genericName: 'Folic acid',
    manufacturer: 'Various',
    category: 'Vitamin',
    description: 'Form of vitamin B used to treat folate deficiency and prevent neural tube defects during pregnancy.',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Folacin']
  },
  {
    id: '70',
    name: 'Iron Supplements',
    genericName: 'Ferrous sulfate',
    manufacturer: 'Various',
    category: 'Mineral supplement',
    description: 'Dietary supplement used to treat or prevent low blood iron and iron deficiency anemia.',
    drugClass: 'Mineral supplement',
    verified: true,
    brandNames: ['Feosol']
  },
  {
    id: '71',
    name: 'Calcium Supplements',
    genericName: 'Calcium carbonate',
    manufacturer: 'Various',
    category: 'Mineral supplement',
    description: 'Dietary supplement used to prevent or treat low blood calcium levels.',
    drugClass: 'Mineral supplement',
    verified: true,
    brandNames: ['Tums']
  },
  {
    id: '72',
    name: 'Zinc Supplements',
    genericName: 'Zinc sulfate',
    manufacturer: 'Various',
    category: 'Mineral supplement',
    description: 'Dietary supplement used to prevent or treat zinc deficiency.',
    drugClass: 'Mineral supplement',
    verified: true,
    brandNames: ['Orazinc']
  },
  {
    id: '73',
    name: 'Vitamin A',
    genericName: 'Vitamin A',
    manufacturer: 'Various',
    category: 'Vitamin',
    description: 'Dietary supplement used to prevent and treat vitamin A deficiency.',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Aquasol A']
  },
  {
    id: '74',
    name: 'Vitamin D',
    genericName: 'Cholecalciferol',
    manufacturer: 'Various',
    category: 'Vitamin',
    description: 'Dietary supplement used to prevent and treat vitamin D deficiency.',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Drisdol']
  },
  {
    id: '75',
    name: 'Oral Rehydration Salts',
    genericName: 'Multiple electrolytes',
    manufacturer: 'Various',
    category: 'Electrolyte replacement',
    description: 'Oral electrolyte mixture used for the treatment of dehydration.',
    drugClass: 'Electrolyte replacement',
    verified: true,
    brandNames: ['Pedialyte']
  },
  {
    id: '76',
    name: 'Acetazolamide',
    genericName: 'Acetazolamide',
    manufacturer: 'Various',
    category: 'Diuretic',
    description: 'Medication used to treat glaucoma, epilepsy, altitude sickness, and heart failure.',
    drugClass: 'Carbonic anhydrase inhibitor',
    verified: true,
    brandNames: ['Diamox']
  },
  {
    id: '77',
    name: 'Spironolactone',
    genericName: 'Spironolactone',
    manufacturer: 'Various',
    category: 'Diuretic',
    description: 'Medication used to treat heart failure, high blood pressure, edema, and low blood potassium levels.',
    drugClass: 'Potassium-sparing diuretic',
    verified: true,
    brandNames: ['Aldactone']
  },
  {
    id: '78',
    name: 'Salbutamol',
    genericName: 'Salbutamol',
    manufacturer: 'Various',
    category: 'Bronchodilator',
    description: 'Medication used to treat asthma, bronchitis, and COPD.',
    drugClass: 'Beta2-adrenergic agonist',
    verified: true,
    brandNames: ['Ventolin']
  },
  {
    id: '79',
    name: 'Beclomethasone',
    genericName: 'Beclomethasone dipropionate',
    manufacturer: 'Various',
    category: 'Corticosteroid',
    description: 'Corticosteroid used to treat asthma, allergic rhinitis, and other respiratory conditions.',
    drugClass: 'Corticosteroid',
    verified: true,
    brandNames: ['Qvar']
  },
  {
    id: '80',
    name: 'Budesonide',
    genericName: 'Budesonide',
    manufacturer: 'Various',
    category: 'Corticosteroid',
    description: 'Corticosteroid used to treat asthma, allergic rhinitis, and inflammatory bowel disease.',
    drugClass: 'Corticosteroid',
    verified: true,
    brandNames: ['Pulmicort']
  },
  {
    id: '81',
    name: 'Timolol',
    genericName: 'Timolol maleate',
    manufacturer: 'Various',
    category: 'Beta blocker',
    description: 'Medication used to treat open-angle glaucoma and high blood pressure.',
    drugClass: 'Beta blocker',
    verified: true,
    brandNames: ['Blocadren']
  },
  {
    id: '82',
    name: 'Carbamazepine',
    genericName: 'Carbamazepine',
    manufacturer: 'Various',
    category: 'Anticonvulsant',
    description: 'Medication used to treat epilepsy, trigeminal neuralgia, and bipolar disorder.',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Tegretol', 'Carbatrol', 'Epitol']
  }
];

// Combine mock drugs data with additional drugs data
export const combinedDrugsData = [...mockDrugsData, ...additionalDrugsData];

// Function to get detailed drug data by ID
export const getDetailedDrugData = (id: string): DetailedDrugData | null => {
  // First check in mockDrugsData
  const drugFromMock = mockDrugsData.find(drug => drug.id === id);
  
  // If not found, check in additionalDrugsData
  const drugFromAdditional = !drugFromMock ? additionalDrugsData.find(drug => drug.id === id) : null;
  
  // Get the base drug data from either source
  const baseDrug = drugFromMock || drugFromAdditional;
  
  if (!baseDrug) {
    return null;
  }
  
  // Create detailed drug data by adding additional fields needed for the detailed view
  const detailedDrug: DetailedDrugData = {
    ...baseDrug,
    prescriptionStatus: Math.random() > 0.3 ? 'Prescription Only' : 'Over-the-Counter',
    dosageAndAdmin: `Adults: Initially ${Math.floor(Math.random() * 500)}mg daily. May be increased based on response. Children: Dosage must be determined by a physician.`,
    mechanism: `${baseDrug.name} works by ${baseDrug.drugClass === 'NSAID' ? 'inhibiting prostaglandin synthesis' : 'specific biological interactions related to its drug class'} to produce its therapeutic effects.`,
    sideEffects: [
      'Nausea or vomiting',
      'Headache',
      'Dizziness',
      'Fatigue',
      baseDrug.category === 'Antibiotic' ? 'Diarrhea' : 'Insomnia'
    ],
    interactions: [
      'May interact with alcohol causing increased drowsiness',
      'May interact with other medications metabolized by the liver',
      'Use caution when combined with blood thinners'
    ],
    indications: [
      `Treatment of ${baseDrug.category.toLowerCase()} related conditions`,
      'Short-term management of acute symptoms',
      baseDrug.category === 'Analgesic' ? 'Relief of mild to moderate pain' : 'As prescribed by healthcare provider'
    ],
    contraindications: [
      'Hypersensitivity to the active ingredient or any component of the formulation',
      'Severe liver or kidney impairment',
      'Pregnancy (consult physician)',
      'Lactation (consult physician)'
    ],
    pregnancy: 'This medication should be used during pregnancy only if the potential benefit justifies the potential risk to the fetus. Consult your doctor before use.',
    storage: 'Store at room temperature between 68-77°F (20-25°C). Keep away from moisture, heat, and light. Keep out of reach of children.',
    warnings: [
      'Do not exceed recommended dose',
      'Discontinue use and consult physician if symptoms persist or worsen',
      'May cause drowsiness; use caution when driving or operating machinery'
    ],
    similarDrugs: getSimilarDrugs(baseDrug.category, baseDrug.id)
  };
  
  return detailedDrug;
};

// Helper function to get similar drugs in the same category
const getSimilarDrugs = (category: string, currentDrugId: string): Array<{ id: string, name: string }> => {
  // Combine both data sources
  const allDrugs = [...mockDrugsData, ...additionalDrugsData];
  
  // Find drugs in the same category, excluding the current drug
  const similarDrugs = allDrugs
    .filter(drug => drug.category === category && drug.id !== currentDrugId)
    .slice(0, 4); // Limit to 4 similar drugs
  
  // Return simplified version with just id and name
  return similarDrugs.map(drug => ({
    id: drug.id,
    name: drug.name
  }));
};
