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
    brandNames: ['Mobic', 'Vivlodex']
  },
  
  // Adding more WHO essential medicines (extending what we already have)
  {
    id: '200',
    name: 'Bisoprolol',
    genericName: 'Bisoprolol fumarate',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Beta-blocker used to treat high blood pressure and heart failure.',
    drugClass: 'Beta blocker',
    verified: true,
    brandNames: ['Zebeta', 'Concor']
  },
  {
    id: '201',
    name: 'Ramipril',
    genericName: 'Ramipril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure, heart failure, and to reduce the risk of cardiovascular events.',
    drugClass: 'ACE inhibitor',
    verified: true,
    brandNames: ['Altace', 'Ramace']
  },
  {
    id: '202',
    name: 'Candesartan',
    genericName: 'Candesartan cilexetil',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin II receptor antagonist used to treat high blood pressure and heart failure.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    brandNames: ['Atacand', 'Blopress']
  },
  {
    id: '203',
    name: 'Irbesartan',
    genericName: 'Irbesartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin II receptor antagonist used to treat high blood pressure and diabetic nephropathy.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    brandNames: ['Avapro', 'Aprovel']
  },
  {
    id: '204',
    name: 'Telmisartan',
    genericName: 'Telmisartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin II receptor antagonist used to treat high blood pressure and reduce cardiovascular risk.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    brandNames: ['Micardis', 'Pritor']
  },
  {
    id: '205',
    name: 'Hydrochlorothiazide/Lisinopril',
    genericName: 'Hydrochlorothiazide/Lisinopril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Combination of a thiazide diuretic and an ACE inhibitor used to treat high blood pressure.',
    drugClass: 'ACE inhibitor/Thiazide diuretic',
    verified: true,
    brandNames: ['Zestoretic', 'Prinzide']
  },
  {
    id: '206',
    name: 'Amlodipine/Valsartan',
    genericName: 'Amlodipine/Valsartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Combination of a calcium channel blocker and an angiotensin II receptor antagonist used to treat high blood pressure.',
    drugClass: 'Calcium channel blocker/Angiotensin II receptor antagonist',
    verified: true,
    brandNames: ['Exforge', 'Amlovas']
  },
  
  // Additional Antibiotics
  {
    id: '207',
    name: 'Clarithromycin',
    genericName: 'Clarithromycin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Macrolide antibiotic used to treat various bacterial infections, including respiratory tract infections, skin infections, and H. pylori infections.',
    drugClass: 'Macrolide antibiotic',
    verified: true,
    brandNames: ['Biaxin', 'Klacid']
  },
  {
    id: '208',
    name: 'Erythromycin',
    genericName: 'Erythromycin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Macrolide antibiotic used to treat a variety of bacterial infections.',
    drugClass: 'Macrolide antibiotic',
    verified: true,
    brandNames: ['E-Mycin', 'Eryc', 'Erythrocin']
  },
  {
    id: '209',
    name: 'Trimethoprim/Sulfamethoxazole',
    genericName: 'Trimethoprim/Sulfamethoxazole',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Combination antibiotic used to treat a variety of bacterial infections.',
    drugClass: 'Sulfonamide antibiotic',
    verified: true,
    brandNames: ['Bactrim', 'Septra', 'Cotrim']
  },
  {
    id: '210',
    name: 'Levofloxacin',
    genericName: 'Levofloxacin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Fluoroquinolone antibiotic used to treat a variety of bacterial infections, including respiratory, urinary tract, and skin infections.',
    drugClass: 'Fluoroquinolone antibiotic',
    verified: true,
    brandNames: ['Levaquin', 'Quixin', 'Iquix']
  },
  {
    id: '211',
    name: 'Cephalexin',
    genericName: 'Cephalexin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'First-generation cephalosporin antibiotic used to treat bacterial infections including upper respiratory, ear, skin, and urinary tract infections.',
    drugClass: 'Cephalosporin antibiotic',
    verified: true,
    brandNames: ['Keflex', 'Ceporex']
  },
  {
    id: '212',
    name: 'Ceftriaxone Sodium',
    genericName: 'Ceftriaxone Sodium',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Third-generation cephalosporin antibiotic used to treat serious bacterial infections.',
    drugClass: 'Cephalosporin antibiotic',
    verified: true,
    brandNames: ['Rocephin', 'Ceftriaxone Sandoz']
  },
  
  // Additional Antidiabetic medications
  {
    id: '213',
    name: 'Empagliflozin',
    genericName: 'Empagliflozin',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'SGLT2 inhibitor used to treat type 2 diabetes and reduce the risk of cardiovascular death in patients with type 2 diabetes and cardiovascular disease.',
    drugClass: 'SGLT2 inhibitor',
    verified: true,
    brandNames: ['Jardiance', 'Empaglif']
  },
  {
    id: '214',
    name: 'Dapagliflozin',
    genericName: 'Dapagliflozin',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'SGLT2 inhibitor used to treat type 2 diabetes and heart failure.',
    drugClass: 'SGLT2 inhibitor',
    verified: true,
    brandNames: ['Farxiga', 'Forxiga']
  },
  {
    id: '215',
    name: 'Liraglutide',
    genericName: 'Liraglutide',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'GLP-1 receptor agonist used to treat type 2 diabetes and obesity.',
    drugClass: 'GLP-1 receptor agonist',
    verified: true,
    brandNames: ['Victoza', 'Saxenda']
  },
  {
    id: '216',
    name: 'Dulaglutide',
    genericName: 'Dulaglutide',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'GLP-1 receptor agonist used to treat type 2 diabetes.',
    drugClass: 'GLP-1 receptor agonist',
    verified: true,
    brandNames: ['Trulicity']
  },
  {
    id: '217',
    name: 'Canagliflozin',
    genericName: 'Canagliflozin',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'SGLT2 inhibitor used to treat type 2 diabetes and reduce the risk of cardiovascular events.',
    drugClass: 'SGLT2 inhibitor',
    verified: true,
    brandNames: ['Invokana']
  },
  
  // Additional Anti-inflammatory drugs
  {
    id: '218',
    name: 'Celecoxib',
    genericName: 'Celecoxib',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'COX-2 selective nonsteroidal anti-inflammatory drug used to treat pain and inflammation.',
    drugClass: 'COX-2 inhibitor',
    verified: true,
    brandNames: ['Celebrex']
  },
  {
    id: '219',
    name: 'Diclofenac',
    genericName: 'Diclofenac sodium',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain and inflammation.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Voltaren', 'Cataflam', 'Zipsor']
  },
  {
    id: '220',
    name: 'Indomethacin',
    genericName: 'Indomethacin',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain, inflammation, and fever.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Indocin', 'Tivorbex']
  },
  {
    id: '221',
    name: 'Ketorolac',
    genericName: 'Ketorolac tromethamine',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used for short-term management of moderate to severe pain.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Toradol', 'Sprix', 'Acular']
  },
  
  // Additional Respiratory medications
  {
    id: '222',
    name: 'Salmeterol',
    genericName: 'Salmeterol xinafoate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Long-acting beta2-adrenergic agonist used to prevent bronchospasm in asthma and COPD.',
    drugClass: 'Long-acting beta agonist',
    verified: true,
    brandNames: ['Serevent']
  },
  {
    id: '223',
    name: 'Formoterol',
    genericName: 'Formoterol fumarate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Long-acting beta2-adrenergic agonist used to prevent bronchospasm in asthma and COPD.',
    drugClass: 'Long-acting beta agonist',
    verified: true,
    brandNames: ['Foradil', 'Perforomist']
  },
  {
    id: '224',
    name: 'Budesonide/Formoterol',
    genericName: 'Budesonide/Formoterol fumarate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Combination of a corticosteroid and a long-acting beta2-adrenergic agonist used to treat asthma and COPD.',
    drugClass: 'Corticosteroid/Long-acting beta agonist',
    verified: true,
    brandNames: ['Symbicort']
  },
  {
    id: '225',
    name: 'Umeclidinium',
    genericName: 'Umeclidinium bromide',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Long-acting muscarinic antagonist used to treat COPD.',
    drugClass: 'Anticholinergic bronchodilator',
    verified: true,
    brandNames: ['Incruse Ellipta']
  },
  {
    id: '226',
    name: 'Umeclidinium/Vilanterol',
    genericName: 'Umeclidinium bromide/Vilanterol trifenatate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Combination of a long-acting muscarinic antagonist and a long-acting beta2-adrenergic agonist used to treat COPD.',
    drugClass: 'Anticholinergic bronchodilator/Long-acting beta agonist',
    verified: true,
    brandNames: ['Anoro Ellipta']
  },
  
  // Additional Anti-allergy medications
  {
    id: '227',
    name: 'Fexofenadine',
    genericName: 'Fexofenadine hydrochloride',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Second-generation antihistamine used to relieve allergy symptoms.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    brandNames: ['Allegra', 'Telfast']
  },
  {
    id: '228',
    name: 'Desloratadine',
    genericName: 'Desloratadine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Second-generation antihistamine used to relieve allergy symptoms.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    brandNames: ['Clarinex', 'Aerius']
  },
  {
    id: '229',
    name: 'Levocetirizine',
    genericName: 'Levocetirizine dihydrochloride',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Second-generation antihistamine used to relieve allergy symptoms.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    brandNames: ['Xyzal', 'Xusal']
  },
  {
    id: '230',
    name: 'Azelastine',
    genericName: 'Azelastine hydrochloride',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Second-generation antihistamine used to relieve nasal allergy symptoms and eye allergy symptoms.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    brandNames: ['Astelin', 'Optivar', 'Astepro']
  },
  
  // Additional Antilipemic medications
  {
    id: '231',
    name: 'Rosuvastatin',
    genericName: 'Rosuvastatin calcium',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'HMG-CoA reductase inhibitor used to lower cholesterol and prevent cardiovascular disease.',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    verified: true,
    brandNames: ['Crestor']
  },
  {
    id: '232',
    name: 'Pravastatin',
    genericName: 'Pravastatin sodium',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'HMG-CoA reductase inhibitor used to lower cholesterol and prevent cardiovascular disease.',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    verified: true,
    brandNames: ['Pravachol', 'Lipostat']
  },
  {
    id: '233',
    name: 'Ezetimibe',
    genericName: 'Ezetimibe',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Cholesterol absorption inhibitor used to lower cholesterol.',
    drugClass: 'Cholesterol absorption inhibitor',
    verified: true,
    brandNames: ['Zetia', 'Ezetrol']
  },
  {
    id: '234',
    name: 'Fenofibrate',
    genericName: 'Fenofibrate',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Fibric acid derivative used to lower triglycerides and cholesterol.',
    drugClass: 'Fibric acid derivative',
    verified: true,
    brandNames: ['Tricor', 'Fenoglide', 'Antara']
  },
  
  // Additional Psychotropic medications
  {
    id: '235',
    name: 'Mirtazapine',
    genericName: 'Mirtazapine',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Tetracyclic antidepressant used to treat depression.',
    drugClass: 'Tetracyclic antidepressant',
    verified: true,
    brandNames: ['Remeron']
  },
  {
    id: '236',
    name: 'Trazodone',
    genericName: 'Trazodone hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin antagonist and reuptake inhibitor used to treat depression and insomnia.',
    drugClass: 'Serotonin antagonist and reuptake inhibitor',
    verified: true,
    brandNames: ['Desyrel', 'Oleptro']
  },
  {
    id: '237',
    name: 'Desvenlafaxine',
    genericName: 'Desvenlafaxine succinate',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin-norepinephrine reuptake inhibitor used to treat depression.',
    drugClass: 'SNRI',
    verified: true,
    brandNames: ['Pristiq', 'Khedezla']
  },
  {
    id: '238',
    name: 'Vilazodone',
    genericName: 'Vilazodone hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin reuptake inhibitor and 5-HT1A partial agonist used to treat depression.',
    drugClass: 'SSRI/5-HT1A partial agonist',
    verified: true,
    brandNames: ['Viibryd']
  },
  
  // Additional Antimalarial medications
  {
    id: '239',
    name: 'Mefloquine',
    genericName: 'Mefloquine hydrochloride',
    manufacturer: 'Various',
    category: 'Antimalarial',
    description: 'Medication used to prevent and treat malaria.',
    drugClass: 'Antimalarial',
    verified: true,
    brandNames: ['Lariam']
  },
  {
    id: '240',
    name: 'Atovaquone/Proguanil',
    genericName: 'Atovaquone/Proguanil',
    manufacturer: 'Various',
    category: 'Antimalarial',
    description: 'Combination medication used to prevent and treat malaria.',
    drugClass: 'Antimalarial',
    verified: true,
    brandNames: ['Malarone']
  },
  {
    id: '241',
    name: 'Doxycycline for Malaria',
    genericName: 'Doxycycline hyclate',
    manufacturer: 'Various',
    category: 'Antimalarial',
    description: 'Tetracycline antibiotic used to prevent malaria.',
    drugClass: 'Tetracycline antibiotic',
    verified: true,
    brandNames: ['Vibramycin', 'Oracea', 'Doryx']
  },
  
  // Additional Antivirals
  {
    id: '242',
    name: 'Oseltamivir',
    genericName: 'Oseltamivir phosphate',
    manufacturer: 'Various',
    category: 'Antiviral',
    description: 'Neuraminidase inhibitor used to treat and prevent influenza.',
    drugClass: 'Neuraminidase inhibitor',
    verified: true,
    brandNames: ['Tamiflu']
  },
  {
    id: '243',
    name: 'Valacyclovir',
    genericName: 'Valacyclovir hydrochloride',
    manufacturer: 'Various',
    category: 'Antiviral',
    description: 'Antiviral medication used to treat herpes virus infections.',
    drugClass: 'Antiviral',
    verified: true,
    brandNames: ['Valtrex']
  },
  {
    id: '244',
    name: 'Famciclovir',
    genericName: 'Famciclovir',
    manufacturer: 'Various',
    category: 'Antiviral',
    description: 'Antiviral medication used to treat herpes virus infections.',
    drugClass: 'Antiviral',
    verified: true,
    brandNames: ['Famvir']
  },
  {
    id: '245',
    name: 'Emtricitabine/Tenofovir',
    genericName: 'Emtricitabine/Tenofovir disoproxil fumarate',
    manufacturer: 'Various',
    category: 'Antiviral',
    description: 'Combination of two antiretroviral medications used to treat and prevent HIV infection.',
    drugClass: 'Nucleoside reverse transcriptase inhibitor',
    verified: true,
    brandNames: ['Truvada']
  },
  
  // Additional Gastrointestinal medications
  {
    id: '246',
    name: 'Rabeprazole',
    genericName: 'Rabeprazole sodium',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor used to treat acid reflux and ulcers.',
    drugClass: 'Proton pump inhibitor',
    verified: true,
    brandNames: ['Aciphex', 'Pariet']
  },
  {
    id: '247',
    name: 'Dexlansoprazole',
    genericName: 'Dexlansoprazole',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor used to treat acid reflux.',
    drugClass: 'Proton pump inhibitor',
    verified: true,
    brandNames: ['Dexilant']
  },
  {
    id: '248',
    name: 'Ondansetron',
    genericName: 'Ondansetron hydrochloride',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Serotonin 5-HT3 receptor antagonist used to prevent nausea and vomiting.',
    drugClass: '5-HT3 receptor antagonist',
    verified: true,
    brandNames: ['Zofran', 'Zuplenz']
  },
  {
    id: '249',
    name: 'Loperamide',
    genericName: 'Loperamide hydrochloride',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Medication used to treat diarrhea.',
    drugClass: 'Antidiarrheal',
    verified: true,
    brandNames: ['Imodium']
  },
  {
    id: '250',
    name: 'Metoclopramide',
    genericName: 'Metoclopramide hydrochloride',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Medication used to treat nausea, vomiting, and gastroparesis.',
    drugClass: 'Dopamine antagonist',
    verified: true,
    brandNames: ['Reglan', 'Metozolv ODT']
  }
];

// This file can be expanded to include more medications as needed
