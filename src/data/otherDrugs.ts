import { DrugData } from "@/components/DrugCard";

// Other drugs that don't fit into the major categories
export const otherDrugs: DrugData[] = [
  // Additional drugs to meet the 500 requirement
  // Dermatology medications
  {
    id: '401',
    name: 'Tretinoin',
    genericName: 'Tretinoin',
    manufacturer: 'Various',
    category: 'Dermatology',
    description: 'Topical retinoid medication used to treat acne vulgaris, reduce signs of photodamage, and improve skin texture. Works by promoting cell turnover and preventing the formation of comedones.',
    drugClass: 'Retinoid',
    verified: true,
    brandNames: ['Retin-A', 'Avita', 'Renova', 'Tretin-X'],
    dosageAndAdmin: 'Apply thin layer to affected areas once daily at bedtime. Start with lower concentrations (0.025%) and gradually increase strength as tolerated.',
    sideEffects: ['Skin irritation', 'Dryness', 'Peeling', 'Redness', 'Initial acne flare', 'Photosensitivity'],
    warnings: ['Avoid sun exposure', 'Use sunscreen daily', 'May cause birth defects', 'Avoid during pregnancy'],
    interactions: ['Benzoyl peroxide', 'Salicylic acid', 'Other topical acne medications', 'Photosensitizing drugs'],
    storage: 'Store at room temperature away from light and heat. Do not freeze.',
    mechanism: 'Normalizes follicular keratinization, reduces comedone formation, and has anti-inflammatory properties.',
    indications: ['Acne vulgaris', 'Photoaging', 'Fine wrinkles', 'Hyperpigmentation', 'Rough skin texture'],
    contraindications: ['Pregnancy', 'Hypersensitivity to tretinoin', 'Eczema', 'Sunburn'],
    prescriptionStatus: 'Prescription Only',
    pregnancy: 'Category C - Avoid use during pregnancy'
  },
  {
    id: '402',
    name: 'Adapalene',
    genericName: 'Adapalene',
    manufacturer: 'Various',
    category: 'Dermatology',
    description: 'Third-generation topical retinoid used to treat acne vulgaris. More stable than tretinoin and causes less irritation while maintaining efficacy in treating comedonal and inflammatory acne.',
    drugClass: 'Retinoid',
    verified: true,
    brandNames: ['Differin', 'Adaferin', 'Deriva'],
    dosageAndAdmin: 'Apply thin layer to affected areas once daily at bedtime. Available as 0.1% gel, cream, or lotion. May also be available over-the-counter in some formulations.',
    sideEffects: ['Mild skin irritation', 'Dryness', 'Erythema', 'Scaling', 'Burning sensation'],
    warnings: ['Avoid excessive sun exposure', 'Use sunscreen', 'May initially worsen acne', 'Avoid contact with eyes and mucous membranes'],
    interactions: ['Medicated soaps', 'Abrasive cleansers', 'Products containing alcohol', 'Other topical acne treatments'],
    storage: 'Store at controlled room temperature. Protect from light and freezing.',
    mechanism: 'Binds to specific retinoic acid nuclear receptors, normalizes keratinocyte differentiation and reduces inflammatory processes.',
    indications: ['Acne vulgaris', 'Comedonal acne', 'Inflammatory acne lesions'],
    contraindications: ['Hypersensitivity to adapalene', 'Severe acne requiring systemic therapy'],
    prescriptionStatus: 'Available both OTC and Prescription (depending on strength)',
    pregnancy: 'Category C - Use only if benefits outweigh risks'
  },
  {
    id: '403',
    name: 'Clotrimazole',
    genericName: 'Clotrimazole',
    manufacturer: 'Various',
    category: 'Antifungal',
    description: 'Broad-spectrum antifungal medication effective against dermatophytes, yeasts, and some gram-positive bacteria. Used topically for various fungal skin infections and vaginally for yeast infections.',
    drugClass: 'Azole antifungal',
    verified: true,
    brandNames: ['Lotrimin', 'Mycelex', 'Canesten', 'Gyne-Lotrimin'],
    dosageAndAdmin: 'Topical: Apply thin layer twice daily for 2-4 weeks. Vaginal: One applicator or suppository at bedtime for 3-7 days. Oral troche: Dissolve slowly 5 times daily.',
    sideEffects: ['Local irritation', 'Burning sensation', 'Erythema', 'Stinging', 'Contact dermatitis', 'Vulvovaginal burning (vaginal use)'],
    warnings: ['For external use only', 'Avoid contact with eyes', 'Discontinue if hypersensitivity occurs', 'May weaken latex condoms and diaphragms'],
    interactions: ['Warfarin (with vaginal tablets)', 'May reduce effectiveness of latex contraceptives'],
    storage: 'Store at room temperature. Avoid freezing vaginal products.',
    mechanism: 'Inhibits ergosterol synthesis in fungal cell membranes, leading to increased membrane permeability and cell death.',
    indications: ['Athlete\'s foot', 'Jock itch', 'Ringworm', 'Vaginal yeast infections', 'Oral thrush', 'Cutaneous candidiasis'],
    contraindications: ['Hypersensitivity to clotrimazole or other azoles'],
    prescriptionStatus: 'Available both OTC and Prescription',
    pregnancy: 'Category B - Safe during pregnancy, especially for vaginal use'
  },
  {
    id: '404',
    name: 'Ketoconazole',
    genericName: 'Ketoconazole',
    manufacturer: 'Various',
    category: 'Antifungal',
    description: 'Antifungal medication used to treat fungal infections.',
    drugClass: 'Azole antifungal',
    verified: true,
    brandNames: ['Nizoral']
  },
  {
    id: '405',
    name: 'Fluconazole',
    genericName: 'Fluconazole',
    manufacturer: 'Various',
    category: 'Antifungal',
    description: 'Antifungal medication used to treat fungal infections including candidiasis and cryptococcal meningitis.',
    drugClass: 'Azole antifungal',
    verified: true,
    brandNames: ['Diflucan']
  },
  
  // Ophthalmology medications
  {
    id: '406',
    name: 'Latanoprost',
    genericName: 'Latanoprost',
    manufacturer: 'Various',
    category: 'Ophthalmology',
    description: 'Prostaglandin analog used to treat glaucoma and ocular hypertension.',
    drugClass: 'Prostaglandin analog',
    verified: true,
    brandNames: ['Xalatan']
  },
  {
    id: '407',
    name: 'Timolol Maleate',
    genericName: 'Timolol Maleate',
    manufacturer: 'Various',
    category: 'Ophthalmology',
    description: 'Beta-blocker used to treat glaucoma and ocular hypertension.',
    drugClass: 'Beta blocker',
    verified: true,
    brandNames: ['Timoptic']
  },
  {
    id: '408',
    name: 'Brimonidine',
    genericName: 'Brimonidine tartrate',
    manufacturer: 'Various',
    category: 'Ophthalmology',
    description: 'Alpha-2 adrenergic receptor agonist used to treat glaucoma and ocular hypertension.',
    drugClass: 'Alpha-2 adrenergic receptor agonist',
    verified: true,
    brandNames: ['Alphagan P']
  },
  
  // Immunosuppressants
  {
    id: '409',
    name: 'Tacrolimus',
    genericName: 'Tacrolimus',
    manufacturer: 'Various',
    category: 'Immunosuppressant',
    description: 'Immunosuppressant used to prevent organ rejection after transplant and to treat certain skin conditions.',
    drugClass: 'Calcineurin inhibitor',
    verified: true,
    brandNames: ['Prograf', 'Protopic']
  },
  {
    id: '410',
    name: 'Mycophenolate Mofetil',
    genericName: 'Mycophenolate Mofetil',
    manufacturer: 'Various',
    category: 'Immunosuppressant',
    description: 'Immunosuppressant used to prevent organ rejection after transplant.',
    drugClass: 'IMDH inhibitor',
    verified: true,
    brandNames: ['CellCept']
  },
  {
    id: '411',
    name: 'Cyclosporine',
    genericName: 'Cyclosporine',
    manufacturer: 'Various',
    category: 'Immunosuppressant',
    description: 'Immunosuppressant used to prevent organ rejection after transplant and to treat certain autoimmune conditions.',
    drugClass: 'Calcineurin inhibitor',
    verified: true,
    brandNames: ['Sandimmune', 'Neoral', 'Restasis']
  },
  
  // Additional WHO essential medicines
  {
    id: '412',
    name: 'Misoprostol',
    genericName: 'Misoprostol',
    manufacturer: 'Various',
    category: 'Obstetrics',
    description: 'Prostaglandin analog used to prevent and treat stomach ulcers, start labor, cause an abortion, and treat postpartum bleeding.',
    drugClass: 'Prostaglandin analog',
    verified: true,
    brandNames: ['Cytotec']
  },
  {
    id: '413',
    name: 'Oxytocin',
    genericName: 'Oxytocin',
    manufacturer: 'Various',
    category: 'Obstetrics',
    description: 'Hormone used to induce labor, strengthen labor contractions, and control bleeding after childbirth.',
    drugClass: 'Hormone',
    verified: true,
    brandNames: ['Pitocin']
  },
  {
    id: '414',
    name: 'Methyldopa',
    genericName: 'Methyldopa',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Alpha-2 adrenergic agonist used to treat high blood pressure, especially during pregnancy.',
    drugClass: 'Alpha-2 adrenergic agonist',
    verified: true,
    brandNames: ['Aldomet']
  },
  {
    id: '415',
    name: 'Magnesium Sulfate',
    genericName: 'Magnesium Sulfate',
    manufacturer: 'Various',
    category: 'Obstetrics',
    description: 'Mineral used to prevent seizures in women with preeclampsia and to delay preterm labor.',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  }
];
