// Utility functions for converting medical terminology to layman's terms
// This helps maintain consistency across all drug explanations

export const medicalToLaymanTerms: Record<string, string> = {
  // General medical terms
  'hypersensitivity': 'allergic reaction',
  'contraindications': 'when you should NOT use this medicine',
  'mechanism': 'how this medicine works',
  'hepatotoxicity': 'liver damage',
  'nephrotoxicity': 'kidney damage',
  'cardiotoxicity': 'heart damage',
  'neurotoxicity': 'nerve damage',
  'ototoxicity': 'hearing damage',
  'thrombocytopenia': 'low blood platelet count (affects blood clotting)',
  'hemolysis': 'breakdown of red blood cells',
  'anemia': 'low red blood cell count',
  'leukopenia': 'low white blood cell count',
  'neutropenia': 'low infection-fighting white blood cells',
  'agranulocytosis': 'dangerously low white blood cell count',
  'pancytopenia': 'low counts of all blood cells',
  
  // Cardiovascular terms
  'arrhythmias': 'irregular heartbeat',
  'bradycardia': 'slow heart rate',
  'tachycardia': 'fast heart rate',
  'hypertension': 'high blood pressure',
  'hypotension': 'low blood pressure',
  'cardiomyopathy': 'heart muscle disease',
  'qt prolongation': 'changes in heart rhythm that can be dangerous',
  
  // Gastrointestinal terms
  'nausea': 'feeling sick to your stomach',
  'emesis': 'vomiting',
  'diarrhea': 'loose or watery stools',
  'constipation': 'difficulty having bowel movements',
  'dyspepsia': 'indigestion or stomach upset',
  'gastritis': 'stomach lining inflammation',
  'hepatitis': 'liver inflammation',
  
  // Neurological terms
  'seizures': 'fits or convulsions',
  'tremor': 'shaking',
  'ataxia': 'loss of coordination',
  'paresthesia': 'tingling or numbness',
  'vertigo': 'spinning dizziness',
  'somnolence': 'excessive sleepiness',
  'insomnia': 'trouble sleeping',
  'confusion': 'difficulty thinking clearly',
  'hallucinations': 'seeing or hearing things that aren\'t there',
  
  // Respiratory terms
  'dyspnea': 'shortness of breath',
  'bronchospasm': 'tightening of airways',
  'cough': 'persistent coughing',
  'rhinitis': 'runny or stuffy nose',
  
  // Skin terms
  'rash': 'skin irritation or red patches',
  'urticaria': 'hives or itchy bumps',
  'pruritus': 'itching',
  'photosensitivity': 'increased sensitivity to sunlight',
  'alopecia': 'hair loss',
  
  // Pregnancy categories
  'category a': 'Studies show no risk to the baby',
  'category b': 'Generally considered safe during pregnancy',
  'category c': 'Use only if benefits outweigh potential risks',
  'category d': 'May harm the baby - avoid during pregnancy',
  'category x': 'Dangerous to unborn babies - never use during pregnancy',
  
  // Drug interactions
  'cyp1a2': 'a liver enzyme that breaks down caffeine and other medicines',
  'cyp2c9': 'a liver enzyme that breaks down medicines',
  'cyp2c19': 'a liver enzyme that breaks down several types of medicines',
  'cyp2d6': 'a liver enzyme that breaks down many common medicines',
  'cyp3a4': 'a liver enzyme that breaks down over half of all medicines',
  'cyp1a2 inhibitor': 'medicine that blocks the CYP1A2 liver enzyme, increasing other drug effects',
  'cyp1a2 inducers': 'medicines that can decrease this drug\'s effects via the CYP1A2 enzyme',
  'cyp1a2 inhibitors': 'medicines that can increase this drug\'s effects via the CYP1A2 enzyme',
  'cyp2c9 inhibitor': 'medicine that blocks the CYP2C9 liver enzyme, increasing other drug effects',
  'cyp2c9 inducers': 'medicines that can decrease this drug\'s effects via the CYP2C9 enzyme',
  'cyp2c9 inhibitors': 'medicines that can increase this drug\'s effects via the CYP2C9 enzyme',
  'cyp2c19 inhibitor': 'medicine that blocks the CYP2C19 liver enzyme, increasing other drug effects',
  'cyp2c19 inducers': 'medicines that can decrease this drug\'s effects via the CYP2C19 enzyme',
  'cyp2c19 inhibitors': 'medicines that can increase this drug\'s effects via the CYP2C19 enzyme',
  'cyp2d6 inhibitor': 'medicine that blocks the CYP2D6 liver enzyme, increasing other drug effects',
  'cyp2d6 inducers': 'medicines that can decrease this drug\'s effects via the CYP2D6 enzyme',
  'cyp2d6 inhibitors': 'medicines that can increase this drug\'s effects via the CYP2D6 enzyme',
  'cyp3a4 inhibitors': 'medicines that can increase this drug\'s effects',
  'cyp3a4 inducers': 'medicines that can decrease this drug\'s effects',
  'anticoagulants': 'blood thinning medicines',
  'antacids': 'stomach acid reducers',
  
  // Administration terms
  'oral': 'by mouth',
  'intravenous': 'through a vein (IV)',
  'intramuscular': 'injected into muscle',
  'subcutaneous': 'injected under the skin',
  'topical': 'applied to the skin',
  'sublingual': 'under the tongue',
  'loading dose': 'first higher dose to get medicine working quickly',
  'maintenance dose': 'regular dose to keep medicine working',
  
  // Storage terms
  'room temperature': 'normal indoor temperature (68-77°F)',
  'refrigerate': 'keep in the refrigerator (36-46°F)',
  'protect from light': 'keep in original container away from bright light',
  'protect from moisture': 'keep dry, don\'t store in bathroom',

  // Common comorbidities and conditions
  'renal impairment': 'reduced kidney function',
  'hepatic impairment': 'reduced liver function',
  'diabetes': 'high blood sugar condition',
  'heart failure': 'condition where the heart doesn\'t pump blood well',
  'myocardial infarction': 'heart attack',
  'stroke': 'brain attack, when blood flow to the brain is cut off',
  'epilepsy': 'seizure disorder',
  'glaucoma': 'eye condition that can cause blindness',
  'gout': 'a type of arthritis causing sudden, severe joint pain',
  'obesity': 'being very overweight',
  'hyperlipidemia': 'high cholesterol',
  'osteoporosis': 'weak and brittle bones',
  'arthritis': 'joint inflammation and pain',
  'depression': 'a mood disorder causing persistent sadness',
  'anxiety': 'a mental health condition causing excessive worry',

  // Specific medical conditions and terms that need simplification
  'shingles': 'painful rash caused by the chickenpox virus',
  'genital herpes': 'sexually transmitted infection causing sores',
  'cold sores': 'painful blisters around the mouth',
  'thrombotic thrombocytopenic purpura': 'rare blood disorder causing clots',
  'hemolytic anemia': 'condition where red blood cells are destroyed too quickly',
  'neuropsychiatric reactions': 'mental health and nervous system side effects',
  'g6pd deficiency': 'genetic condition affecting red blood cells',
  'methemoglobinemia': 'blood disorder affecting oxygen transport',
  'esophageal irritation': 'throat irritation',
  'vaginal candidiasis': 'yeast infections in women',
  'porphyria': 'rare blood disorder',
  'retinal toxicity': 'eye damage affecting vision',
  'blood dyscrasias': 'blood disorders',
  'megaloblastic anemia': 'type of anemia caused by vitamin deficiency',
  'folate deficiency': 'lack of folic acid (a B vitamin)',
  'systemic lupus erythematosus': 'autoimmune disease',
  'clostridioides difficile colitis': 'serious intestinal infection',
  'cholestatic jaundice': 'liver condition causing yellowing of skin',
  'antibiotic-associated colitis': 'intestinal inflammation from antibiotics',
  'ergot alkaloids': 'medicines for migraines',
  'neuromuscular blocking agents': 'medicines used during surgery',
  'lincosamides': 'type of antibiotic',
  'macrolides': 'type of antibiotic',
  'tetracyclines': 'type of antibiotic',
  'sulfonamides': 'type of antibiotic',
  'folate antagonists': 'medicines that block folic acid',
  'dna replication': 'genetic material copying process',
  'ribosomal subunit': 'part of cell machinery that makes proteins',
  'mitochondrial function': 'cellular energy production',
  'reactive oxygen species': 'harmful substances that damage cells',
  
  // Antimalarial-specific terms
  'plasmodium': 'malaria parasite',
  'p. falciparum': 'the most dangerous type of malaria parasite',
  'p. vivax': 'a type of malaria parasite that can hide in the liver',
  'p. ovale': 'a type of malaria parasite that can hide in the liver',
  'p. malariae': 'a type of malaria parasite',
  'falciparum': 'the most dangerous type of malaria parasite',
  'vivax': 'a type of malaria parasite that can hide in the liver',
  'ovale': 'a type of malaria parasite that can hide in the liver',
  'malariae': 'a type of malaria parasite',
  'artemisinin': 'natural antimalarial medicine from a plant',
  'artemisinin derivative': 'medicine made from artemisinin plant compound',
  'artemisinin combination therapy': 'treatment using two antimalarial medicines together',
  'quinoline': 'type of antimalarial medicine',
  'chloroquine-resistant': 'malaria that doesn\'t respond to chloroquine medicine',
  'chloroquine-sensitive': 'malaria that responds well to chloroquine medicine',
  'cinchonism': 'side effects from quinine including ringing in ears, headache, and nausea',
  'hemozoin': 'waste product made by malaria parasites',
  'schizonticide': 'medicine that kills malaria parasites in blood',
  'gametocytocidal': 'medicine that kills malaria parasites that spread to mosquitoes',
  'hypnozoite': 'sleeping malaria parasite in the liver',
  'relapse': 'malaria coming back after treatment',
  'radical cure': 'treatment that completely eliminates malaria parasites from the body',
  'prophylaxis': 'prevention treatment',
  'chemoprophylaxis': 'using medicine to prevent disease',
  'intermittent preventive treatment': 'taking medicine occasionally to prevent malaria',
  'uncomplicated malaria': 'malaria without serious complications',
  'severe malaria': 'life-threatening malaria requiring immediate treatment',
  'cerebral malaria': 'malaria affecting the brain',
  'complicated malaria': 'malaria with serious complications',
  'blackwater fever': 'serious complication of malaria causing dark urine',
  'parasite clearance': 'elimination of malaria parasites from the blood',
  'antimalarial activity': 'ability to fight malaria parasites',
  'dihydrofolate reductase': 'enzyme that malaria parasites need to survive',
  'dihydropteroate synthase': 'enzyme that malaria parasites need to make folic acid',
  'electron transport': 'process malaria parasites use to make energy',
  'mitochondrial electron transport': 'energy-making process in parasite cells',
  'heme detoxification': 'how malaria parasites process iron from blood',
  'free radicals': 'harmful substances that damage parasite proteins',
  
  // Antiviral-specific terms
  'neuraminidase': 'protein that flu viruses use to escape from infected cells',
  'neuraminidase inhibitor': 'medicine that blocks the protein flu viruses need to spread',
  'polymerase': 'protein that viruses use to copy their genetic material',
  'dna polymerase': 'protein that viruses use to copy their DNA (genetic material)',
  'rna polymerase': 'protein that viruses use to copy their RNA (genetic material)',
  'viral dna polymerase': 'protein that viruses use to copy their DNA',
  'viral rna polymerase': 'protein that viruses use to copy their RNA',
  'reverse transcriptase': 'protein that HIV uses to copy its genetic material',
  'prodrug': 'inactive medicine that becomes active after your body processes it',
  'nucleoside': 'building block of genetic material (DNA/RNA)',
  'nucleoside analog': 'fake building block that tricks viruses and stops them from copying',
  'nucleoside analogue': 'fake building block that tricks viruses and stops them from copying',
  'dual nucleoside analog': 'combination of two fake building blocks that stop viruses',
  'lactic acidosis': 'dangerous buildup of acid in the blood',
  'hepatomegaly': 'enlarged liver',
  'creatinine clearance': 'measure of how well your kidneys are working',
  'pre-exposure prophylaxis': 'taking medicine before exposure to prevent HIV infection',
  'prep': 'taking medicine before exposure to prevent HIV infection',
  'teratogenicity': 'ability to cause birth defects',
  'teratogenic': 'can cause birth defects',
  'autoimmune': 'when your immune system attacks your own body',
  'autoimmune hepatitis': 'when your immune system attacks your liver',
  'rsv': 'respiratory syncytial virus - a common lung infection in babies',
  'respiratory syncytial virus': 'common lung infection that can be serious in babies',
  'viral hemorrhagic fevers': 'deadly viral infections that cause severe bleeding',
  'mrna capping': 'process viruses use to protect their genetic messages',
  'elongation': 'process of building genetic material (DNA/RNA)',
  'dna chain elongation': 'process of building DNA genetic material',
  'viral dna synthesis': 'how viruses make copies of their genetic material',
  'viral replication': 'how viruses make copies of themselves',
  'penciclovir': 'antiviral medicine that stops herpes viruses from copying',
  'herpes zoster': 'shingles - painful rash caused by the chickenpox virus',
  'herpes simplex': 'virus that causes cold sores and genital herpes',
  'varicella zoster': 'virus that causes chickenpox and shingles',
  'herpes encephalitis': 'serious brain infection caused by herpes virus',
  'neonatal herpes': 'herpes infection in newborn babies',
  'herpes labialis': 'cold sores around the mouth',
  'recurrent herpes': 'herpes outbreaks that keep coming back',
  'chronic hepatitis b': 'long-term liver infection with hepatitis B virus',
  'chronic hepatitis c': 'long-term liver infection with hepatitis C virus',
  'liver inflammation': 'swelling and irritation of the liver',
  'lamivudine-resistant': 'hepatitis B virus that doesn\'t respond to lamivudine medicine',
  'hiv resistance': 'when HIV virus becomes resistant to medicines',
  'undiagnosed hiv': 'having HIV infection without knowing it',
  'copd': 'chronic obstructive pulmonary disease - lung disease that makes breathing hard',
  'asthma': 'lung condition that causes breathing problems',
  'neuropsychiatric events': 'mental health and nervous system side effects',
  'antiretroviral': 'medicine that fights HIV virus',
  'antiretrovirals': 'medicines that fight HIV virus',
  'nephrotoxic drugs': 'medicines that can harm the kidneys',
  'didanosine': 'HIV medicine (also called ddI)',
  'atazanavir': 'HIV medicine',
  'lopinavir/ritonavir': 'combination HIV medicine',
  'zidovudine': 'HIV medicine (also called AZT)',
  'bone density loss': 'thinning of bones that makes them weak',
  'hepatitis b exacerbation': 'worsening of hepatitis B infection',
  'galactose intolerance': 'inability to process galactose (a type of sugar)',
  'integrase': 'protein that HIV uses to insert its genetic material into cells',
  'integrase inhibitor': 'medicine that blocks HIV from inserting its genetic material',
  'ugt1a1 inducers': 'medicines that speed up liver processing of other drugs',
  'carbamazepine': 'seizure medicine',
  'oxcarbazepine': 'seizure medicine',
  'phenytoin': 'seizure medicine',
  'rifampin': 'antibiotic medicine',
  'hypersensitivity reactions': 'severe allergic reactions',
  'depressive disorders': 'depression and mood problems',
  'non-nucleoside reverse transcriptase inhibitor': 'type of HIV medicine that blocks virus copying',
  'treatment-naive': 'people who have never taken HIV medicines before',
  'proton pump inhibitors': 'strong stomach acid reducing medicines',
  'h2 antagonists': 'stomach acid reducing medicines (like Pepcid)',
  'h2 blockers': 'stomach acid reducing medicines (like Pepcid)',
  'rifamycins': 'type of antibiotic (like rifampin)',
  'anticonvulsants': 'seizure medicines',
  
  // Additional terms from recent drug explanations
  'antimalarial': 'medicine that prevents or treats malaria',
  'antimalarial prophylaxis': 'taking medicine to prevent malaria',
  'chloroquine resistance': 'when malaria parasites don\'t respond to chloroquine medicine',
  'mefloquine': 'antimalarial medicine that can prevent and treat malaria',
  'atovaquone': 'antimalarial medicine that stops parasites from making energy',
  'proguanil': 'antimalarial medicine that blocks parasite growth',
  'doxycycline': 'antibiotic that can also prevent malaria',
  'oseltamivir': 'antiviral medicine for flu (brand name Tamiflu)',
  'tamiflu': 'brand name for oseltamivir, a flu medicine',
  'influenza': 'flu virus infection',
  'valacyclovir': 'antiviral medicine for herpes infections',
  'famciclovir': 'antiviral medicine for herpes and shingles',
  'emtricitabine': 'HIV medicine that blocks virus copying',
  'tenofovir': 'HIV medicine that blocks virus copying',
  'prep medication': 'medicine taken to prevent HIV infection',
  'hiv prevention': 'using medicine to prevent HIV infection',
  'rabeprazole': 'proton pump inhibitor that reduces stomach acid',
  'dexlansoprazole': 'proton pump inhibitor that reduces stomach acid',
  'proton pump': 'stomach cells that make acid',
  'gastroesophageal reflux': 'stomach acid backing up into the throat',
  'gerd': 'gastroesophageal reflux disease - chronic acid reflux',
  'peptic ulcer': 'sore in the stomach or intestine lining',
  'helicobacter pylori': 'bacteria that can cause stomach ulcers',
  'h. pylori': 'bacteria that can cause stomach ulcers',
  'zollinger-ellison syndrome': 'rare condition causing too much stomach acid',
  'ondansetron': 'anti-nausea medicine (brand name Zofran)',
  'zofran': 'brand name for ondansetron, an anti-nausea medicine',
  'serotonin receptors': 'brain chemicals that control nausea and vomiting',
  '5-ht3 receptors': 'brain receptors that trigger nausea and vomiting',
  'chemotherapy-induced nausea': 'nausea caused by cancer treatment',
  'postoperative nausea': 'nausea after surgery',
  'loperamide': 'anti-diarrheal medicine (brand name Imodium)',
  'imodium': 'brand name for loperamide, an anti-diarrheal medicine',
  'opioid receptors': 'brain receptors that control pain and bowel movements',
  'intestinal motility': 'movement of food through the intestines',
  'acute diarrhea': 'sudden onset of loose, watery stools',
  'chronic diarrhea': 'long-term loose, watery stools',
  'metoclopramide': 'medicine for nausea and stomach problems',
  'reglan': 'brand name for metoclopramide',
  'dopamine receptors': 'brain chemicals that control movement and nausea',
  'gastroparesis': 'condition where stomach empties too slowly',
  'gastric emptying': 'movement of food from stomach to intestines',
  'tardive dyskinesia': 'serious movement disorder from long-term medicine use',
  'extrapyramidal symptoms': 'movement problems caused by certain medicines',
  'dystonia': 'involuntary muscle contractions',
  'akathisia': 'feeling of restlessness and need to move',
  'parkinsonism': 'movement problems similar to Parkinson\'s disease',
  'immune reconstitution syndrome': 'immune system recovery that can cause inflammation'
};

