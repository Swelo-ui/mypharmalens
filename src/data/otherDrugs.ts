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
    description: 'Retinoid used to treat acne and reduce fine wrinkles and mottled skin discoloration.',
    drugClass: 'Retinoid',
    verified: true,
    brandNames: ['Retin-A', 'Avita', 'Renova']
  },
  {
    id: '402',
    name: 'Adapalene',
    genericName: 'Adapalene',
    manufacturer: 'Various',
    category: 'Dermatology',
    description: 'Retinoid-like compound used to treat acne.',
    drugClass: 'Retinoid',
    verified: true,
    brandNames: ['Differin']
  },
  {
    id: '403',
    name: 'Clotrimazole',
    genericName: 'Clotrimazole',
    manufacturer: 'Various',
    category: 'Antifungal',
    description: 'Antifungal medication used to treat fungal infections of the skin, vagina, and mouth.',
    drugClass: 'Azole antifungal',
    verified: true,
    brandNames: ['Lotrimin', 'Mycelex']
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
