
import { DrugData } from "@/components/DrugCard";

export const additionalDrugsData: DrugData[] = [
  // Cardiovascular drugs
  {
    id: '101',
    name: 'Enalapril',
    genericName: 'Enalapril maleate',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure, heart failure, and to prevent kidney problems in people with diabetes.',
    drugClass: 'ACE inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mtm/Enalapril%20Maleate%2010%20mg-MYL.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/BK/CP/GI/28186990/enalapril-tablets-ip-500x500.jpg',
    brandNames: ['Vasotec', 'Epaned']
  },
  {
    id: '102',
    name: 'Atenolol',
    genericName: 'Atenolol',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Beta-blocker that affects the heart and circulation. Used to treat angina and high blood pressure.',
    drugClass: 'Beta blocker',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006035268.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/HW/DZ/CE/14916981/atenolol-tablets-500x500.jpg',
    brandNames: ['Tenormin']
  },
  {
    id: '103',
    name: 'Diltiazem',
    genericName: 'Diltiazem hydrochloride',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure, angina, and certain heart rhythm disorders.',
    drugClass: 'Calcium channel blocker',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930368.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/1/PI/TI/RY/14916981/diltiazem-tablets-500x500.jpg',
    brandNames: ['Cardizem', 'Cartia XT', 'Tiazac']
  },
  {
    id: '104',
    name: 'Verapamil',
    genericName: 'Verapamil hydrochloride',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure, angina, and certain heart rhythm disorders.',
    drugClass: 'Calcium channel blocker',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006033930.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/3/OS/UG/MD/48725486/verapamil-hydrochloride-injection-500x500.png',
    brandNames: ['Calan', 'Verelan', 'Isoptin SR']
  },
  
  // Gastrointestinal drugs
  {
    id: '105',
    name: 'Ranitidine',
    genericName: 'Ranitidine hydrochloride',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'H2 blocker that reduces the amount of acid in the stomach. Used to treat and prevent ulcers in the stomach and intestines.',
    drugClass: 'H2 receptor antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006035767.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/MB/CD/GG/13085548/ranitidine-tablets-500x500.jpg',
    brandNames: ['Zantac']
  },
  {
    id: '106',
    name: 'Famotidine',
    genericName: 'Famotidine',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'H2 blocker that reduces the amount of acid in the stomach. Used to treat conditions such as ulcers and GERD.',
    drugClass: 'H2 receptor antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930406.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/3/RT/LU/DM/88223930/famotidine-tablets-500x500.jpg',
    brandNames: ['Pepcid']
  },
  {
    id: '107',
    name: 'Lansoprazole',
    genericName: 'Lansoprazole',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor that decreases the amount of acid produced in the stomach. Used to treat ulcers, GERD, and Zollinger-Ellison syndrome.',
    drugClass: 'Proton pump inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006035286.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/8/HL/PB/MR/89723159/lansoprazole-capsules-500x500.jpg',
    brandNames: ['Prevacid', 'Prevacid SoluTab']
  },
  {
    id: '108',
    name: 'Esomeprazole',
    genericName: 'Esomeprazole magnesium',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor that reduces stomach acid. Used to treat GERD, gastric ulcers, and Zollinger-Ellison syndrome.',
    drugClass: 'Proton pump inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000186756.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/XV/ZZ/VC/138122417/esomeprazole-tablets-500x500.jpg',
    brandNames: ['Nexium', 'Nexium 24HR']
  },
  
  // Respiratory drugs
  {
    id: '109',
    name: 'Fluticasone',
    genericName: 'Fluticasone propionate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Corticosteroid that reduces inflammation in the airways. Used to treat asthma and allergic rhinitis.',
    drugClass: 'Corticosteroid',
    verified: true,
    image: 'https://www.drugs.com/images/pills/custom/pill11746-1/fluticasone-propionate.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/2/OR/MC/TF/31070935/fluticasone-propionate-nasal-spray-500x500.jpg',
    brandNames: ['Flonase', 'Flovent']
  },
  {
    id: '110',
    name: 'Montelukast',
    genericName: 'Montelukast sodium',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Leukotriene receptor antagonist used to prevent asthma attacks and to treat seasonal allergies.',
    drugClass: 'Leukotriene receptor antagonist',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/597810157.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/9/BS/MG/QZ/13085548/montelukast-tablets-ip-500x500.jpg',
    brandNames: ['Singulair']
  },
  {
    id: '111',
    name: 'Tiotropium',
    genericName: 'Tiotropium bromide',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Anticholinergic bronchodilator that helps open air passages in the lungs. Used to treat COPD.',
    drugClass: 'Anticholinergic bronchodilator',
    verified: true,
    image: 'https://www.drugs.com/images/pills/custom/pill17671-1/tiotropium-bromide.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/IL/AT/HB/112009195/tiotropium-bromide-inhalation-powder-500x500.jpg',
    brandNames: ['Spiriva', 'Spiriva Respimat']
  },
  {
    id: '112',
    name: 'Ipratropium',
    genericName: 'Ipratropium bromide',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Anticholinergic bronchodilator that relaxes muscles in the airways and increases air flow to the lungs. Used to treat bronchospasm associated with COPD.',
    drugClass: 'Anticholinergic bronchodilator',
    verified: true,
    image: 'https://www.drugs.com/images/pills/custom/pill16094-1/ipratropium-bromide.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/1/JR/GP/DZ/18684134/ipratropium-bromide-respules-500x500.jpg',
    brandNames: ['Atrovent', 'Atrovent HFA']
  },
  
  // Endocrine drugs
  {
    id: '113',
    name: 'Glimepiride',
    genericName: 'Glimepiride',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Sulfonylurea that helps control blood sugar levels by causing the pancreas to produce insulin. Used to treat type 2 diabetes.',
    drugClass: 'Sulfonylurea',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/597810230.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/3/ED/JF/KJ/88223930/glimepiride-tablets-500x500.jpg',
    brandNames: ['Amaryl']
  },
  {
    id: '114',
    name: 'Glyburide',
    genericName: 'Glyburide',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Sulfonylurea that stimulates the release of insulin from the pancreas. Used to treat type 2 diabetes.',
    drugClass: 'Sulfonylurea',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930525.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/2/PC/DC/WS/13085548/glyburide-tablets-usp-500x500.jpg',
    brandNames: ['DiaBeta', 'Glynase PresTab']
  },
  {
    id: '115',
    name: 'Sitagliptin',
    genericName: 'Sitagliptin phosphate',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'DPP-4 inhibitor that helps control blood sugar levels by increasing insulin production and decreasing liver glucose production. Used to treat type 2 diabetes.',
    drugClass: 'DPP-4 inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000060740.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/2/GW/TI/CU/14532671/sitagliptin-tablets-500x500.jpg',
    brandNames: ['Januvia']
  },
  {
    id: '116',
    name: 'Linagliptin',
    genericName: 'Linagliptin',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'DPP-4 inhibitor that helps control blood sugar levels by increasing insulin production and decreasing liver glucose production. Used to treat type 2 diabetes.',
    drugClass: 'DPP-4 inhibitor',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mtm/Linagliptin%205%20mg-BIV.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/1/DR/PC/JF/137111855/linagliptin-tablets-500x500.jpg',
    brandNames: ['Tradjenta']
  },
  
  // CNS drugs - Antidepressants
  {
    id: '117',
    name: 'Venlafaxine',
    genericName: 'Venlafaxine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin-norepinephrine reuptake inhibitor (SNRI) used to treat major depressive disorder, anxiety, and panic disorder.',
    drugClass: 'SNRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930321.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/2/YI/JJ/KI/13085548/venlafaxine-tablets-ip-500x500.jpg',
    brandNames: ['Effexor', 'Effexor XR']
  },
  {
    id: '118',
    name: 'Duloxetine',
    genericName: 'Duloxetine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin-norepinephrine reuptake inhibitor (SNRI) used to treat depression, anxiety disorders, fibromyalgia, and diabetic neuropathy.',
    drugClass: 'SNRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/006070154.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/1/LF/QL/EZ/13085548/duloxetine-capsules-ip-500x500.jpg',
    brandNames: ['Cymbalta']
  },
  {
    id: '119',
    name: 'Paroxetine',
    genericName: 'Paroxetine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression, panic attacks, obsessive-compulsive disorder, anxiety disorders, and post-traumatic stress disorder.',
    drugClass: 'SSRI',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/675440271.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/1/BJ/AX/RV/13085548/paroxetine-tablets-ip-500x500.jpg',
    brandNames: ['Paxil', 'Paxil CR', 'Pexeva']
  },
  {
    id: '120',
    name: 'Bupropion',
    genericName: 'Bupropion hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Aminoketone antidepressant used to treat depression and seasonal affective disorder, and as an aid to smoking cessation treatment.',
    drugClass: 'Aminoketone',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/675440165.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/8/TN/NC/FF/13085548/bupropion-hydrochloride-tablets-ip-500x500.jpg',
    brandNames: ['Wellbutrin', 'Wellbutrin SR', 'Wellbutrin XL', 'Zyban']
  },
  
  // CNS drugs - Antipsychotics
  {
    id: '121',
    name: 'Olanzapine',
    genericName: 'Olanzapine',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia and bipolar disorder.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/005917711.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/OA/LG/BG/14916981/olanzapine-tablets-ip-500x500.jpg',
    brandNames: ['Zyprexa', 'Zyprexa Zydis']
  },
  {
    id: '122',
    name: 'Quetiapine',
    genericName: 'Quetiapine fumarate',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia, bipolar disorder, and as add-on treatment for major depressive disorder.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mtm/Quetiapine%20Fumarate%2025%20mg-TEV.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2021/12/EX/KH/ZX/28186990/quetiapine-fumarate-tablets-ip-500x500.jpg',
    brandNames: ['Seroquel', 'Seroquel XR']
  },
  {
    id: '123',
    name: 'Aripiprazole',
    genericName: 'Aripiprazole',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia, bipolar disorder, major depressive disorder, and irritability associated with autism.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/mtm/Aripiprazole%202%20mg-MYL.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/9/MS/QM/LU/13085548/aripiprazole-tablets-ip-500x500.jpg',
    brandNames: ['Abilify', 'Abilify Maintena', 'Aristada']
  },
  {
    id: '124',
    name: 'Ziprasidone',
    genericName: 'Ziprasidone hydrochloride',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia and acute episodes of bipolar mania.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/590290094.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/1/XO/JN/VK/13085548/ziprasidone-hydrochloride-capsules-usp-500x500.jpg',
    brandNames: ['Geodon']
  },
  
  // CNS drugs - Anxiolytics
  {
    id: '125',
    name: 'Lorazepam',
    genericName: 'Lorazepam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat anxiety disorders, trouble sleeping, active seizures, and alcohol withdrawal.',
    drugClass: 'Benzodiazepine',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930834.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/2/IV/KY/FW/13085548/lorazepam-tablets-ip-500x500.jpg',
    brandNames: ['Ativan']
  },
  {
    id: '126',
    name: 'Clonazepam',
    genericName: 'Clonazepam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat panic disorder, anxiety disorders, and seizures.',
    drugClass: 'Benzodiazepine',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930278.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/3/AC/JR/EC/88223930/clonazepam-tablets-500x500.jpg',
    brandNames: ['Klonopin']
  },
  {
    id: '127',
    name: 'Buspirone',
    genericName: 'Buspirone hydrochloride',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Anxiolytic medication used to treat anxiety disorders.',
    drugClass: 'Azapirone',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/003786318.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/2/UF/CZ/BD/13085548/buspirone-tablets-ip-500x500.jpg',
    brandNames: ['BuSpar']
  },
  {
    id: '128',
    name: 'Hydroxyzine',
    genericName: 'Hydroxyzine hydrochloride',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Antihistamine with anxiolytic properties used to treat anxiety, nausea and vomiting, and severe itching.',
    drugClass: 'Antihistamine',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930539.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/9/FC/PO/KE/13085548/hydroxyzine-tablets-ip-500x500.jpg',
    brandNames: ['Atarax', 'Vistaril']
  },
  
  // Analgesics - NSAIDs
  {
    id: '129',
    name: 'Naproxen',
    genericName: 'Naproxen',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain, fever, inflammation, and stiffness.',
    drugClass: 'NSAID',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/000930940.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/7/OH/MH/TJ/118061383/naproxen-tablets-500x500.jpg',
    brandNames: ['Aleve', 'Naprosyn', 'Anaprox']
  },
  {
    id: '130',
    name: 'Meloxicam',
    genericName: 'Meloxicam',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain and inflammation caused by osteoarthritis and rheumatoid arthritis.',
    drugClass: 'NSAID',
    verified: true,
    image: 'https://www.drugs.com/images/pills/nlm/539460161.jpg',
    packageImage: 'https://5.imimg.com/data5/SELLER/Default/2022/6/KO/MD/ED/89723159/meloxicam-tablets-ip-500x500.jpg',
    brandNames: ['Mobic', 'Vivlodex']
  }
];

// This file can be expanded to include more medications as needed