export const simplifyMedicalTerm = (term: string): string => {
  const lowerTerm = term.toLowerCase().trim();
  return medicalToLaymanTerms[lowerTerm] || term;
};

export const createLaymanExplanation = {
  mechanism: (professionalText: string): string => {
    return `This medicine works by ${professionalText.toLowerCase().replace(/^[A-Z]/, match => match.toLowerCase())}`;
  },
  
  sideEffect: (effect: string): string => {
    const simplified = simplifyMedicalTerm(effect);
    return simplified.charAt(0).toUpperCase() + simplified.slice(1);
  },
  
  contraindication: (condition: string): string => {
    const simplified = simplifyMedicalTerm(condition);
    if (simplified.startsWith('hypersensitivity')) {
      return 'You are allergic to this medicine or its ingredients';
    }
    return `You have ${simplified}`;
  },
  
  indication: (condition: string): string => {
    return condition.toLowerCase().replace(/^treatment of |^prevention of /, '');
  },
  
  warning: (warningText: string): string => {
    const simplified = simplifyMedicalTerm(warningText);
    return `Be careful: ${simplified}`;
  },
  
  dosage: (professionalDosage: string): string => {
    return professionalDosage
      .replace(/oral:/i, 'Take by mouth:')
      .replace(/iv:/i, 'Given through IV:')
      .replace(/mg/g, 'milligrams')
      .replace(/ml/g, 'milliliters')
      .replace(/bid/gi, 'twice daily')
      .replace(/tid/gi, 'three times daily')
      .replace(/qid/gi, 'four times daily')
      .replace(/qd/gi, 'once daily');
  },
  
  pregnancy: (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('category a')) {
      return 'Safe to use during pregnancy - studies show no risk to baby';
    } else if (lowerCategory.includes('category b')) {
      return 'Generally safe during pregnancy - no known risks';
    } else if (lowerCategory.includes('category c')) {
      return 'Use only if your doctor says benefits outweigh risks';
    } else if (lowerCategory.includes('category d')) {
      return 'May harm your baby - avoid during pregnancy';
    } else if (lowerCategory.includes('category x')) {
      return 'Dangerous to unborn babies - never use during pregnancy';
    }
    return category;
  },
  
  storage: (storageInstructions: string): string => {
    return storageInstructions
      .replace(/store at room temperature/i, 'Keep at normal room temperature (68-77°F)')
      .replace(/protect from light/i, 'keep away from bright light')
      .replace(/protect from moisture/i, 'keep dry - don\'t store in bathroom')
      .replace(/refrigerate/i, 'keep in refrigerator');
  }
};

