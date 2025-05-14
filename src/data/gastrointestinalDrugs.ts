
import { DrugData } from "@/components/DrugCard";

// Gastrointestinal drugs - includes antacids, antiemetics, and medications for GI disorders
export const gastrointestinalDrugs: DrugData[] = [
  // Gastrointestinal medications
  {
    id: '9',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor used to reduce stomach acid',
    drugClass: 'Proton Pump Inhibitor',
    verified: true,
    brandNames: ['Prilosec']
  },
  {
    id: '10',
    name: 'Pantoprazole',
    genericName: 'Pantoprazole',
    manufacturer: 'Various',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor used to reduce stomach acid',
    drugClass: 'Proton Pump Inhibitor',
    verified: true,
    brandNames: ['Protonix']
  },
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
  },
  {
    id: '77',
    name: 'Loperamide',
    genericName: 'Loperamide',
    manufacturer: 'Various',
    category: 'Antidiarrheal',
    description: 'Antidiarrheal used to treat diarrhea',
    drugClass: 'Antidiarrheal',
    verified: true,
    brandNames: ['Imodium']
  },
  {
    id: '78',
    name: 'Bisacodyl',
    genericName: 'Bisacodyl',
    manufacturer: 'Various',
    category: 'Laxative',
    description: 'Laxative used to treat constipation',
    drugClass: 'Laxative',
    verified: true,
    brandNames: ['Dulcolax']
  },
  {
    id: '79',
    name: 'Docusate',
    genericName: 'Docusate',
    manufacturer: 'Various',
    category: 'Stool Softener',
    description: 'Stool softener used to treat constipation',
    drugClass: 'Stool Softener',
    verified: true,
    brandNames: ['Colace']
  },
  {
    id: '80',
    name: 'Polyethylene Glycol',
    genericName: 'Polyethylene Glycol',
    manufacturer: 'Various',
    category: 'Laxative',
    description: 'Laxative used to treat constipation',
    drugClass: 'Laxative',
    verified: true,
    brandNames: ['Miralax']
  },
  {
    id: '81',
    name: 'Ranitidine',
    genericName: 'Ranitidine',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'H2 blocker used to reduce stomach acid',
    drugClass: 'H2 Blocker',
    verified: true,
    brandNames: ['Zantac']
  },
  {
    id: '82',
    name: 'Famotidine',
    genericName: 'Famotidine',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'H2 blocker used to reduce stomach acid',
    drugClass: 'H2 Blocker',
    verified: true,
    brandNames: ['Pepcid']
  },
  {
    id: '83',
    name: 'Calcium Carbonate',
    genericName: 'Calcium Carbonate',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'Antacid used to reduce stomach acid',
    drugClass: 'Antacid',
    verified: true,
    brandNames: ['Tums']
  },
  {
    id: '84',
    name: 'Aluminum Hydroxide',
    genericName: 'Aluminum Hydroxide',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'Antacid used to reduce stomach acid',
    drugClass: 'Antacid',
    verified: true,
    brandNames: ['Amphojel']
  },
  {
    id: '85',
    name: 'Magnesium Hydroxide',
    genericName: 'Magnesium Hydroxide',
    manufacturer: 'Various',
    category: 'Antacid',
    description: 'Antacid used to reduce stomach acid',
    drugClass: 'Antacid',
    verified: true,
    brandNames: ['Milk of Magnesia']
  },
  {
    id: '86',
    name: 'Simethicone',
    genericName: 'Simethicone',
    manufacturer: 'Various',
    category: 'Antiflatulent',
    description: 'Antiflatulent used to reduce gas',
    drugClass: 'Antiflatulent',
    verified: true,
    brandNames: ['Gas-X']
  },
  {
    id: '87',
    name: 'Dimenhydrinate',
    genericName: 'Dimenhydrinate',
    manufacturer: 'Various',
    category: 'Antiemetic',
    description: 'Antiemetic used to treat motion sickness',
    drugClass: 'Antiemetic',
    verified: true,
    brandNames: ['Dramamine']
  },
  {
    id: '88',
    name: 'Meclizine',
    genericName: 'Meclizine',
    manufacturer: 'Various',
    category: 'Antiemetic',
    description: 'Antiemetic used to treat motion sickness',
    drugClass: 'Antiemetic',
    verified: true,
    brandNames: ['Bonine']
  },
  {
    id: '89',
    name: 'Scopolamine',
    genericName: 'Scopolamine',
    manufacturer: 'Various',
    category: 'Antiemetic',
    description: 'Antiemetic used to treat motion sickness',
    drugClass: 'Antiemetic',
    verified: true,
    brandNames: ['Transderm Scop']
  },
  {
    id: '90',
    name: 'Bismuth Subsalicylate',
    genericName: 'Bismuth Subsalicylate',
    manufacturer: 'Various',
    category: 'Antidiarrheal',
    description: 'Antidiarrheal used to treat diarrhea and upset stomach',
    drugClass: 'Antidiarrheal',
    verified: true,
    brandNames: ['Pepto-Bismol']
  }
];
