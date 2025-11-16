/**
 * Text cleaning utilities to remove AI-generated formatting artifacts
 * Removes asterisks, markdown formatting, and other unprofessional elements
 */

/**
 * Clean text by removing asterisks, markdown formatting, and other AI artifacts
 */
export function cleanText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Remove markdown bold formatting (**text** or __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    
    // Remove single asterisks used for emphasis (*text*)
    .replace(/\*(.*?)\*/g, '$1')
    
    // Remove markdown headers (# ## ### etc.)
    .replace(/^#{1,6}\s+/gm, '')
    
    // Remove markdown bullet points (- * +)
    .replace(/^[\s]*[-\*\+]\s+/gm, '')
    
    // Remove numbered lists (1. 2. etc.)
    .replace(/^[\s]*\d+\.\s+/gm, '')
    
    // Remove markdown links [text](url)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    
    // Remove HTML tags if any
    .replace(/<[^>]*>/g, '')
    
    // Remove misleading phrases about packaging/visibility
    .replace(/not explicitly listed on (the )?visible packaging\.?/gi, '')
    .replace(/not (explicitly )?listed on (the )?packaging\.?/gi, '')
    .replace(/not visible on (the )?packaging\.?/gi, '')
    .replace(/information not available on (the )?package\.?/gi, '')
    
    // Remove extra whitespace and normalize
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean an array of strings
 */
export function cleanTextArray(textArray: string[]): string[] {
  if (!Array.isArray(textArray)) return textArray;
  
  return textArray
    .map(text => cleanText(text))
    .filter(text => text && text.length > 0); // Remove empty strings
}

/**
 * Clean all text fields in a drug data object
 */
// deno-lint-ignore no-explicit-any
export function cleanDrugData(drugData: Record<string, any>): Record<string, any> {
  if (!drugData || typeof drugData !== 'object') return drugData;
  
  const cleaned = { ...drugData };
  
  // Clean string fields
  const stringFields = [
    'name', 'genericName', 'manufacturer', 'category', 'drugClass',
    'description', 'dosageAndAdmin', 'storage', 'mechanism', 
    'prescriptionStatus', 'pregnancy'
  ];
  
  stringFields.forEach(field => {
    if (cleaned[field] && typeof cleaned[field] === 'string') {
      cleaned[field] = cleanText(cleaned[field] as string);
    }
  });
  
  // Clean array fields
  const arrayFields = [
    'sideEffects', 'warnings', 'interactions', 'indications', 
    'contraindications', 'brandNames'
  ];
  
  arrayFields.forEach(field => {
    if (cleaned[field] && Array.isArray(cleaned[field])) {
      cleaned[field] = cleanTextArray(cleaned[field] as string[]);
    }
  });
  
  return cleaned;
}

/**
 * Specifically clean mechanism of action text which often has AI formatting
 */
export function cleanMechanismText(mechanism: string): string {
  if (!mechanism) return mechanism;
  
  return cleanText(mechanism)
    // Remove common AI prefixes
    .replace(/^This medication (works by|acts by|functions by)\s*/i, '')
    .replace(/^The mechanism of action (is|involves)\s*/i, '')
    .replace(/^Mechanism:\s*/i, '')
    
    // Remove drug name repetitions at start
    .replace(/^[A-Za-z\s\-]+\s+(works by|acts by|functions by)\s*/i, '')
    
    // Ensure proper capitalization
    .replace(/^[a-z]/, match => match.toUpperCase());
}

/**
 * Clean side effects text to remove AI formatting
 */
export function cleanSideEffectText(effect: string): string {
  if (!effect) return effect;
  
  return cleanText(effect)
    // Remove common prefixes
    .replace(/^(Side effect:|Common:|Rare:|Serious:)\s*/i, '')
    .replace(/^May cause\s*/i, '')
    .replace(/^Can lead to\s*/i, '')
    
    // Ensure proper capitalization
    .replace(/^[a-z]/, match => match.toUpperCase());
}

export function normalizeDrugName(name: string): string {
  if (!name || typeof name !== 'string') return name as unknown as string;
  const lower = name.toLowerCase().trim();
  const noStrength = lower
    .replace(/\b\d+\s*(mg|mcg|g|ml|l|iu|%)\b/gi, '')
    .replace(/\b\d+\.?\d*\s*(w\/w|v\/v)\b/gi, '')
    .replace(/\b\d+\s*(tablet|capsule|syrup|drops|injection)\b/gi, '');
  const noForms = noStrength
    .replace(/\b(tablet|capsule|syrup|ointment|gel|lotion|drops|injection|cream)\b/gi, '')
    .replace(/\b(hcl|hydrochloride)\b/gi, ' hydrochloride ');
  const noPunct = noForms.replace(/[&/+\-]/g, ' ');
  return noPunct.replace(/\s+/g, ' ').trim();
}

export function generateNameAliases(name: string): string[] {
  const base = normalizeDrugName(name);
  const variants = new Set<string>();
  const push = (v: string) => { if (v && v.trim().length > 1) variants.add(v.trim()); };
  push(name);
  push(base);
  push(base.replace(/\s+/g, ''));
  push(base.split(' ')[0]);
  push(base.replace(/\b(hydrochloride)\b/gi, ''));
  push(base.replace(/\b(cream|ointment|gel|lotion|syrup|tablet|capsule|drops|injection)\b/gi, ''));
  return [...variants];
}

export function normalizeManufacturer(manu: string): string {
  if (!manu || typeof manu !== 'string') return manu as unknown as string;
  let s = manu.trim();
  s = s.replace(/limited|ltd\.|ltd|industries|inc\.|inc|private|pvt\.|pvt|pharmaceuticals?/gi, '').trim();
  s = s.replace(/\s{2,}/g, ' ');
  const map: Record<string, string> = {
    'cipla': 'Cipla',
    'sun pharma': 'Sun Pharma',
    'sun pharmaceutical': 'Sun Pharma',
    'dr reddy': "Dr. Reddy's",
    'dr reddys': "Dr. Reddy's",
    'gsk': 'GSK',
    'glaxosmithkline': 'GSK',
    'novartis': 'Novartis',
    'pfizer': 'Pfizer'
  };
  const key = s.toLowerCase();
  for (const k in map) {
    if (key.includes(k)) return map[k];
  }
  return s;
}
