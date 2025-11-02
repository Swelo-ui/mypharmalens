import { DrugData } from "@/components/DrugCard";

// Permethrin and scabies treatment drugs
export const permethrinScabiesDrugs: DrugData[] = [
  {
    id: 'PERM001',
    name: 'Permethrin Lotion/Soap',
    genericName: 'Permethrin',
    manufacturer: 'Various',
    category: 'Dermatological',
    description: 'Topical scabicide and pediculicide.',
    drugClass: 'Pyrethroid Insecticide',
    verified: true,
    brandNames: ['Perlice', 'Scaboma', 'Elimite'],
    prescriptionStatus: 'Over the Counter',
    dosageAndAdmin: 'Topical: Apply 5% cream from neck down, wash off after 8-14 hours. Repeat after 7 days if needed.',
    mechanism: 'Disrupts sodium channel function in parasite nerve cells causing paralysis.',
    sideEffects: ['Itching', 'burning', 'stinging', 'numbness', 'erythema'],
    interactions: ['None significant'],
    indications: ['Scabies', 'head lice', 'pubic lice'],
    contraindications: ['Hypersensitivity', 'infants under 2 months'],
    warnings: ['Avoid eyes and mucous membranes', 'treat all household members', 'wash bedding and clothes'],
    pregnancy: 'Category B - Generally safe',
    storage: 'Store at room temperature'
  }
];
