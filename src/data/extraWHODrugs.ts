
import { DrugData } from "@/components/DrugCard";

// Additional WHO essential medicines to reach over 500 drugs total
export const extraWHODrugs: DrugData[] = [
  // Mental health drugs
  {
    id: '501',
    name: 'Lithium',
    genericName: 'Lithium carbonate',
    manufacturer: 'Various',
    category: 'Psychiatric',
    description: 'Mood stabilizer used to treat bipolar disorder.',
    drugClass: 'Mood stabilizer',
    verified: true,
    brandNames: ['Eskalith', 'Lithobid']
  },
  {
    id: '502',
    name: 'Haloperidol',
    genericName: 'Haloperidol',
    manufacturer: 'Various',
    category: 'Psychiatric',
    description: 'Antipsychotic used to treat schizophrenia, Tourette syndrome, and acute psychosis.',
    drugClass: 'Typical antipsychotic',
    verified: true,
    brandNames: ['Haldol']
  },
  {
    id: '503',
    name: 'Risperidone',
    genericName: 'Risperidone',
    manufacturer: 'Various',
    category: 'Psychiatric',
    description: 'Atypical antipsychotic used to treat schizophrenia, bipolar disorder, and irritability in autism.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    brandNames: ['Risperdal']
  },
  
  // Additional antiparasitics
  {
    id: '504',
    name: 'Ivermectin',
    genericName: 'Ivermectin',
    manufacturer: 'Various',
    category: 'Antiparasitic',
    description: 'Antiparasitic used to treat many types of parasitic infections, including strongyloidiasis and onchocerciasis.',
    drugClass: 'Antiparasitic',
    verified: true,
    brandNames: ['Stromectol']
  },
  {
    id: '505',
    name: 'Praziquantel',
    genericName: 'Praziquantel',
    manufacturer: 'Various',
    category: 'Antiparasitic',
    description: 'Anthelmintic used to treat schistosomiasis and other fluke infections.',
    drugClass: 'Anthelmintic',
    verified: true,
    brandNames: ['Biltricide']
  },
  {
    id: '506',
    name: 'Mebendazole',
    genericName: 'Mebendazole',
    manufacturer: 'Various',
    category: 'Antiparasitic',
    description: 'Anthelmintic used to treat various worm infections.',
    drugClass: 'Anthelmintic',
    verified: true,
    brandNames: ['Vermox']
  },
  {
    id: '507',
    name: 'Albendazole',
    genericName: 'Albendazole',
    manufacturer: 'Various',
    category: 'Antiparasitic',
    description: 'Anthelmintic used to treat various worm infections.',
    drugClass: 'Anthelmintic',
    verified: true,
    brandNames: ['Albenza']
  },
  
  // Additional antituberculosis drugs
  {
    id: '508',
    name: 'Isoniazid',
    genericName: 'Isoniazid',
    manufacturer: 'Various',
    category: 'Antituberculosis',
    description: 'Antibiotic used to treat tuberculosis.',
    drugClass: 'Antituberculosis',
    verified: true,
    brandNames: ['Nydrazid']
  },
  {
    id: '509',
    name: 'Rifampicin',
    genericName: 'Rifampicin',
    manufacturer: 'Various',
    category: 'Antituberculosis',
    description: 'Antibiotic used to treat tuberculosis and certain other infections.',
    drugClass: 'Antituberculosis',
    verified: true,
    brandNames: ['Rifadin', 'Rimactane']
  },
  {
    id: '510',
    name: 'Ethambutol',
    genericName: 'Ethambutol hydrochloride',
    manufacturer: 'Various',
    category: 'Antituberculosis',
    description: 'Antibiotic used to treat tuberculosis.',
    drugClass: 'Antituberculosis',
    verified: true,
    brandNames: ['Myambutol']
  },
  {
    id: '511',
    name: 'Pyrazinamide',
    genericName: 'Pyrazinamide',
    manufacturer: 'Various',
    category: 'Antituberculosis',
    description: 'Antibiotic used to treat tuberculosis.',
    drugClass: 'Antituberculosis',
    verified: true,
    brandNames: ['Pyrazinamide']
  },
  
  // Additional anticonvulsants
  {
    id: '512',
    name: 'Carbamazepine',
    genericName: 'Carbamazepine',
    manufacturer: 'Various',
    category: 'Anticonvulsant',
    description: 'Anticonvulsant and mood stabilizer used to treat epilepsy, trigeminal neuralgia, and bipolar disorder.',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Tegretol', 'Carbatrol', 'Epitol']
  },
  {
    id: '513',
    name: 'Valproic Acid',
    genericName: 'Valproic Acid',
    manufacturer: 'Various',
    category: 'Anticonvulsant',
    description: 'Anticonvulsant and mood stabilizer used to treat epilepsy, bipolar disorder, and migraine headaches.',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Depakene', 'Depakote']
  },
  {
    id: '514',
    name: 'Phenytoin',
    genericName: 'Phenytoin',
    manufacturer: 'Various',
    category: 'Anticonvulsant',
    description: 'Anticonvulsant used to prevent and control seizures.',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Dilantin']
  },
  {
    id: '515',
    name: 'Phenobarbital',
    genericName: 'Phenobarbital',
    manufacturer: 'Various',
    category: 'Anticonvulsant',
    description: 'Barbiturate anticonvulsant used to control seizures.',
    drugClass: 'Barbiturate',
    verified: true,
    brandNames: ['Luminal']
  },
  
  // Remaining entries to reach over 500 drugs
  // Additional unique drugs for various conditions
  {
    id: '516',
    name: 'Tamsulosin',
    genericName: 'Tamsulosin hydrochloride',
    manufacturer: 'Various',
    category: 'Urological',
    description: 'Alpha-1 blocker used to treat symptoms of an enlarged prostate.',
    drugClass: 'Alpha-1 blocker',
    verified: true,
    brandNames: ['Flomax']
  },
  {
    id: '517',
    name: 'Finasteride',
    genericName: 'Finasteride',
    manufacturer: 'Various',
    category: 'Urological',
    description: '5-alpha reductase inhibitor used to treat enlarged prostate and male pattern baldness.',
    drugClass: '5-alpha reductase inhibitor',
    verified: true,
    brandNames: ['Proscar', 'Propecia']
  },
  {
    id: '518',
    name: 'Sildenafil',
    genericName: 'Sildenafil citrate',
    manufacturer: 'Various',
    category: 'Urological',
    description: 'Phosphodiesterase type 5 (PDE5) inhibitor used to treat erectile dysfunction and pulmonary arterial hypertension.',
    drugClass: 'PDE5 inhibitor',
    verified: true,
    brandNames: ['Viagra', 'Revatio']
  },
  {
    id: '519',
    name: 'Tadalafil',
    genericName: 'Tadalafil',
    manufacturer: 'Various',
    category: 'Urological',
    description: 'Phosphodiesterase type 5 (PDE5) inhibitor used to treat erectile dysfunction, pulmonary arterial hypertension, and benign prostatic hyperplasia.',
    drugClass: 'PDE5 inhibitor',
    verified: true,
    brandNames: ['Cialis', 'Adcirca']
  },
  {
    id: '520',
    name: 'Vardenafil',
    genericName: 'Vardenafil hydrochloride',
    manufacturer: 'Various',
    category: 'Urological',
    description: 'Phosphodiesterase type 5 (PDE5) inhibitor used to treat erectile dysfunction.',
    drugClass: 'PDE5 inhibitor',
    verified: true,
    brandNames: ['Levitra', 'Staxyn']
  }
];
