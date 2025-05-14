
import { DrugData } from "@/components/DrugCard";

// Endocrine drugs - includes antidiabetics, thyroid medications, and hormonal drugs
export const endocrineDrugs: DrugData[] = [
  // Thyroid and endocrine
  {
    id: '8',
    name: 'Levothyroxine',
    genericName: 'Levothyroxine',
    manufacturer: 'Various',
    category: 'Hormone Replacement',
    description: 'Thyroid hormone used to treat hypothyroidism',
    drugClass: 'Thyroid Hormone',
    verified: true,
    brandNames: ['Synthroid', 'Levoxyl']
  },
  
  // Antidiabetics
  {
    id: '11',
    name: 'Metformin',
    genericName: 'Metformin',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Biguanide used to treat type 2 diabetes',
    drugClass: 'Biguanide',
    verified: true,
    brandNames: ['Glucophage']
  },
  {
    id: '12',
    name: 'Insulin Glargine',
    genericName: 'Insulin Glargine',
    manufacturer: 'Various',
    category: 'Antidiabetic',
    description: 'Long-acting insulin used to treat diabetes',
    drugClass: 'Insulin',
    verified: true,
    brandNames: ['Lantus', 'Toujeo']
  },
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
  
  // Supplements, vitamins, and minerals
  {
    id: '34',
    name: 'Melatonin',
    genericName: 'Melatonin',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Hormone used to treat insomnia and jet lag',
    drugClass: 'Hormone',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '35',
    name: 'Vitamin D',
    genericName: 'Vitamin D',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin used to treat vitamin D deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '36',
    name: 'Vitamin B12',
    genericName: 'Vitamin B12',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Vitamin used to treat vitamin B12 deficiency',
    drugClass: 'Vitamin',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '39',
    name: 'Potassium Chloride',
    genericName: 'Potassium Chloride',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Electrolyte supplement used to treat potassium deficiency',
    drugClass: 'Electrolyte',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '40',
    name: 'Calcium Carbonate',
    genericName: 'Calcium Carbonate',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat calcium deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Tums']
  },
  {
    id: '41',
    name: 'Iron Sulfate',
    genericName: 'Iron Sulfate',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat iron deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '42',
    name: 'Magnesium Oxide',
    genericName: 'Magnesium Oxide',
    manufacturer: 'Various',
    category: 'Supplement',
    description: 'Mineral supplement used to treat magnesium deficiency',
    drugClass: 'Mineral',
    verified: true,
    brandNames: ['Various']
  }  
];
