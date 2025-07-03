// SEO utility functions for generating canonical URLs and meta data

export interface DrugSEOData {
  canonicalUrl: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  structuredData: object;
}

// Generate SEO-friendly slug from drug name
export const generateDrugSlug = (drugName: string, genericName?: string): string => {
  const name = drugName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  return name;
};

// Generate canonical URL for drug page
export const generateCanonicalUrl = (drugId: string, drugName: string, baseUrl: string = 'https://pharmalens.com'): string => {
  const slug = generateDrugSlug(drugName);
  return `${baseUrl}/drug/${slug}-${drugId}`;
};

// Generate SEO meta title
export const generateMetaTitle = (drugName: string, genericName?: string, category?: string): string => {
  const title = `${drugName} (${genericName || drugName})`;
  const categoryText = category ? ` - ${category}` : '';
  return `${title}${categoryText} | Complete Drug Information | PharmaLens`;
};

// Generate SEO meta description
export const generateMetaDescription = (drugName: string, genericName?: string, category?: string, description?: string): string => {
  const baseDesc = `Complete information about ${drugName} (${genericName || drugName})`;
  const categoryText = category ? ` - ${category} medication` : '';
  const descText = description ? `. ${description.substring(0, 100)}...` : '';
  return `${baseDesc}${categoryText}. Dosage, side effects, interactions, contraindications${descText} | PharmaLens`;
};

// Generate keywords for SEO
export const generateKeywords = (drugName: string, genericName?: string, category?: string, drugClass?: string, brandNames?: string[]): string[] => {
  const keywords = [
    drugName.toLowerCase(),
    'drug information',
    'medication details',
    'dosage',
    'side effects',
    'drug interactions',
    'prescription information'
  ];
  
  if (genericName) {
    keywords.push(genericName.toLowerCase());
  }
  
  if (category) {
    keywords.push(category.toLowerCase());
    keywords.push(`${category.toLowerCase()} medication`);
  }
  
  if (drugClass) {
    keywords.push(drugClass.toLowerCase());
  }
  
  if (brandNames) {
    brandNames.forEach(brand => {
      keywords.push(brand.toLowerCase());
    });
  }
  
  return [...new Set(keywords)]; // Remove duplicates
};

// Generate structured data for Google Rich Snippets
export const generateStructuredData = (drug: any): object => {
  return {
    "@context": "https://schema.org",
    "@type": "Drug",
    "name": drug.name,
    "activeIngredient": drug.genericName || drug.name,
    "description": drug.description,
    "drugClass": drug.drugClass,
    "manufacturer": {
      "@type": "Organization",
      "name": drug.manufacturer
    },
    "prescriptionStatus": drug.prescriptionStatus,
    "dosageForm": drug.category,
    "indication": drug.indications,
    "contraindication": drug.contraindications,
    "sideEffect": drug.sideEffects,
    "drugInteraction": drug.interactions,
    "url": generateCanonicalUrl(drug.id, drug.name),
    "isPartOf": {
      "@type": "WebSite",
      "name": "PharmaLens",
      "url": "https://pharmalens.com"
    }
  };
};

// Generate complete SEO data for a drug
export const generateDrugSEOData = (drug: any, baseUrl: string = 'https://pharmalens.com'): DrugSEOData => {
  const slug = generateDrugSlug(drug.name, drug.genericName);
  const canonicalUrl = generateCanonicalUrl(drug.id, drug.name, baseUrl);
  const metaTitle = generateMetaTitle(drug.name, drug.genericName, drug.category);
  const metaDescription = generateMetaDescription(drug.name, drug.genericName, drug.category, drug.description);
  const keywords = generateKeywords(drug.name, drug.genericName, drug.category, drug.drugClass, drug.brandNames);
  const structuredData = generateStructuredData(drug);
  
  return {
    canonicalUrl,
    slug,
    metaTitle,
    metaDescription,
    keywords,
    structuredData
  };
};

// Generate sitemap entries for all drugs
export const generateDrugSitemapEntries = (drugs: any[], baseUrl: string = 'https://pharmalens.com'): string[] => {
  return drugs.map(drug => {
    const canonicalUrl = generateCanonicalUrl(drug.id, drug.name, baseUrl);
    return canonicalUrl;
  });
};

// Generate robots.txt entries for drug pages
export const generateRobotsTxtEntries = (): string[] => {
  return [
    'User-agent: *',
    'Allow: /drug/',
    'Allow: /search',
    'Allow: /category/',
    'Sitemap: https://pharmalens.com/sitemap.xml'
  ];
};