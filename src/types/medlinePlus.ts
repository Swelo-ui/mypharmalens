export interface MedlinePlusSearchParams {
  term: string;
  language?: 'en' | 'es';
  retmax?: number;
  rettype?: 'brief' | 'topic' | 'all';
}

export interface HealthTopicResult {
  title: string;
  url: string;
  snippet?: string;
  summary?: string;
  altTitle?: string;
  groupName?: string;
  organizationName?: string;
}

export interface GeneticCondition {
  title: string;
  description: string;
  inheritancePatterns: string[];
  frequency: string;
  genes: string[];
  snomedCT?: string;
  icd10CM?: string;
  fullSummary?: string;
  causes?: string;
  inheritance?: string;
  relatedHealthConditions?: string[];
}

export interface MedlinePlusCacheItem<T> {
  data: T;
  timestamp: number;
}
