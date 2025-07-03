// SEO metadata for PharmaLens application

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  structuredData?: object;
}

// Homepage SEO metadata
export const homepageSEO: SEOMetadata = {
  title: "PharmaLens - Complete Drug Information Database | Medicine Details & Drug Interactions",
  description: "Comprehensive drug information database with 800+ medications. Search for drug details, interactions, side effects, dosages, and contraindications. Your trusted pharmaceutical reference.",
  keywords: [
    "drug information",
    "medicine database",
    "pharmaceutical reference",
    "drug interactions",
    "medication details",
    "prescription drugs",
    "drug side effects",
    "dosage information",
    "contraindications",
    "drug search",
    "pharmacy reference",
    "medical information",
    "drug guide",
    "medication guide",
    "pharmalens"
  ],
  ogTitle: "PharmaLens - Your Complete Drug Information Resource",
  ogDescription: "Search 800+ medications for complete drug information, interactions, and safety data. Trusted by healthcare professionals and patients.",
  ogImage: "/images/pharmalens-og-image.jpg",
  twitterCard: "summary_large_image",
  structuredData: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PharmaLens",
    "description": "Comprehensive drug information database",
    "url": "https://pharmalens.tech",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://pharmalens.tech/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PharmaLens",
      "url": "https://pharmalens.tech"
    }
  }
};

// Search page SEO metadata
export const searchPageSEO: SEOMetadata = {
  title: "Drug Search - Find Medication Information | PharmaLens",
  description: "Search our comprehensive database of 800+ medications. Find drug information, interactions, side effects, dosages, and safety data instantly.",
  keywords: [
    "drug search",
    "medicine finder",
    "medication search",
    "pharmaceutical search",
    "drug database search",
    "find medication",
    "drug lookup",
    "medicine information",
    "prescription search"
  ]
};

// Category page SEO metadata templates
export const categoryPageSEO = {
  "Pain Management": {
    title: "Pain Management Drugs - Complete Information | PharmaLens",
    description: "Comprehensive information on pain management medications including NSAIDs, opioids, and analgesics. Find dosages, side effects, and interactions.",
    keywords: [
      "pain management drugs",
      "pain relief medication",
      "analgesics",
      "NSAIDs",
      "opioids",
      "ibuprofen",
      "acetaminophen",
      "aspirin",
      "naproxen",
      "tramadol",
      "morphine",
      "codeine"
    ]
  },
  "Cardiovascular": {
    title: "Cardiovascular Drugs - Heart Medication Information | PharmaLens",
    description: "Complete guide to cardiovascular medications including blood pressure drugs, heart medications, and cholesterol treatments.",
    keywords: [
      "cardiovascular drugs",
      "heart medication",
      "blood pressure medication",
      "cholesterol drugs",
      "ACE inhibitors",
      "beta blockers",
      "statins",
      "lisinopril",
      "amlodipine",
      "metoprolol",
      "atorvastatin"
    ]
  },
  "Dermatology": {
    title: "Dermatology Drugs - Skin Medication Information | PharmaLens",
    description: "Comprehensive information on dermatological medications for acne, eczema, psoriasis, and other skin conditions.",
    keywords: [
      "dermatology drugs",
      "skin medication",
      "acne treatment",
      "eczema medication",
      "psoriasis treatment",
      "tretinoin",
      "adapalene",
      "benzoyl peroxide",
      "hydrocortisone",
      "topical steroids"
    ]
  },
  "Ophthalmology": {
    title: "Eye Medications - Ophthalmology Drug Information | PharmaLens",
    description: "Complete guide to eye medications including glaucoma treatments, dry eye solutions, and antibiotic eye drops.",
    keywords: [
      "eye medication",
      "ophthalmology drugs",
      "glaucoma treatment",
      "dry eye medication",
      "eye drops",
      "latanoprost",
      "timolol",
      "artificial tears",
      "antibiotic eye drops"
    ]
  },
  "Oncology": {
    title: "Cancer Medications - Oncology Drug Information | PharmaLens",
    description: "Comprehensive information on cancer treatments including chemotherapy drugs, targeted therapy, and immunotherapy.",
    keywords: [
      "cancer medication",
      "oncology drugs",
      "chemotherapy",
      "targeted therapy",
      "immunotherapy",
      "methotrexate",
      "doxorubicin",
      "cisplatin",
      "paclitaxel",
      "pembrolizumab"
    ]
  },
  "Vaccines": {
    title: "Vaccines Information - Immunization Guide | PharmaLens",
    description: "Complete vaccine information including COVID-19, flu, hepatitis, and other immunizations. Safety data and schedules.",
    keywords: [
      "vaccines",
      "immunizations",
      "COVID-19 vaccine",
      "flu vaccine",
      "hepatitis vaccine",
      "MMR vaccine",
      "vaccination schedule",
      "vaccine safety"
    ]
  }
};