type LaymanDrugInput = {
  description?: string;
  mechanism?: string;
  indications?: string[];
  contraindications?: string[];
  sideEffects?: string[];
  interactions?: string[];
  dosageAndAdmin?: string;
  warnings?: string[];
  pregnancy?: string;
  storage?: string;
};

// Helper function to generate complete layman explanations for a drug
export const generateLaymanExplanations = (drug: LaymanDrugInput) => {
  return {
    description: drug.description ? 
      `This medicine is used to ${drug.description.toLowerCase().replace(/^medication used to |^drug used to /, '')}` : 
      undefined,
    
    mechanism: drug.mechanism ? 
      createLaymanExplanation.mechanism(drug.mechanism) : 
      undefined,
    
    indications: drug.indications?.map((indication: string) => 
      createLaymanExplanation.indication(indication)
    ),
    
    contraindications: drug.contraindications?.map((contra: string) => 
      createLaymanExplanation.contraindication(contra)
    ),
    
    sideEffects: drug.sideEffects?.map((effect: string) => 
      createLaymanExplanation.sideEffect(effect)
    ),
    
    interactions: drug.interactions?.map((interaction: string) => 
      `May interact with ${simplifyMedicalTerm(interaction)}`
    ),
    
    dosageAndAdmin: drug.dosageAndAdmin ? 
      createLaymanExplanation.dosage(drug.dosageAndAdmin) : 
      undefined,
    
    warnings: drug.warnings?.map((warning: string) => 
      createLaymanExplanation.warning(warning)
    ),
    
    pregnancy: drug.pregnancy ? 
      createLaymanExplanation.pregnancy(drug.pregnancy) : 
      undefined,
    
    storage: drug.storage ? 
      createLaymanExplanation.storage(drug.storage) : 
      undefined
  };
};
