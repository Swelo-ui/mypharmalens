import { DrugData } from "@/components/DrugCard";

export interface DrugInteraction {
  drug1: DrugData;
  drug2: DrugData;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  recommendation: string;
  alternatives?: { drug: DrugData; reason: string }[];
}

export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: DrugInteraction[];
  safeToUse: boolean;
}

// Build a robust token set for a drug using name, generic, brands and class
const getDrugTokens = (drug: DrugData): string[] => {
  const parts: string[] = [];
  const pushTokens = (s?: string) => {
    if (!s) return;
    const t = s.toLowerCase();
    // split on non-letters and keep tokens >= 3 chars to reduce noise
    t.split(/[^a-z0-9]+/).forEach(tok => { if (tok.length >= 3) parts.push(tok); });
  };

  pushTokens(drug.name);
  pushTokens(drug.genericName);
  pushTokens(drug.drugClass);
  (drug.brandNames || []).forEach(b => pushTokens(b));

  return Array.from(new Set(parts));
};

const fieldTextsForDrug = (drug: DrugData): string[] => {
  const arr: string[] = [];
  (drug.interactions || []).forEach(s => arr.push(s.toLowerCase()));
  (drug.contraindications || []).forEach(s => arr.push(s.toLowerCase()));
  (drug.warnings || []).forEach(s => arr.push(s.toLowerCase()));
  return arr;
};

