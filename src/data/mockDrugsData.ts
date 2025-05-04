
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
    image: 'https://www.drugs.com/images/pills/nlm/006035601.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/HU/QW/HX/102217022/paracetamol-tablet-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/167140352.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/1/LO/OO/AG/96624470/ibuprofen-tablets-ip-400-mg-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000930111.jpg',
    packageImage: 'https://4.imimg.com/data4/OY/VC/MY-11753354/amoxicillin-capsules-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/311550147.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/1/RV/KF/BQ/13085548/lisinopril-tablets-250x250.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/007810258.jpg',
    packageImage: 'https://4.imimg.com/data4/GI/GX/MY-15064706/loratadine-tablets-usp-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000930748.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/2/DT/DP/EG/41799276/metformin-tablets-ip-500mg-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/007810401.jpg',
    packageImage: 'https://5.imimg.com/data5/ANDROID/Default/2022/11/RY/AV/OE/69583844/product-jpeg-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/550110467.jpg',
    packageImage: 'https://4.imimg.com/data4/QF/JN/MY-11514615/omeprazole-capsules-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/003780159.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2020/10/AO/LC/RQ/14766358/amlodipine-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/493450068.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/5/YF/ER/RA/73956040/sertraline-tablets-250x250.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000930172.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/1/DG/XI/SE/43723005/prozac-capsules-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/mmx/t113505f/losartan-potassium.jpg',
    packageImage: '/lovable-uploads/357d2940-cfa0-43c8-bbaf-29cd6665eb03.png'
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
    image: 'https://www.drugs.com/images/pills/mtm/Albuterol%20Sulfate%202%20mg-MYL.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/10/QI/HN/UB/138404772/albuterol-sulfate-100ml-solution-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/003786860.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/1/ZH/OP/LM/69583844/levothyroxine-sodium-tablets-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/003786980.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/1/UA/US/QL/13085548/simvastatin-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/180880101.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/YX/XN/JM/13085548/gabapentin-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/008910371.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/GF/VM/KN/13085548/hydrochlorothiazide-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000930748.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/XG/WI/IZ/13085548/metoprolol-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/551110588.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/GM/KN/OX/13085548/warfarin-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/003782608.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/003780032.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/167140270.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/493450085.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/597810288.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/mtm/Pantoprazole%20Sodium%2040%20mg-TEV.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/594150770.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/mtm/Amlodipine%20Besylate%205%20mg-MYL.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000060111.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/001860756.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000690365.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/005190079.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000060552.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/mtm/Advair%20Diskus%20250-50-GLA.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000741525.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000090029.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/006035477.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/006035789.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/006035453.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/000080715.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/501070177.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2023/2/OX/ER/JM/13085548/prednisolone-tablets-ip-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/mmx/t109508f/azithromycin.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/11/VT/JO/VM/28186990/azithromycin-tablet-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/167140115.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/12/BO/HT/SY/28186990/ciprofloxacin-tablets-500x500.jpg'
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
    image: 'https://www.drugs.com/images/pills/nlm/006035430.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/8/IY/LB/AR/88223930/doxycycline-tablet-500x500.jpg'
  },
  {
    id: '44',
    name: 'Metronidazole',
    genericName: 'Metronidazole',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Antibiotic and antiprotozoal medication used to treat bacterial infections of the vagina, stomach, liver, skin, joints, brain, and respiratory tract.',
    drugClass: 'Nitroimidazole antibiotic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mmx/t110104f/metronidazole.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/9/RN/BU/HS/166734160/metronidazole-tablets-500x500.jpg'
  },
  {
    id: '45',
    name: 'Trimethoprim/Sulfamethoxazole',
    genericName: 'Cotrimoxazole',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Combination antibiotic used to treat a variety of bacterial infections, including urinary tract infections, middle ear infections, and respiratory infections.',
    drugClass: 'Sulfonamide antibiotic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/167141151.jpg',
    packageImage: 'https://5.imimg.com/data5/ANDROID/Default/2022/1/ZG/MY/DR/56660397/product-jpeg-500x500.jpg'
  },
  
  // Adding Essential Antihypertensives
  {
    id: '46',
    name: 'Enalapril',
    genericName: 'Enalapril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure, heart failure, and to prevent kidney problems in people with diabetes or heart disease.',
    drugClass: 'ACE inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000060131.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/MT/FH/ZR/13260118/enalapril-tablets-500x500.jpg'
  },
  {
    id: '47',
    name: 'Valsartan',
    genericName: 'Valsartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin II receptor blocker used to treat high blood pressure and heart failure.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930776.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/1/QM/KO/PO/105951293/valsartan-tablets-500x500.jpg'
  },
  {
    id: '48',
    name: 'Diltiazem',
    genericName: 'Diltiazem hydrochloride',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure and certain types of chest pain.',
    drugClass: 'Calcium channel blocker',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930931.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/1/XD/JJ/GI/105951293/diltiazem-tablets-500x500.jpg'
  },
  
  // Adding Pain Medications
  {
    id: '49',
    name: 'Tramadol',
    genericName: 'Tramadol hydrochloride',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid pain medication used to treat moderate to moderately severe pain.',
    drugClass: 'Opioid analgesic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006035346.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/1/IG/HC/XO/86588935/tramadol-hydrochloride-tablets-500x500.jpg'
  },
  {
    id: '50',
    name: 'Diclofenac',
    genericName: 'Diclofenac sodium',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain, inflammatory disorders, and dysmenorrhea.',
    drugClass: 'NSAID',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006729022.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/YE/HI/OW/73800746/diclofenac-sodium-tablets-bp-500x500.jpg'
  },
  {
    id: '51',
    name: 'Naproxen',
    genericName: 'Naproxen',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain, fever, and inflammation.',
    drugClass: 'NSAID',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/001862272.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/4/EP/BV/QQ/138404772/naproxen-sodium-tablets-500x500.jpg'
  },
  
  // Adding Diabetes Medications
  {
    id: '52',
    name: 'Glimepiride',
    genericName: 'Glimepiride',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Sulfonylurea used to treat type 2 diabetes by increasing the amount of insulin produced by the pancreas.',
    drugClass: 'Sulfonylurea',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/005910461.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/5/UG/CA/MG/10332382/glimepiride-tablets-500x500.jpg'
  },
  {
    id: '53',
    name: 'Pioglitazone',
    genericName: 'Pioglitazone hydrochloride',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Thiazolidinedione used to treat type 2 diabetes by decreasing insulin resistance.',
    drugClass: 'Thiazolidinedione',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/600780166.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/8/JS/KD/YP/2704753/pioglitazone-tablets-500x500.jpg'
  },
  {
    id: '54',
    name: 'Empagliflozin',
    genericName: 'Empagliflozin',
    manufacturer: 'Boehringer Ingelheim',
    category: 'Antidiabetic',
    description: 'SGLT-2 inhibitor used to treat type 2 diabetes by helping the kidneys get rid of glucose from the bloodstream.',
    drugClass: 'SGLT-2 inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mmx/t110631f/jardiance.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/6/CH/PE/NK/83054226/empagliflozin-tablets-500x500.png'
  },
  
  // Adding Mental Health Medications
  {
    id: '55',
    name: 'Venlafaxine',
    genericName: 'Venlafaxine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'SNRI used to treat major depressive disorder, generalized anxiety disorder, and social anxiety disorder.',
    drugClass: 'SNRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/005910878.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/5/MC/OZ/GY/116051148/venlafaxine-tablets-500x500.jpg'
  },
  {
    id: '56',
    name: 'Duloxetine',
    genericName: 'Duloxetine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'SNRI used to treat depression, anxiety, and certain types of chronic pain.',
    drugClass: 'SNRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mmx/t110307f/cymbalta.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/5/DI/BB/KR/105951293/duloxetine-capsules-500x500.jpg'
  },
  {
    id: '57',
    name: 'Quetiapine',
    genericName: 'Quetiapine fumarate',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia, bipolar disorder, and as an add-on treatment for major depressive disorder.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/655950204.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/7/AE/XZ/TO/105951293/quetiapine-tablets-500x500.jpg'
  },
  
  // Adding More Gastrointestinal Medications
  {
    id: '58',
    name: 'Ranitidine',
    genericName: 'Ranitidine hydrochloride',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'H2 antagonist used to treat and prevent ulcers in the stomach and intestines.',
    drugClass: 'H2 antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930538.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/1/GJ/RD/KH/13085548/ranitidine-tablets-ip-500x500.jpg'
  },
  {
    id: '59',
    name: 'Ondansetron',
    genericName: 'Ondansetron hydrochloride',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Serotonin 5-HT3 receptor antagonist used to prevent nausea and vomiting caused by cancer chemotherapy, radiation therapy, and surgery.',
    drugClass: 'Serotonin 5-HT3 receptor antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930931.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/ME/HZ/MQ/109099452/ondansetron-tablet-500x500.png'
  },
  {
    id: '60',
    name: 'Domperidone',
    genericName: 'Domperidone',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Dopamine antagonist used to treat nausea and vomiting, and to increase milk production in breastfeeding mothers.',
    drugClass: 'Dopamine antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/custom/pill22307-1/domperidone.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/10/UQ/IN/WM/44672480/domperidone-tablets-ip-500x500.jpg'
  }
]

