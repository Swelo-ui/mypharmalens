
import { DrugData } from "@/components/DrugCard";

// Respiratory drugs - includes bronchodilators, anti-inflammatories, and antihistamines for respiratory conditions
export const respiratoryDrugs: DrugData[] = [
  // Bronchodilators and respiratory medications
  {
    id: '13',
    name: 'Albuterol',
    genericName: 'Albuterol',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Bronchodilator used to treat asthma and COPD',
    drugClass: 'Bronchodilator',
    verified: true,
    brandNames: ['Ventolin', 'ProAir']
  },
  {
    id: '109',
    name: 'Fluticasone',
    genericName: 'Fluticasone propionate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Corticosteroid that reduces inflammation in the airways. Used to treat asthma and allergic rhinitis.',
    drugClass: 'Corticosteroid',
    verified: true,
    brandNames: ['Flonase', 'Flovent']
  },
  {
    id: '110',
    name: 'Montelukast',
    genericName: 'Montelukast sodium',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Leukotriene receptor antagonist used to prevent asthma attacks and to treat seasonal allergies.',
    drugClass: 'Leukotriene receptor antagonist',
    verified: true,
    brandNames: ['Singulair']
  },
  {
    id: '111',
    name: 'Tiotropium',
    genericName: 'Tiotropium bromide',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Anticholinergic bronchodilator that helps open air passages in the lungs. Used to treat COPD.',
    drugClass: 'Anticholinergic bronchodilator',
    verified: true,
    brandNames: ['Spiriva', 'Spiriva Respimat']
  },
  {
    id: '112',
    name: 'Ipratropium',
    genericName: 'Ipratropium bromide',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Anticholinergic bronchodilator that relaxes muscles in the airways and increases air flow to the lungs. Used to treat bronchospasm associated with COPD.',
    drugClass: 'Anticholinergic bronchodilator',
    verified: true,
    brandNames: ['Atrovent', 'Atrovent HFA']
  },
  {
    id: '222',
    name: 'Salmeterol',
    genericName: 'Salmeterol xinafoate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Long-acting beta2-adrenergic agonist used to prevent bronchospasm in asthma and COPD.',
    drugClass: 'Long-acting beta agonist',
    verified: true,
    brandNames: ['Serevent']
  },
  {
    id: '223',
    name: 'Formoterol',
    genericName: 'Formoterol fumarate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Long-acting beta2-adrenergic agonist used to prevent bronchospasm in asthma and COPD.',
    drugClass: 'Long-acting beta agonist',
    verified: true,
    brandNames: ['Foradil', 'Perforomist']
  },
  {
    id: '224',
    name: 'Budesonide/Formoterol',
    genericName: 'Budesonide/Formoterol fumarate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Combination of a corticosteroid and a long-acting beta2-adrenergic agonist used to treat asthma and COPD.',
    drugClass: 'Corticosteroid/Long-acting beta agonist',
    verified: true,
    brandNames: ['Symbicort']
  },
  {
    id: '225',
    name: 'Umeclidinium',
    genericName: 'Umeclidinium bromide',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Long-acting muscarinic antagonist used to treat COPD.',
    drugClass: 'Anticholinergic bronchodilator',
    verified: true,
    brandNames: ['Incruse Ellipta']
  },
  {
    id: '226',
    name: 'Umeclidinium/Vilanterol',
    genericName: 'Umeclidinium bromide/Vilanterol trifenatate',
    manufacturer: 'Various',
    category: 'Respiratory',
    description: 'Combination of a long-acting muscarinic antagonist and a long-acting beta2-adrenergic agonist used to treat COPD.',
    drugClass: 'Anticholinergic bronchodilator/Long-acting beta agonist',
    verified: true,
    brandNames: ['Anoro Ellipta']
  },
  
  // Antihistamine drugs
  {
    id: '26',
    name: 'Diphenhydramine',
    genericName: 'Diphenhydramine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Antihistamine used to treat allergies and insomnia',
    drugClass: 'Antihistamine',
    verified: true,
    brandNames: ['Benadryl']
  },
  {
    id: '27',
    name: 'Loratadine',
    genericName: 'Loratadine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Antihistamine used to treat allergies',
    drugClass: 'Antihistamine',
    verified: true,
    brandNames: ['Claritin']
  },
  {
    id: '28',
    name: 'Cetirizine',
    genericName: 'Cetirizine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Antihistamine used to treat allergies',
    drugClass: 'Antihistamine',
    verified: true,
    brandNames: ['Zyrtec']
  },
  {
    id: '227',
    name: 'Fexofenadine',
    genericName: 'Fexofenadine hydrochloride',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Second-generation antihistamine used to relieve allergy symptoms.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    brandNames: ['Allegra', 'Telfast']
  },
  {
    id: '228',
    name: 'Desloratadine',
    genericName: 'Desloratadine',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Second-generation antihistamine used to relieve allergy symptoms.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    brandNames: ['Clarinex', 'Aerius']
  },
  {
    id: '229',
    name: 'Levocetirizine',
    genericName: 'Levocetirizine dihydrochloride',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Second-generation antihistamine used to relieve allergy symptoms.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    brandNames: ['Xyzal', 'Xusal']
  },
  {
    id: '230',
    name: 'Azelastine',
    genericName: 'Azelastine hydrochloride',
    manufacturer: 'Various',
    category: 'Antihistamine',
    description: 'Second-generation antihistamine used to relieve nasal allergy symptoms and eye allergy symptoms.',
    drugClass: 'Second-generation antihistamine',
    verified: true,
    brandNames: ['Astelin', 'Optivar', 'Astepro']
  }
];
