// Symptom to drug mapping utility
export interface Symptom {
  id: string;
  nameEn: string;
  nameHi: string;
  category: string;
  relatedDrugClasses: string[];
  relatedCategories: string[];
  keywords: string[];
}

export const symptoms: Symptom[] = [
  // Head & Mind Related
  {
    id: 'HEAD001',
    nameEn: 'Headache',
    nameHi: 'Sir dard',
    category: 'Head & Mind',
    relatedDrugClasses: ['Analgesic', 'NSAID', 'Anti-inflammatory'],
    relatedCategories: ['Pain Management', 'Central Nervous System'],
    keywords: ['pain', 'migraine', 'tension', 'cluster']
  },
  {
    id: 'HEAD002',
    nameEn: 'Dizziness',
    nameHi: 'Chakkar aana',
    category: 'Head & Mind',
    relatedDrugClasses: ['Antihistamine', 'Antivertigo'],
    relatedCategories: ['Central Nervous System', 'Cardiovascular'],
    keywords: ['vertigo', 'balance', 'spinning']
  },
  {
    id: 'HEAD003',
    nameEn: 'Fainting',
    nameHi: 'Behosh ho jaana',
    category: 'Head & Mind',
    relatedDrugClasses: ['Cardiovascular agents'],
    relatedCategories: ['Cardiovascular', 'Emergency'],
    keywords: ['syncope', 'unconscious', 'blackout']
  },
  {
    id: 'HEAD004',
    nameEn: 'Heaviness in head',
    nameHi: 'Dimag bhaari lagna',
    category: 'Head & Mind',
    relatedDrugClasses: ['Analgesic', 'Decongestant'],
    relatedCategories: ['Pain Management', 'Respiratory'],
    keywords: ['pressure', 'sinus', 'congestion']
  },
  {
    id: 'HEAD005',
    nameEn: 'Anxiety or nervousness',
    nameHi: 'Tension ya ghabrahat',
    category: 'Head & Mind',
    relatedDrugClasses: ['Anxiolytic', 'Benzodiazepine', 'SSRI'],
    relatedCategories: ['Central Nervous System', 'Psychiatry'],
    keywords: ['stress', 'panic', 'worry', 'fear']
  },
  {
    id: 'HEAD006',
    nameEn: 'Insomnia / sleeplessness',
    nameHi: 'Neend na aana',
    category: 'Head & Mind',
    relatedDrugClasses: ['Sedative', 'Hypnotic', 'Benzodiazepine'],
    relatedCategories: ['Central Nervous System'],
    keywords: ['sleep', 'insomnia', 'awake']
  },

  // Fever & General
  {
    id: 'FEVER001',
    nameEn: 'Fever',
    nameHi: 'Bukhar',
    category: 'Fever & General',
    relatedDrugClasses: ['Antipyretic', 'Analgesic', 'NSAID'],
    relatedCategories: ['Pain Management', 'Antibiotic', 'Antiviral'],
    keywords: ['temperature', 'pyrexia', 'hot']
  },
  {
    id: 'FEVER002',
    nameEn: 'Shivering',
    nameHi: 'Kamp-kampi hona',
    category: 'Fever & General',
    relatedDrugClasses: ['Antipyretic', 'Antibiotic'],
    relatedCategories: ['Antibiotic', 'Antiviral'],
    keywords: ['chills', 'shaking', 'tremor']
  },
  {
    id: 'FEVER003',
    nameEn: 'Tiredness / Fatigue',
    nameHi: 'Thakaan',
    category: 'Fever & General',
    relatedDrugClasses: ['Multivitamin', 'Iron supplement'],
    relatedCategories: ['Supplement', 'Vitamins and Minerals'],
    keywords: ['tired', 'exhausted', 'energy', 'lethargy']
  },
  {
    id: 'FEVER004',
    nameEn: 'Sweating',
    nameHi: 'Pasina aana',
    category: 'Fever & General',
    relatedDrugClasses: ['Antipyretic'],
    relatedCategories: ['Endocrine', 'Cardiovascular'],
    keywords: ['perspiration', 'sweat', 'night sweats']
  },
  {
    id: 'FEVER005',
    nameEn: 'Body ache',
    nameHi: 'Sharir dard',
    category: 'Fever & General',
    relatedDrugClasses: ['Analgesic', 'NSAID', 'Muscle relaxant'],
    relatedCategories: ['Pain Management', 'Musculoskeletal'],
    keywords: ['myalgia', 'muscle pain', 'soreness']
  },
  {
    id: 'FEVER006',
    nameEn: 'Weakness',
    nameHi: 'Kamzori',
    category: 'Fever & General',
    relatedDrugClasses: ['Multivitamin', 'Tonic'],
    relatedCategories: ['Supplement', 'Vitamins and Minerals'],
    keywords: ['weak', 'debility', 'frail']
  },

  // Stomach & Digestive
  {
    id: 'STOMACH001',
    nameEn: 'Stomach pain',
    nameHi: 'Pet dard',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Antacid', 'Antispasmodic', 'PPI'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['abdominal pain', 'cramps', 'belly ache']
  },
  {
    id: 'STOMACH002',
    nameEn: 'Gas / Bloating',
    nameHi: 'Gas hona',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Antiflatulent', 'Carminative'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['flatulence', 'wind', 'distension']
  },
  {
    id: 'STOMACH003',
    nameEn: 'Indigestion',
    nameHi: 'Ajeerna',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Digestive enzyme', 'Antacid'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['dyspepsia', 'upset stomach']
  },
  {
    id: 'STOMACH004',
    nameEn: 'Nausea',
    nameHi: 'Matli aana',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Antiemetic', 'Prokinetic'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['sick feeling', 'queasy']
  },
  {
    id: 'STOMACH005',
    nameEn: 'Vomiting',
    nameHi: 'Ulti hona',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Antiemetic', 'Prokinetic'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['emesis', 'throwing up', 'puke']
  },
  {
    id: 'STOMACH006',
    nameEn: 'Loose motion / Diarrhea',
    nameHi: 'Dast lagna',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Antidiarrheal', 'Probiotic', 'ORS'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['diarrhea', 'loose stools', 'watery stool']
  },
  {
    id: 'STOMACH007',
    nameEn: 'Constipation',
    nameHi: 'Kabj hona',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Laxative', 'Stool softener', 'Fiber supplement'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['hard stool', 'difficult bowel movement']
  },
  {
    id: 'STOMACH008',
    nameEn: 'Acidity / Heartburn',
    nameHi: 'Jalan hona',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Antacid', 'H2 blocker', 'PPI'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['acid reflux', 'GERD', 'burning']
  },
  {
    id: 'STOMACH009',
    nameEn: 'Loss of appetite',
    nameHi: 'Bhukh kam lagna',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Appetite stimulant', 'Digestive enzyme'],
    relatedCategories: ['Gastrointestinal', 'Supplement'],
    keywords: ['anorexia', 'no hunger']
  },
  {
    id: 'STOMACH010',
    nameEn: 'Abdominal bloating',
    nameHi: 'Pet fulna',
    category: 'Stomach & Digestive',
    relatedDrugClasses: ['Antiflatulent', 'Digestive enzyme'],
    relatedCategories: ['Gastrointestinal', 'Gastroenterology'],
    keywords: ['distension', 'swollen belly']
  },

  // Respiratory
  {
    id: 'RESP001',
    nameEn: 'Cough',
    nameHi: 'Khansi',
    category: 'Respiratory',
    relatedDrugClasses: ['Antitussive', 'Expectorant', 'Mucolytic'],
    relatedCategories: ['Respiratory'],
    keywords: ['dry cough', 'wet cough', 'productive']
  },
  {
    id: 'RESP002',
    nameEn: 'Cold',
    nameHi: 'Jukaam',
    category: 'Respiratory',
    relatedDrugClasses: ['Decongestant', 'Antihistamine', 'Analgesic'],
    relatedCategories: ['Respiratory', 'Antibiotic', 'Antiviral'],
    keywords: ['common cold', 'rhinitis', 'sneezing']
  },
  {
    id: 'RESP003',
    nameEn: 'Breathlessness',
    nameHi: 'Saans phoolna',
    category: 'Respiratory',
    relatedDrugClasses: ['Bronchodilator', 'Corticosteroid'],
    relatedCategories: ['Respiratory', 'Cardiovascular', 'Emergency'],
    keywords: ['dyspnea', 'shortness of breath', 'SOB']
  },
  {
    id: 'RESP004',
    nameEn: 'Chest burning',
    nameHi: 'Seene mein jalan',
    category: 'Respiratory',
    relatedDrugClasses: ['Antacid', 'PPI', 'H2 blocker'],
    relatedCategories: ['Gastrointestinal', 'Respiratory'],
    keywords: ['heartburn', 'chest pain', 'GERD']
  },
  {
    id: 'RESP005',
    nameEn: 'Chest pain',
    nameHi: 'Seene mein dard',
    category: 'Respiratory',
    relatedDrugClasses: ['Analgesic', 'Antianginal'],
    relatedCategories: ['Cardiovascular', 'Emergency', 'Pain Management'],
    keywords: ['angina', 'chest discomfort']
  },
  {
    id: 'RESP006',
    nameEn: 'Nasal congestion / Blocked nose',
    nameHi: 'Naak band hona',
    category: 'Respiratory',
    relatedDrugClasses: ['Decongestant', 'Nasal spray'],
    relatedCategories: ['Respiratory'],
    keywords: ['stuffy nose', 'congestion', 'blocked']
  },

  // Infections & Skin
  {
    id: 'SKIN001',
    nameEn: 'Itching',
    nameHi: 'Khaaj ya khujli',
    category: 'Infections & Skin',
    relatedDrugClasses: ['Antihistamine', 'Corticosteroid', 'Antipruritic'],
    relatedCategories: ['Dermatological', 'Allergy'],
    keywords: ['pruritus', 'itch', 'scratch']
  },
  {
    id: 'SKIN002',
    nameEn: 'Rashes / Pimples',
    nameHi: 'Dane nikalna',
    category: 'Infections & Skin',
    relatedDrugClasses: ['Antibiotic', 'Retinoid', 'Corticosteroid'],
    relatedCategories: ['Dermatological'],
    keywords: ['acne', 'spots', 'eruption']
  },
  {
    id: 'SKIN003',
    nameEn: 'Spots / Marks',
    nameHi: 'Daag dhabbey',
    category: 'Infections & Skin',
    relatedDrugClasses: ['Depigmenting agent', 'Retinoid'],
    relatedCategories: ['Dermatological'],
    keywords: ['pigmentation', 'blemish', 'scar']
  },
  {
    id: 'SKIN004',
    nameEn: 'Swelling',
    nameHi: 'Sujan',
    category: 'Infections & Skin',
    relatedDrugClasses: ['Anti-inflammatory', 'NSAID', 'Corticosteroid'],
    relatedCategories: ['Pain Management', 'Dermatological'],
    keywords: ['edema', 'inflammation', 'puffiness']
  },
  {
    id: 'SKIN005',
    nameEn: 'Blisters',
    nameHi: 'Chhaley padna',
    category: 'Infections & Skin',
    relatedDrugClasses: ['Antiviral', 'Antibiotic', 'Antiseptic'],
    relatedCategories: ['Dermatological', 'Antiviral'],
    keywords: ['vesicles', 'burns', 'herpes']
  },
  {
    id: 'SKIN006',
    nameEn: 'Wound / Injury',
    nameHi: 'Zakhm ya ghaav',
    category: 'Infections & Skin',
    relatedDrugClasses: ['Antiseptic', 'Antibiotic', 'Wound healing agent'],
    relatedCategories: ['Dermatological', 'Emergency'],
    keywords: ['cut', 'abrasion', 'laceration', 'trauma']
  },

  // Joints & Muscles
  {
    id: 'JOINT001',
    nameEn: 'Knee pain',
    nameHi: 'Ghutno mein dard',
    category: 'Joints & Muscles',
    relatedDrugClasses: ['NSAID', 'Analgesic', 'Chondroprotective'],
    relatedCategories: ['Pain Management', 'Musculoskeletal'],
    keywords: ['arthritis', 'joint pain', 'osteoarthritis']
  },
  {
    id: 'JOINT002',
    nameEn: 'Back pain',
    nameHi: 'Kamar dard',
    category: 'Joints & Muscles',
    relatedDrugClasses: ['NSAID', 'Muscle relaxant', 'Analgesic'],
    relatedCategories: ['Pain Management', 'Musculoskeletal'],
    keywords: ['lumbar pain', 'backache', 'lower back']
  },
  {
    id: 'JOINT003',
    nameEn: 'Neck pain',
    nameHi: 'Gardhan dard',
    category: 'Joints & Muscles',
    relatedDrugClasses: ['NSAID', 'Muscle relaxant', 'Analgesic'],
    relatedCategories: ['Pain Management', 'Musculoskeletal'],
    keywords: ['cervical pain', 'neck ache', 'stiff neck']
  },
  {
    id: 'JOINT004',
    nameEn: 'Shoulder pain',
    nameHi: 'Kandhe ka dard',
    category: 'Joints & Muscles',
    relatedDrugClasses: ['NSAID', 'Analgesic', 'Corticosteroid'],
    relatedCategories: ['Pain Management', 'Musculoskeletal'],
    keywords: ['frozen shoulder', 'shoulder ache']
  },
  {
    id: 'JOINT005',
    nameEn: 'Limb pain',
    nameHi: 'Haath pair dard',
    category: 'Joints & Muscles',
    relatedDrugClasses: ['NSAID', 'Analgesic'],
    relatedCategories: ['Pain Management', 'Musculoskeletal'],
    keywords: ['arm pain', 'leg pain', 'extremity pain']
  },
  {
    id: 'JOINT006',
    nameEn: 'Joint swelling/pain',
    nameHi: 'Sujan ya jod dard',
    category: 'Joints & Muscles',
    relatedDrugClasses: ['NSAID', 'Corticosteroid', 'DMARD'],
    relatedCategories: ['Pain Management', 'Musculoskeletal', 'Immunology'],
    keywords: ['arthritis', 'inflammatory', 'rheumatoid']
  },
  {
    id: 'JOINT007',
    nameEn: 'Muscle cramp',
    nameHi: 'Muscle khichna',
    category: 'Joints & Muscles',
    relatedDrugClasses: ['Muscle relaxant', 'Magnesium supplement'],
    relatedCategories: ['Musculoskeletal', 'Supplement'],
    keywords: ['spasm', 'cramping', 'muscle spasm']
  },

  // Eye, Ear, Nose, Throat
  {
    id: 'ENT001',
    nameEn: 'Eye pain',
    nameHi: 'Aankh dard',
    category: 'Eye, Ear, Nose, Throat',
    relatedDrugClasses: ['Ophthalmic NSAID', 'Antibiotic eye drops'],
    relatedCategories: ['Ophthalmology'],
    keywords: ['ocular pain', 'eye ache']
  },
  {
    id: 'ENT002',
    nameEn: 'Watery eyes',
    nameHi: 'Aankhon se paani aana',
    category: 'Eye, Ear, Nose, Throat',
    relatedDrugClasses: ['Antihistamine', 'Decongestant eye drops'],
    relatedCategories: ['Ophthalmology', 'Allergy'],
    keywords: ['tearing', 'lacrimation', 'epiphora']
  },
  {
    id: 'ENT003',
    nameEn: 'Red eyes',
    nameHi: 'Aankh lal hona',
    category: 'Eye, Ear, Nose, Throat',
    relatedDrugClasses: ['Antibiotic eye drops', 'Antihistamine eye drops'],
    relatedCategories: ['Ophthalmology'],
    keywords: ['conjunctivitis', 'pink eye', 'bloodshot']
  },
  {
    id: 'ENT004',
    nameEn: 'Ear pain',
    nameHi: 'Kaan dard',
    category: 'Eye, Ear, Nose, Throat',
    relatedDrugClasses: ['Analgesic', 'Antibiotic ear drops'],
    relatedCategories: ['Antibiotic', 'Pain Management'],
    keywords: ['otalgia', 'ear ache', 'otitis']
  },
  {
    id: 'ENT005',
    nameEn: 'Blocked ear',
    nameHi: 'Kaan band hona',
    category: 'Eye, Ear, Nose, Throat',
    relatedDrugClasses: ['Decongestant', 'Ear wax softener'],
    relatedCategories: ['Otolaryngology'],
    keywords: ['ear congestion', 'clogged ear']
  },
  {
    id: 'ENT006',
    nameEn: 'Sore throat',
    nameHi: 'Gala kharab',
    category: 'Eye, Ear, Nose, Throat',
    relatedDrugClasses: ['Analgesic', 'Antibiotic', 'Antiseptic'],
    relatedCategories: ['Respiratory', 'Antibiotic'],
    keywords: ['pharyngitis', 'throat pain', 'strep throat']
  },
  {
    id: 'ENT007',
    nameEn: 'Throat irritation or pain',
    nameHi: 'Gale mein jalan / dard',
    category: 'Eye, Ear, Nose, Throat',
    relatedDrugClasses: ['Analgesic', 'Antiseptic throat spray', 'Demulcent'],
    relatedCategories: ['Respiratory'],
    keywords: ['throat burn', 'irritation', 'scratchiness']
  },
  {
    id: 'ENT008',
    nameEn: 'Runny nose',
    nameHi: 'Naak behna',
    category: 'Eye, Ear, Nose, Throat',
    relatedDrugClasses: ['Antihistamine', 'Decongestant'],
    relatedCategories: ['Respiratory', 'Allergy'],
    keywords: ['rhinorrhea', 'nasal discharge', 'dripping']
  },

  // Other Common Symptoms
  {
    id: 'OTHER001',
    nameEn: 'Palpitations / Fast heartbeat',
    nameHi: 'Dil dhadakna tez hona',
    category: 'Other Common Symptoms',
    relatedDrugClasses: ['Beta blocker', 'Antiarrhythmic'],
    relatedCategories: ['Cardiovascular'],
    keywords: ['tachycardia', 'rapid heartbeat', 'racing heart']
  },
  {
    id: 'OTHER002',
    nameEn: 'Burning while urinating',
    nameHi: 'Peshab mein jalan',
    category: 'Other Common Symptoms',
    relatedDrugClasses: ['Antibiotic', 'Urinary alkalizer'],
    relatedCategories: ['Urology', 'Antibiotic'],
    keywords: ['dysuria', 'UTI', 'urinary tract infection']
  },
  {
    id: 'OTHER003',
    nameEn: 'Frequent urination',
    nameHi: 'Bar-bar peshab aana',
    category: 'Other Common Symptoms',
    relatedDrugClasses: ['Anticholinergic', 'Alpha blocker'],
    relatedCategories: ['Urology', 'Endocrine'],
    keywords: ['polyuria', 'urinary frequency', 'overactive bladder']
  },
  {
    id: 'OTHER004',
    nameEn: 'Swelling in hands/feet',
    nameHi: 'Haath pair sujan',
    category: 'Other Common Symptoms',
    relatedDrugClasses: ['Diuretic', 'Anti-inflammatory'],
    relatedCategories: ['Cardiovascular', 'Pain Management'],
    keywords: ['edema', 'peripheral edema', 'puffiness']
  },
  {
    id: 'OTHER005',
    nameEn: 'Facial puffiness',
    nameHi: 'Chehre par sujan',
    category: 'Other Common Symptoms',
    relatedDrugClasses: ['Diuretic', 'Antihistamine'],
    relatedCategories: ['Cardiovascular', 'Allergy'],
    keywords: ['facial edema', 'swollen face', 'puffiness']
  },
  {
    id: 'OTHER006',
    nameEn: 'Feeling cold',
    nameHi: 'Thand lagna',
    category: 'Other Common Symptoms',
    relatedDrugClasses: ['Thyroid hormone', 'Iron supplement'],
    relatedCategories: ['Endocrine', 'Supplement'],
    keywords: ['chills', 'cold intolerance', 'hypothermia']
  },
  {
    id: 'OTHER007',
    nameEn: 'No sweating',
    nameHi: 'Pasina na aana',
    category: 'Other Common Symptoms',
    relatedDrugClasses: ['Thyroid hormone'],
    relatedCategories: ['Endocrine', 'Dermatological'],
    keywords: ['anhidrosis', 'no perspiration', 'dry skin']
  }
];

