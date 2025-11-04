// Type definitions for multi-source drug API

export interface ComprehensiveDrugInfo {
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  drugClass: string;
  description: string;
  dosageAndAdmin: string;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  storage: string;
  mechanism: string;
  indications: string[];
  contraindications: string[];
  prescriptionStatus: string;
  pregnancy: string;
  brandNames: string[];
  verified: boolean;
  sources: {
    drugscom?: string;
    medlineplus?: string;
    fda?: string;
    rxlist?: string;
    dailymed?: string;
  };
  completeness: number; // 0-100 score based on available information
}

export interface ApiResponse {
  success: boolean;
  data?: ComprehensiveDrugInfo;
  error?: string;
  searchAttempts: string[];
  processingTime: number;
  sourcesUsed: string[];
  fromCache?: boolean;
}

export interface CachedDrugData {
  id: string;
  drug_name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  drug_class: string;
  description: string;
  dosage_and_admin: string;
  side_effects: string[];
  warnings: string[];
  interactions: string[];
  storage: string;
  mechanism: string;
  indications: string[];
  contraindications: string[];
  prescription_status: string;
  pregnancy: string;
  brand_names: string[];
  sources_used: string[];
  completeness_score: number;
  verified: boolean;
  confidence: string;
  imprint?: string;
  color?: string;
  shape?: string;
}