const textContainsAny = (text: string, tokens: string[]): boolean => {
  for (const tok of tokens) {
    if (!tok) continue;
    // word boundary match if simple word, otherwise fallback to includes
    try {
      const re = new RegExp(`\\b${tok.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, 'i');
      if (re.test(text)) return true;
    } catch {
      if (text.includes(tok)) return true;
    }
  }
  return false;
};

// Check if two drugs potentially interact using robust text + class rules
const checkPairInteraction = (drug1: DrugData, drug2: DrugData): DrugInteraction | null => {
  const drug1Class = (drug1.drugClass || '').toLowerCase();
  const drug2Class = (drug2.drugClass || '').toLowerCase();

  const tokens1 = getDrugTokens(drug1);
  const tokens2 = getDrugTokens(drug2);
  const texts1 = fieldTextsForDrug(drug1);
  const texts2 = fieldTextsForDrug(drug2);

  let interactionFound = false;
  let interactionText = '';
  let severity: 'mild' | 'moderate' | 'severe' | 'contraindicated' = 'mild';

  // If either drug's text mentions the other's tokens, consider interaction
  for (const t of texts1) {
    if (textContainsAny(t, tokens2)) {
      interactionFound = true;
      interactionText = t;
      break;
    }
  }
  if (!interactionFound) {
    for (const t of texts2) {
      if (textContainsAny(t, tokens1)) {
        interactionFound = true;
        interactionText = t;
        break;
      }
    }
  }

  // Same-class additive risk heuristics
  if (drug1Class && drug2Class && drug1Class === drug2Class) {
    if (['nsaid', 'anticoagulant', 'antiplatelet', 'sedative', 'opioid', 'benzodiazepine', 'diuretic'].some(c => drug1Class.includes(c))) {
      interactionFound = true;
      interactionText = interactionText || `Both medications are ${drug1Class}, which may increase side-effect risk.`;
      severity = severity === 'mild' ? 'moderate' : severity;
    }
  }

  // Specific high-risk combinations by class/name
  type Combo = { classes: string[]; severity: 'moderate' | 'severe' | 'contraindicated'; note: string };
  const combos: Combo[] = [
    { classes: ['anticoagulant', 'nsaid'], severity: 'severe', note: 'Bleeding risk increases.' },
    { classes: ['anticoagulant', 'antiplatelet'], severity: 'severe', note: 'Additive bleeding risk.' },
    { classes: ['benzodiazepine', 'opioid'], severity: 'severe', note: 'Respiratory depression risk.' },
    { classes: ['ssri', 'maoi'], severity: 'contraindicated', note: 'Serotonin syndrome risk.' },
    { classes: ['pde5 inhibitor', 'nitrate'], severity: 'contraindicated', note: 'Severe hypotension risk.' },
    { classes: ['statin', 'macrolide'], severity: 'severe', note: 'Rhabdomyolysis risk increases.' },
    { classes: ['warfarin', 'antibiotic'], severity: 'severe', note: 'INR changes/bleeding risk.' },
    { classes: ['ace inhibitor', 'potassium-sparing diuretic'], severity: 'severe', note: 'Hyperkalemia risk.' },
  ];

  const hasCombo = combos.find(c =>
    c.classes.some(cls => drug1Class.includes(cls)) &&
    c.classes.some(cls => drug2Class.includes(cls))
  );
  if (hasCombo) {
    interactionFound = true;
    severity = hasCombo.severity;
    interactionText = interactionText || hasCombo.note;
  }

  // Infer severity from interaction text keywords
  if (interactionText) {
    const t = interactionText.toLowerCase();
    if (/(contraindicated|do not (use|combine)|avoid|life[- ]threatening|fatal)/.test(t)) severity = 'contraindicated';
    else if (/(severe|serious|major|dangerous)/.test(t)) severity = 'severe';
    else if (/(moderate|monitor|caution|dose adjustment)/.test(t)) severity = 'moderate';
  }

  if (!interactionFound) return null;

  let recommendation = '';
  switch (severity) {
    case 'contraindicated':
      recommendation = 'DO NOT use these medications together. Consult your doctor immediately for alternative treatment options.';
      break;
    case 'severe':
      recommendation = 'This combination may be dangerous. Use only under strict medical supervision with dose adjustments and close monitoring.';
      break;
    case 'moderate':
      recommendation = 'Use with caution. Monitor for increased side effects and consult your healthcare provider before combining these medications.';
      break;
    case 'mild':
      recommendation = 'Generally safe but inform your doctor. Minor adjustments to timing or dosage may be needed.';
      break;
  }

  return { drug1, drug2, severity, description: interactionText || 'Potential interaction detected.', recommendation, alternatives: [] };
};

// Main function to check interactions between multiple drugs
export const checkDrugInteractions = (
  selectedDrugs: DrugData[],
  allDrugs: DrugData[]
): InteractionCheckResult => {
  const interactions: DrugInteraction[] = [];
  
  // Check each pair of selected drugs
  for (let i = 0; i < selectedDrugs.length; i++) {
    for (let j = i + 1; j < selectedDrugs.length; j++) {
      const interaction = checkPairInteraction(selectedDrugs[i], selectedDrugs[j]);
      if (interaction) {
        // Find alternatives for severe/contraindicated interactions
        if (interaction.severity === 'severe' || interaction.severity === 'contraindicated') {
          const alternatives = findAlternatives(interaction.drug2, allDrugs, selectedDrugs);
          interaction.alternatives = alternatives;
        }
        interactions.push(interaction);
      }
    }
  }
  
  const hasSevereInteractions = interactions.some(
    i => i.severity === 'severe' || i.severity === 'contraindicated'
  );
  
  return {
    hasInteractions: interactions.length > 0,
    interactions,
    safeToUse: !hasSevereInteractions
  };
};

// Find pharmacologically appropriate alternative drugs
const findAlternatives = (
  drug: DrugData,
  allDrugs: DrugData[],
  selectedDrugs: DrugData[]
): { drug: DrugData; reason: string }[] => {
  const alternatives: { drug: DrugData; reason: string }[] = [];
  const drugClass = (drug.drugClass || '').toLowerCase();
  const drugName = drug.name.toLowerCase();
  
  // Define pharmacologically appropriate alternative mappings
  const alternativeMap: Record<string, { classes: string[]; names: string[]; reason: string }> = {
    // Anticoagulants
    'warfarin': {
      classes: ['direct oral anticoagulant', 'doac', 'factor xa inhibitor', 'thrombin inhibitor'],
      names: ['rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban'],
      reason: 'Direct oral anticoagulant with fewer drug interactions'
    },
    'anticoagulant': {
      classes: ['direct oral anticoagulant', 'doac', 'factor xa inhibitor', 'thrombin inhibitor'],
      names: ['rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban', 'warfarin'],
      reason: 'Alternative anticoagulant with different interaction profile'
    },
    
    // Antiplatelets
    'aspirin': {
      classes: ['antiplatelet', 'p2y12 inhibitor'],
      names: ['clopidogrel', 'prasugrel', 'ticagrelor'],
      reason: 'Alternative antiplatelet with different mechanism'
    },
    'clopidogrel': {
      classes: ['antiplatelet'],
      names: ['prasugrel', 'ticagrelor', 'aspirin'],
      reason: 'Alternative antiplatelet medication'
    },
    
    // NSAIDs
    'nsaid': {
      classes: ['cox-2 selective inhibitor', 'selective cox-2 inhibitor'],
      names: ['celecoxib', 'etoricoxib'],
      reason: 'COX-2 selective NSAID with lower bleeding risk'
    },
    
    // Statins
    'statin': {
      classes: ['statin', 'hmg-coa reductase inhibitor'],
      names: ['atorvastatin', 'rosuvastatin', 'pravastatin', 'fluvastatin'],
      reason: 'Alternative statin with different interaction profile'
    },
    
    // Antidepressants
    'ssri': {
      classes: ['snri', 'atypical antidepressant', 'tricyclic antidepressant'],
      names: ['venlafaxine', 'duloxetine', 'bupropion', 'mirtazapine'],
      reason: 'Alternative antidepressant with different mechanism'
    },
    
    // Benzodiazepines
    'benzodiazepine': {
      classes: ['non-benzodiazepine hypnotic', 'antihistamine', 'melatonin receptor agonist'],
      names: ['zolpidem', 'eszopiclone', 'diphenhydramine', 'melatonin'],
      reason: 'Non-benzodiazepine alternative with lower interaction risk'
    },
    
    // Opioids
    'opioid': {
      classes: ['nsaid', 'anticonvulsant', 'topical analgesic'],
      names: ['ibuprofen', 'naproxen', 'gabapentin', 'pregabalin', 'lidocaine'],
      reason: 'Non-opioid pain management alternative'
    }
  };
  
  // Find appropriate alternatives based on drug class or name
  let targetAlternatives: { classes: string[]; names: string[]; reason: string } | null = null;
  
  // Check by specific drug name first
  for (const [key, alt] of Object.entries(alternativeMap)) {
    if (drugName.includes(key) || alt.names.some(name => drugName.includes(name))) {
      targetAlternatives = alt;
      break;
    }
  }
  
  // If not found by name, check by class
  if (!targetAlternatives) {
    for (const [key, alt] of Object.entries(alternativeMap)) {
      if (drugClass.includes(key) || alt.classes.some(cls => drugClass.includes(cls))) {
        targetAlternatives = alt;
        break;
      }
    }
  }
  
  if (!targetAlternatives) {
    // Fallback: same category, different class
    const sameCategoryDrugs = allDrugs.filter(d => 
      d.category === drug.category && 
      d.drugClass !== drug.drugClass &&
      !selectedDrugs.some(sd => sd.id === d.id)
    );
    
    sameCategoryDrugs.slice(0, 3).forEach(altDrug => {
      alternatives.push({
        drug: altDrug,
        reason: `Alternative ${drug.category} medication`
      });
    });
    
    return alternatives;
  }
  
  // Find drugs matching the alternative criteria
  const candidateAlternatives = allDrugs.filter(d => {
    if (selectedDrugs.some(sd => sd.id === d.id)) return false;
    if (d.id === drug.id) return false;
    
    const altClass = (d.drugClass || '').toLowerCase();
    const altName = d.name.toLowerCase();
    
    // Check if drug matches alternative classes or names
    return targetAlternatives!.classes.some(cls => altClass.includes(cls)) ||
           targetAlternatives!.names.some(name => altName.includes(name));
  });
  
  // Check if these alternatives interact with other selected drugs
  candidateAlternatives.forEach(altDrug => {
    if (alternatives.length >= 3) return;
    
    let hasInteraction = false;
    for (const selectedDrug of selectedDrugs) {
      if (selectedDrug.id !== drug.id) {
        const interaction = checkPairInteraction(altDrug, selectedDrug);
        if (interaction && (interaction.severity === 'severe' || interaction.severity === 'contraindicated')) {
          hasInteraction = true;
          break;
        }
      }
    }
    
    if (!hasInteraction) {
      alternatives.push({
        drug: altDrug,
        reason: targetAlternatives!.reason
      });
    }
  });
  
  return alternatives;
};

// Get severity color for UI
export const getSeverityColor = (severity: 'mild' | 'moderate' | 'severe' | 'contraindicated'): string => {
  switch (severity) {
    case 'contraindicated':
      return 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400';
    case 'severe':
      return 'bg-orange-100 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-400';
    case 'moderate':
      return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500 text-yellow-700 dark:text-yellow-400';
    case 'mild':
      return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400';
  }
};

// Get severity badge color
export const getSeverityBadgeColor = (severity: 'mild' | 'moderate' | 'severe' | 'contraindicated'): string => {
  switch (severity) {
    case 'contraindicated':
      return 'bg-red-500 text-white';
    case 'severe':
      return 'bg-orange-500 text-white';
    case 'moderate':
      return 'bg-yellow-500 text-white';
    case 'mild':
      return 'bg-blue-500 text-white';
  }
};
