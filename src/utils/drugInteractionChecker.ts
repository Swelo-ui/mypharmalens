import { DrugData } from "@/components/DrugCard";
import { simplifyMedicalTerm, medicalToLaymanTerms } from "@/utils/laymanTerms";

export interface DrugInteraction {
  drug1: DrugData;
  drug2: DrugData;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  recommendation: string;
  // Additional structured clinical metadata to improve UX
  onset?: string;          // e.g., 'Rapid (hours to days)'
  monitoring?: string;     // e.g., 'Monitor INR and signs of bleeding'
  mechanism?: string;      // e.g., 'Additive antiplatelet/anticoagulant effect'
  sources?: string[];      // evidence trail, e.g., ['data:drug1.interactions','rule:class-combo anticoagulant+nsaid']
  alternatives?: { drug: DrugData; reason: string }[];
  // Layman-friendly versions
  laymanDescription?: string;
  laymanRecommendation?: string;
  laymanMechanism?: string;
  laymanMonitoring?: string;
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

  const sources: string[] = [];
  // If either drug's text mentions the other's tokens, consider interaction
  for (const t of texts1) {
    if (textContainsAny(t, tokens2)) {
      interactionFound = true;
      interactionText = t;
      sources.push('data:drug1.interactions');
      break;
    }
  }
  if (!interactionFound) {
    for (const t of texts2) {
      if (textContainsAny(t, tokens1)) {
        interactionFound = true;
        interactionText = t;
        sources.push('data:drug2.interactions');
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
      sources.push(`rule:same-class ${drug1Class}`);
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
    sources.push(`rule:class-combo ${hasCombo.classes.join('+')}`);
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

  // Derive mechanism, onset and monitoring using class heuristics and text keywords
  const textForMeta = (interactionText || '').toLowerCase();
  const classes = `${drug1Class} + ${drug2Class}`;

  // Mechanism patterns with layman explanations
  const mechMap: { test: (t: string) => boolean; mech: string; layman: string }[] = [
    { 
      test: t => /(bleed|hemorrhage|inr|antiplatelet|anticoagulant)/.test(t) || (drug1Class+drug2Class).includes('anticoagulant') || (drug1Class+drug2Class).includes('antiplatelet'), 
      mech: 'Additive antiplatelet/anticoagulant effect increases bleeding risk',
      layman: 'Both medicines thin your blood, which increases bleeding risk'
    },
    { 
      test: t => /(serotonin|5-ht)/.test(t) || (drug1Class+drug2Class).includes('ssri') && (drug1Class+drug2Class).includes('maoi'), 
      mech: 'Excess serotonergic activity (serotonin syndrome risk)',
      layman: 'Too much serotonin in your brain can cause dangerous symptoms'
    },
    { 
      test: t => /(cyp3a4|cyp2c9|inhibitor|inducer|macrolide|grapefruit)/.test(t) || (drug1Class+drug2Class).includes('macrolide') && (drug1Class+drug2Class).includes('statin'), 
      mech: 'Metabolic interaction (CYP-mediated) increases serum drug levels',
      layman: 'One medicine affects how your liver processes the other, making it stronger'
    },
    { 
      test: t => /(qt prolong|torsade)/.test(t), 
      mech: 'Additive QT prolongation increases arrhythmia risk',
      layman: 'Both medicines can affect your heart rhythm when used together'
    },
    { 
      test: t => /(respiratory|cns depression|sedation)/.test(t) || (drug1Class+drug2Class).includes('benzodiazepine') && (drug1Class+drug2Class).includes('opioid'), 
      mech: 'Additive CNS depression/respiratory depression',
      layman: 'Both medicines can make you very drowsy and slow your breathing'
    },
    { 
      test: t => /(hypotension|blood pressure|nitrate)/.test(t) || (drug1Class+drug2Class).includes('pde5 inhibitor') && (drug1Class+drug2Class).includes('nitrate'), 
      mech: 'Excess vasodilation causing severe hypotension',
      layman: 'Both medicines lower blood pressure and together can cause dangerous drops'
    },
    { 
      test: t => /(potassium|hyperkalemia)/.test(t) || (drug1Class+drug2Class).includes('potassium-sparing') && (drug1Class+drug2Class).includes('ace'), 
      mech: 'Hyperkalemia due to combined effects on potassium homeostasis',
      layman: 'Both medicines can increase potassium levels in your blood to dangerous levels'
    },
  ];
  const mechResult = mechMap.find(m => m.test(textForMeta));
  const detectedMech = mechResult?.mech || (hasCombo ? hasCombo.note : undefined) || undefined;
  const laymanMech = mechResult?.layman || undefined;

  // Onset patterns
  let onset: string | undefined;
  if (/(immediate|sudden|rapid|hours)/.test(textForMeta) || severity === 'contraindicated' || (classes.includes('benzodiazepine') && classes.includes('opioid')) || (classes.includes('nitrate') && classes.includes('pde5')) ) {
    onset = 'Rapid (hours to days)';
  } else if (/(days|weeks|accumulate|build up|elevated levels)/.test(textForMeta) || (classes.includes('macrolide') && classes.includes('statin')) || classes.includes('warfarin')) {
    onset = 'Typically within days to weeks';
  }
  if (!onset) {
    onset = severity === 'severe' || severity === 'contraindicated' ? 'Rapid (hours to days)' : 'Variable (days to weeks)';
  }

  // Monitoring suggestions with layman versions
  let monitoring: string | undefined;
  let laymanMonitoring: string | undefined;
  if (/(inr|warfarin|bleed)/.test(textForMeta) || classes.includes('anticoagulant')) {
    monitoring = 'Check INR (if on warfarin) and monitor for bleeding/bruising; avoid concurrent NSAIDs/antiplatelets if possible';
    laymanMonitoring = 'Get blood tests to check clotting; watch for unusual bleeding or bruising; avoid pain medicines like ibuprofen';
  } else if (/(potassium|hyperkalemia)/.test(textForMeta) || classes.includes('potassium-sparing') || classes.includes('ace')) {
    monitoring = 'Monitor serum potassium and renal function (creatinine) within 1–2 weeks of initiation or dose change';
    laymanMonitoring = 'Get blood tests within 1-2 weeks to check potassium levels and kidney function';
  } else if (/(qt prolong|torsade)/.test(textForMeta)) {
    monitoring = 'Obtain baseline and follow-up ECG; correct electrolytes (K/Mg); avoid in congenital long QT';
    laymanMonitoring = 'Get heart rhythm tests (ECG) before and during treatment; correct low potassium/magnesium';
  } else if (/(macrolide|cyp3a4|statin)/.test(textForMeta) || (classes.includes('macrolide') && classes.includes('statin'))) {
    monitoring = 'Consider holding or switching statin; monitor for myopathy (CK) and liver enzymes if continued';
    laymanMonitoring = 'May need to temporarily stop cholesterol medicine; watch for muscle pain or weakness';
  } else if ((classes.includes('benzodiazepine') && classes.includes('opioid')) || /(respiratory|cns depression)/.test(textForMeta)) {
    monitoring = 'Avoid combination or use minimal doses; monitor level of consciousness and respiration; provide take-home naloxone if appropriate';
    laymanMonitoring = 'Use lowest possible doses; watch for extreme drowsiness or slow breathing; keep naloxone (overdose reversal) available';
  } else if ((classes.includes('nitrate') && classes.includes('pde5')) || /(hypotension|blood pressure)/.test(textForMeta)) {
    monitoring = 'Absolute avoidance recommended; if inadvertently combined, monitor blood pressure closely and seek medical attention for dizziness/syncope';
    laymanMonitoring = 'Never use together; if accidentally combined, check blood pressure often and get help if dizzy or faint';
  }

  const description = interactionText || 'Potential interaction detected.';

  // Tailor recommendation by mechanism/classes with layman versions
  const recHints: string[] = [];
  const laymanRecHints: string[] = [];
  if ((drug1Class+drug2Class).includes('anticoagulant')) {
    if ((drug1Class+drug2Class).includes('nsaid')) {
      recHints.push('Prefer paracetamol (acetaminophen) for pain instead of NSAIDs.');
      laymanRecHints.push('Use paracetamol for pain instead of ibuprofen or similar medicines.');
    }
    if ((drug1Class+drug2Class).includes('antiplatelet')) {
      recHints.push('Use the lowest effective antiplatelet regimen; assess bleeding risk and gastroprotection (e.g., PPI).');
      laymanRecHints.push('Use the lowest dose that works; may need stomach protection medicine.');
    }
    if ((drug1.name+drug2.name).toLowerCase().includes('warfarin')) {
      recHints.push('If suitable, discuss DOAC alternatives (e.g., apixaban, rivaroxaban) with your doctor.');
      laymanRecHints.push('Ask your doctor about newer blood thinners that may be safer.');
    }
  }
  if ((drug1Class+drug2Class).includes('benzodiazepine') && (drug1Class+drug2Class).includes('opioid')) {
    recHints.push('Avoid alcohol and other sedatives; do not drive; ask about take‑home naloxone.');
    laymanRecHints.push('Avoid alcohol; do not drive; ask about emergency overdose medicine (naloxone).');
  }
  if ((drug1Class+drug2Class).includes('statin') && (drug1Class+drug2Class).includes('macrolide')) {
    recHints.push('Temporarily hold or switch statin (e.g., to pravastatin/rosuvastatin) while on macrolide antibiotic.');
    laymanRecHints.push('May need to temporarily stop cholesterol medicine while taking antibiotic.');
  }
  if ((drug1Class+drug2Class).includes('pde5') && (drug1Class+drug2Class).includes('nitrate')) {
    recHints.push('Absolute avoidance: do not take nitrates within 24–48h of PDE5 inhibitors.');
    laymanRecHints.push('Never take these together - wait at least 24-48 hours between doses.');
  }
  if (recHints.length) {
    recommendation = `${recommendation} ${recHints.join(' ')}`.trim();
  }
  
  // Create layman versions
  const laymanDescription = simplifyMedicalTerm(description);
  const baseLaymanRec = severity === 'contraindicated' 
    ? 'DO NOT use these medicines together. Talk to your doctor right away about other options.'
    : severity === 'severe'
    ? 'This combination can be dangerous. Only use together with close doctor supervision.'
    : severity === 'moderate'
    ? 'Use carefully. Watch for side effects and talk to your doctor before combining.'
    : 'Generally safe but tell your doctor. May need small timing or dose changes.';
  const laymanRecommendation = laymanRecHints.length 
    ? `${baseLaymanRec} ${laymanRecHints.join(' ')}`.trim()
    : baseLaymanRec;

  return { 
    drug1, 
    drug2, 
    severity, 
    description, 
    recommendation, 
    onset, 
    monitoring, 
    mechanism: detectedMech, 
    sources, 
    alternatives: [],
    laymanDescription,
    laymanRecommendation,
    laymanMechanism: laymanMech,
    laymanMonitoring
  };
};

// Main function to check interactions between multiple drugs
export const checkDrugInteractions = (
  selectedDrugs: DrugData[],
  allDrugs: DrugData[]
): InteractionCheckResult => {
  const byPair: Record<string, DrugInteraction> = {};

  const sevRank: Record<DrugInteraction['severity'], number> = {
    contraindicated: 3,
    severe: 2,
    moderate: 1,
    mild: 0
  };

  const merge = (key: string, cand: DrugInteraction) => {
    const prev = byPair[key];
    if (!prev) {
      byPair[key] = cand;
      return;
    }
    // Prefer higher severity
    if (sevRank[cand.severity] > sevRank[prev.severity]) {
      byPair[key] = { ...cand, alternatives: prev.alternatives || cand.alternatives };
    } else if (sevRank[cand.severity] === sevRank[prev.severity]) {
      // If same severity, keep richer description
      const betterDesc = (cand.description || '').length > (prev.description || '').length ? cand.description : prev.description;
      const mech = prev.mechanism || cand.mechanism;
      const onset = prev.onset || cand.onset;
      const monitoring = prev.monitoring || cand.monitoring;
      const sources = Array.from(new Set([...(prev.sources || []), ...(cand.sources || [])]));
      // Merge alternatives unique by id
      const alts = [...(prev.alternatives || []), ...(cand.alternatives || [])];
      const seenAlt = new Set<string>();
      const mergedAlts = alts.filter(a => {
        const id = a.drug.id;
        if (seenAlt.has(id)) return false;
        seenAlt.add(id);
        return true;
      }).slice(0, 3);
      byPair[key] = { ...prev, description: betterDesc, mechanism: mech, onset, monitoring, sources, alternatives: mergedAlts };
    }
  };

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
        const key = [interaction.drug1.id, interaction.drug2.id].sort().join('|');
        merge(key, interaction);
      }
    }
  }
  const interactions = Object.values(byPair);

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