// Popular drug search terms for SEO
export const popularDrugSearchTerms = [
  // Top searched medications
  "ibuprofen", "acetaminophen", "aspirin", "metformin", "lisinopril",
  "amlodipine", "omeprazole", "simvastatin", "levothyroxine", "azithromycin",
  "amoxicillin", "prednisone", "gabapentin", "tramadol", "losartan",
  "atorvastatin", "sertraline", "hydrochlorothiazide", "metoprolol", "albuterol",
  "furosemide", "warfarin", "insulin", "clopidogrel", "pantoprazole",
  "montelukast", "escitalopram", "fluticasone", "duloxetine", "trazodone",
  "bupropion", "alprazolam", "lorazepam", "clonazepam", "zolpidem",
  "quetiapine", "aripiprazole", "risperidone", "lithium", "lamotrigine",
  "valproic acid", "carbamazepine", "phenytoin", "levetiracetam", "donepezil",
  "memantine", "sumatriptan", "topiramate", "propranolol", "digoxin",
  "spironolactone", "isosorbide", "nitroglycerin", "diltiazem", "verapamil",
  
  // Additional popular medications
  "naproxen", "diclofenac", "celecoxib", "morphine", "codeine",
  "oxycodone", "fentanyl", "meloxicam", "indomethacin", "ketorolac",
  "hydrocodone", "pregabalin", "ciprofloxacin", "doxycycline", "cephalexin",
  "clarithromycin", "levofloxacin", "clindamycin", "metronidazole", "trimethoprim",
  "sulfamethoxazole", "penicillin", "erythromycin", "tetracycline", "vancomycin",
  
  // Cardiovascular medications
  "enalapril", "captopril", "ramipril", "candesartan", "valsartan",
  "irbesartan", "telmisartan", "olmesartan", "bisoprolol", "carvedilol",
  "atenolol", "nebivolol", "felodipine", "nifedipine", "lercanidipine",
  "indapamide", "chlorthalidone", "bendroflumethiazide", "rosuvastatin", "pravastatin",
  "fluvastatin", "pitavastatin", "ezetimibe", "fenofibrate", "gemfibrozil",
  
  // Diabetes medications
  "glyburide", "glipizide", "glimepiride", "pioglitazone", "rosiglitazone",
  "sitagliptin", "saxagliptin", "linagliptin", "alogliptin", "empagliflozin",
  "canagliflozin", "dapagliflozin", "liraglutide", "exenatide", "dulaglutide",
  "semaglutide", "repaglinide", "nateglinide", "acarbose", "miglitol",
  
  // Mental health medications
  "fluoxetine", "paroxetine", "citalopram", "fluvoxamine", "venlafaxine",
  "desvenlafaxine", "mirtazapine", "nortriptyline", "amitriptyline", "imipramine",
  "desipramine", "clomipramine", "doxepin", "trimipramine", "protriptyline",
  "phenelzine", "tranylcypromine", "selegiline", "moclobemide", "buspirone",
  "hydroxyzine", "diazepam", "temazepam", "oxazepam", "chlordiazepoxide",
  
  // Respiratory medications
  "salbutamol", "terbutaline", "salmeterol", "formoterol", "indacaterol",
  "tiotropium", "ipratropium", "budesonide", "beclomethasone", "ciclesonide",
  "mometasone", "prednisolone", "methylprednisolone", "dexamethasone", "hydrocortisone",
  "theophylline", "aminophylline", "zafirlukast", "zileuton", "cromolyn",
  
  // Gastrointestinal medications
  "lansoprazole", "esomeprazole", "rabeprazole", "dexlansoprazole", "ranitidine",
  "famotidine", "cimetidine", "nizatidine", "sucralfate", "misoprostol",
  "domperidone", "metoclopramide", "ondansetron", "granisetron", "dolasetron",
  "loperamide", "diphenoxylate", "atropine", "bismuth", "simethicone",
  
  // Pain and inflammation
  "piroxicam", "tenoxicam", "lornoxicam", "etodolac", "sulindac",
  "tolmetin", "mefenamic acid", "flurbiprofen", "ketoprofen", "fenoprofen",
  "oxaprozin", "nabumetone", "diflunisal", "salsalate", "choline magnesium",
  
  // Neurological medications
  "baclofen", "tizanidine", "cyclobenzaprine", "methocarbamol", "carisoprodol",
  "chlorzoxazone", "metaxalone", "orphenadrine", "dantrolene", "botulinum toxin",
  "rizatriptan", "zolmitriptan", "naratriptan", "almotriptan", "eletriptan",
  "frovatriptan", "ergotamine", "dihydroergotamine", "caffeine", "butalbital",
  
  // Dermatology medications
  "tretinoin", "adapalene", "tazarotene", "benzoyl peroxide", "clindamycin topical",
  "erythromycin topical", "isotretinoin", "acitretin", "calcipotriene", "tacrolimus",
  "pimecrolimus", "clobetasol", "betamethasone", "triamcinolone", "fluocinonide",
  
  // Ophthalmology medications
  "latanoprost", "travoprost", "bimatoprost", "tafluprost", "timolol",
  "dorzolamide", "brinzolamide", "brimonidine", "apraclonidine", "pilocarpine",
  "cyclopentolate", "tropicamide", "atropine eye drops", "artificial tears", "cyclosporine",
  
  // Oncology medications
  "methotrexate", "doxorubicin", "cisplatin", "carboplatin", "paclitaxel",
  "docetaxel", "cyclophosphamide", "fluorouracil", "gemcitabine", "oxaliplatin",
  "irinotecan", "etoposide", "vincristine", "vinblastine", "bleomycin",
  
  // Vaccines
  "influenza vaccine", "COVID-19 vaccine", "hepatitis B vaccine", "MMR vaccine",
  "tetanus vaccine", "pneumococcal vaccine", "HPV vaccine", "meningococcal vaccine",
  "varicella vaccine", "shingles vaccine", "rotavirus vaccine", "polio vaccine"
];