// Function to get detailed drug data by ID
export const getDetailedDrugData = (id: string): DetailedDrugData | null => {
  const drug = mockDrugsData.find(drug => drug.id === id);
  
  if (!drug) return null;
  
  // Make sure all required properties have default values if they don't exist in the drug object
  const detailedDrug: DetailedDrugData = {
    id: drug.id,
    name: drug.name,
    genericName: drug.genericName || drug.name, // Use name as fallback if genericName is missing
    manufacturer: drug.manufacturer || 'Unknown',
    category: drug.category || 'Uncategorized',
    description: drug.description || 'No description available',
    drugClass: drug.drugClass || 'Unknown',
    verified: drug.verified || false,
    image: drug.image,
    packageImage: drug.packageImage,
    prescriptionStatus: Math.random() > 0.3 ? 'Prescription Only' : 'OTC',
    dosageAndAdmin: 'Dosage should be individualized based on the condition being treated and patient response. Initial dose may be adjusted to achieve desired therapeutic effect.',
    mechanism: 'The primary mechanism of action involves blocking specific pathways in the body that contribute to the disease process, resulting in therapeutic effects.',
    sideEffects: [
      'Headache',
      'Nausea',
      'Dizziness',
      'Fatigue',
      'Gastrointestinal discomfort'
    ],
    interactions: [
      'May interact with other medications that affect the same physiological systems.',
      'Alcohol may increase the risk of certain side effects.',
      'Certain foods may alter the absorption or metabolism of this medication.'
    ],
    indications: [
      'Treatment of conditions related to the primary therapeutic class',
      'Management of symptoms associated with the target disease',
      'Prevention of complications related to the underlying condition'
    ],
    contraindications: [
      'Known hypersensitivity to the active ingredient or any component of the formulation',
      'Severe liver or kidney impairment (may require dose adjustment)',
      'Pregnancy or breastfeeding (consult healthcare provider)'
    ],
    pregnancy: 'Use during pregnancy only if the potential benefit justifies the potential risk to the fetus. Consult healthcare provider before use.',
    storage: 'Store at room temperature (20-25°C/68-77°F). Keep container tightly closed. Protect from light and moisture.',
    warnings: [
      'Do not exceed recommended dosage',
      'Discontinue use and consult healthcare provider if severe side effects occur',
      'May cause drowsiness or dizziness; use caution when driving or operating machinery'
    ],
    similarDrugs: drug.category ? 
      mockDrugsData
        .filter(d => d.category === drug.category && d.id !== drug.id)
        .slice(0, 4)
        .map(d => ({
          id: d.id,
          name: d.name,
          drugClass: d.drugClass
        })) 
      : []
  };
  
  return detailedDrug;
};
