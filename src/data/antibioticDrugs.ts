
import { DrugData } from "@/components/DrugCard";

// Antibiotic drugs
export const antibioticDrugs: DrugData[] = [
  {
    id: '15',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin trihydrate',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Broad-spectrum penicillin antibiotic effective against many gram-positive and some gram-negative bacteria. Commonly used for respiratory tract infections, urinary tract infections, and skin infections.',
    drugClass: 'Aminopenicillin',
    verified: true,
    brandNames: ['Amoxil', 'Trimox', 'Moxatag', 'Larotid'],
    dosageAndAdmin: 'Adults: 250-500mg every 8 hours or 500-875mg every 12 hours. Children: 20-40mg/kg/day divided every 8-12 hours. Take with or without food.',
    sideEffects: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Skin rash', 'Allergic reactions', 'C. difficile colitis'],
    warnings: ['Penicillin allergy', 'Antibiotic-associated diarrhea', 'Superinfection risk', 'Hepatic dysfunction (rare)'],
    interactions: ['Warfarin', 'Methotrexate', 'Probenecid', 'Oral contraceptives', 'Allopurinol'],
    storage: 'Capsules/tablets: Store at room temperature. Suspension: Refrigerate and discard after 14 days.',
    mechanism: 'Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins, leading to bacterial lysis.',
    indications: ['Respiratory tract infections', 'Urinary tract infections', 'Skin infections', 'Otitis media', 'Dental infections', 'H. pylori eradication'],
    contraindications: ['Penicillin hypersensitivity', 'History of amoxicillin-induced cholestatic jaundice'],
    prescriptionStatus: 'Prescription Only',
    pregnancy: 'Category B - Safe during pregnancy'
  },
  {
    id: '16',
    name: 'Azithromycin',
    genericName: 'Azithromycin dihydrate',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Macrolide antibiotic with broad-spectrum activity against gram-positive and atypical bacteria. Features convenient dosing with excellent tissue penetration and prolonged half-life.',
    drugClass: 'Macrolide antibiotic',
    verified: true,
    brandNames: ['Zithromax', 'Azithromycin Z-Pak', 'Zmax'],
    dosageAndAdmin: 'Adults: 500mg on day 1, then 250mg daily for 4 days (Z-Pack). Alternative: 500mg daily for 3 days. Children: 10mg/kg on day 1, then 5mg/kg daily for 4 days.',
    sideEffects: ['Nausea', 'Diarrhea', 'Abdominal pain', 'Vomiting', 'Headache', 'QT prolongation', 'Hearing loss (high doses)'],
    warnings: ['QT interval prolongation', 'Cardiac arrhythmias', 'Hepatotoxicity', 'C. difficile colitis', 'Myasthenia gravis exacerbation'],
    interactions: ['Warfarin', 'Digoxin', 'Antacids', 'Ergot alkaloids', 'Cyclosporine', 'QT-prolonging drugs'],
    storage: 'Store tablets at room temperature. Reconstituted suspension stable for 10 days at room temperature.',
    mechanism: 'Binds to 50S ribosomal subunit, inhibiting bacterial protein synthesis and causing bacteriostatic effects.',
    indications: ['Community-acquired pneumonia', 'Acute bacterial sinusitis', 'Pharyngitis/tonsillitis', 'Skin infections', 'Chlamydia', 'Traveler\'s diarrhea'],
    contraindications: ['Hypersensitivity to macrolides', 'History of cholestatic jaundice with azithromycin', 'Concurrent ergot alkaloids'],
    prescriptionStatus: 'Prescription Only',
    pregnancy: 'Category B - Generally safe during pregnancy'
  },
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
  {
    id: '301',
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Fluoroquinolone antibiotic used to treat various bacterial infections.',
    drugClass: 'Fluoroquinolone antibiotic',
    verified: true,
    brandNames: ['Cipro', 'Ciprodex']
  },
  {
    id: '302',
    name: 'Doxycycline',
    genericName: 'Doxycycline hyclate',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Tetracycline antibiotic used to treat various bacterial infections and certain parasitic diseases.',
    drugClass: 'Tetracycline antibiotic',
    verified: true,
    brandNames: ['Vibramycin', 'Oracea', 'Doryx']
  },
  {
    id: '303',
    name: 'Metronidazole',
    genericName: 'Metronidazole',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Antibiotic and antiprotozoal medication used to treat bacterial infections of the vagina, stomach, skin, joints, and respiratory tract.',
    drugClass: 'Nitroimidazole antibiotic',
    verified: true,
    brandNames: ['Flagyl', 'Metrocream', 'Metrogel']
  },
  {
    id: '304',
    name: 'Vancomycin',
    genericName: 'Vancomycin hydrochloride',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Glycopeptide antibiotic used to treat severe bacterial infections, particularly those caused by Gram-positive bacteria.',
    drugClass: 'Glycopeptide antibiotic',
    verified: true,
    brandNames: ['Vancocin', 'Firvanq']
  },
  {
    id: '305',
    name: 'Clindamycin',
    genericName: 'Clindamycin hydrochloride',
    manufacturer: 'Various',
    category: 'Antibiotic',
    description: 'Lincosamide antibiotic used to treat serious bacterial infections, particularly those caused by anaerobic bacteria.',
    drugClass: 'Lincosamide antibiotic',
    verified: true,
    brandNames: ['Cleocin', 'Clindesse', 'Evoclin']
  }
];