// Generate dynamic SEO metadata for drug pages
export const generateDrugPageSEO = (drugName: string, genericName?: string, category?: string): SEOMetadata => {
  const title = `${drugName} (${genericName || drugName}) - Complete Drug Information | PharmaLens`;
  const description = `Complete information about ${drugName} including dosage, side effects, interactions, contraindications, and safety data. Trusted pharmaceutical reference.`;
  
  const keywords = [
    drugName.toLowerCase(),
    genericName?.toLowerCase() || '',
    'drug information',
    'medication details',
    'dosage',
    'side effects',
    'drug interactions',
    'contraindications',
    'prescription information',
    category?.toLowerCase() || ''
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    ogTitle: `${drugName} - Drug Information`,
    ogDescription: description,
    twitterCard: "summary"
  };
};

// Generate category page SEO metadata
export const generateCategoryPageSEO = (category: string): SEOMetadata => {
  const categoryData = categoryPageSEO[category as keyof typeof categoryPageSEO];
  
  if (categoryData) {
    return categoryData;
  }
  
  // Fallback for categories not in the predefined list
  return {
    title: `${category} Medications - Drug Information | PharmaLens`,
    description: `Complete information on ${category.toLowerCase()} medications including dosages, side effects, and interactions.`,
    keywords: [
      `${category.toLowerCase()} drugs`,
      `${category.toLowerCase()} medication`,
      'drug information',
      'medication details',
      'pharmaceutical reference'
    ]
  };
};

// SEO-friendly URL slugs for categories
export const categorySlugMap: Record<string, string> = {
  "Pain Management": "pain-management",
  "Cardiovascular": "cardiovascular",
  "Respiratory": "respiratory",
  "Dermatology": "dermatology",
  "Ophthalmology": "ophthalmology",
  "Oncology": "oncology",
  "Vaccines": "vaccines",
  "Antibiotics": "antibiotics",
  "Gastrointestinal": "gastrointestinal",
  "Endocrine": "endocrine",
  "Central Nervous System": "central-nervous-system",
  "Antiviral": "antiviral",
  "Antimalarial": "antimalarial",
  "Supplements": "supplements",
  "Other": "other"
};

// Generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{name: string, url: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

// FAQ structured data for better SEO
export const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is PharmaLens?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PharmaLens is a comprehensive drug information database that provides detailed information about medications including dosages, side effects, interactions, and contraindications."
      }
    },
    {
      "name": "How many drugs are in the PharmaLens database?",
      "@type": "Question",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PharmaLens contains comprehensive information on over 800 medications across various therapeutic categories including pain management, cardiovascular, diabetes, mental health, antibiotics, respiratory, gastrointestinal, neurological, dermatology, ophthalmology, and oncology medications."
      }
    },
    {
      "@type": "Question",
      "name": "Is PharmaLens information medically accurate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, PharmaLens provides verified drug information sourced from reliable pharmaceutical references. However, always consult healthcare professionals for medical advice."
      }
    }
  ]
};