export const symptomCategories = [
  {
    icon: 'HEAD',
    title: 'Head & Mind Related',
    symptoms: symptoms.filter(s => s.category === 'Head & Mind')
  },
  {
    icon: 'FEVER',
    title: 'Fever & General',
    symptoms: symptoms.filter(s => s.category === 'Fever & General')
  },
  {
    icon: 'DIGESTIVE',
    title: 'Stomach & Digestive',
    symptoms: symptoms.filter(s => s.category === 'Stomach & Digestive')
  },
  {
    icon: 'RESPIRATORY',
    title: 'Respiratory',
    symptoms: symptoms.filter(s => s.category === 'Respiratory')
  },
  {
    icon: 'SKIN',
    title: 'Infections & Skin',
    symptoms: symptoms.filter(s => s.category === 'Infections & Skin')
  },
  {
    icon: 'JOINTS',
    title: 'Joints & Muscles',
    symptoms: symptoms.filter(s => s.category === 'Joints & Muscles')
  },
  {
    icon: 'ENT',
    title: 'Eye, Ear, Nose, Throat',
    symptoms: symptoms.filter(s => s.category === 'Eye, Ear, Nose, Throat')
  },
  {
    icon: 'OTHER',
    title: 'Other Common Symptoms',
    symptoms: symptoms.filter(s => s.category === 'Other Common Symptoms')
  }
];
