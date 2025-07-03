import { combinedDrugsData } from '@/data/combinedDrugsData';
import { generateDrugSlug } from './seoUtils';

// Generate XML sitemap for all drug pages
export const generateDrugsSitemap = (): string => {
  const baseUrl = 'https://pharmalens.com';
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  
  // Add main pages
  const mainPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/search', priority: '0.9', changefreq: 'daily' },
    { url: '/identify', priority: '0.8', changefreq: 'weekly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/faq', priority: '0.6', changefreq: 'monthly' },
    { url: '/help', priority: '0.6', changefreq: 'monthly' },
    { url: '/contact', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' }
  ];
  
  mainPages.forEach(page => {
    sitemap += `  <url>
`;
    sitemap += `    <loc>${baseUrl}${page.url}</loc>
`;
    sitemap += `    <lastmod>${currentDate}</lastmod>
`;
    sitemap += `    <changefreq>${page.changefreq}</changefreq>
`;
    sitemap += `    <priority>${page.priority}</priority>
`;
    sitemap += `  </url>
`;
  });
  
  // Add drug pages with multiple URL patterns for better SEO
  combinedDrugsData.forEach(drug => {
    const slug = generateDrugSlug(drug.name, drug.genericName);
    
    // Primary drug URL
    sitemap += `  <url>
`;
    sitemap += `    <loc>${baseUrl}/drug/${drug.id}</loc>
`;
    sitemap += `    <lastmod>${currentDate}</lastmod>
`;
    sitemap += `    <changefreq>weekly</changefreq>
`;
    sitemap += `    <priority>0.8</priority>
`;
    sitemap += `  </url>
`;
    
    // SEO-friendly URLs
    const seoUrls = [
      `/drugs/${slug}`,
      `/medication/${slug}`,
      `/medicine/${slug}`
    ];
    
    seoUrls.forEach(url => {
      sitemap += `  <url>
`;
      sitemap += `    <loc>${baseUrl}${url}</loc>
`;
      sitemap += `    <lastmod>${currentDate}</lastmod>
`;
      sitemap += `    <changefreq>weekly</changefreq>
`;
      sitemap += `    <priority>0.8</priority>
`;
      sitemap += `  </url>
`;
    });
  });
  
  sitemap += `</urlset>`;
  return sitemap;
};

// Generate robots.txt content
export const generateRobotsTxt = (): string => {
  const baseUrl = 'https://pharmalens.com';
  
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-drugs.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /drug/
Allow: /drugs/
Allow: /medication/
Allow: /medicine/
Allow: /search
Allow: /identify
Allow: /about
Allow: /faq
Allow: /help
Allow: /contact`;
};

// Generate structured data for drug pages
export const generateDrugStructuredData = (drug: any) => {
  const baseUrl = 'https://pharmalens.com';
  const slug = generateDrugSlug(drug.name, drug.genericName);
  
  return {
    "@context": "https://schema.org",
    "@type": "Drug",
    "name": drug.name,
    "alternateName": drug.genericName || drug.name,
    "description": drug.description,
    "manufacturer": {
      "@type": "Organization",
      "name": drug.manufacturer
    },
    "drugClass": drug.drugClass,
    "activeIngredient": drug.genericName || drug.name,
    "dosageForm": "Various forms available",
    "url": `${baseUrl}/drugs/${slug}`,
    "sameAs": [
      `${baseUrl}/drug/${drug.id}`,
      `${baseUrl}/medication/${slug}`,
      `${baseUrl}/medicine/${slug}`
    ],
    "category": drug.category,
    "brand": drug.brandNames || [],
    "isAvailableGenerically": drug.genericName ? true : false,
    "prescriptionStatus": drug.prescriptionStatus || "Consult healthcare provider",
    "medicalSpecialty": drug.category,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/search?q=${encodeURIComponent(drug.name)}`,
      "query-input": "required name=q"
    }
  };
};

// Generate category-specific sitemaps
export const generateCategorySitemap = (category: string): string => {
  const baseUrl = 'https://pharmalens.com';
  const currentDate = new Date().toISOString().split('T')[0];
  const categoryDrugs = combinedDrugsData.filter(drug => 
    drug.category?.toLowerCase() === category.toLowerCase()
  );
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  
  categoryDrugs.forEach(drug => {
    const slug = generateDrugSlug(drug.name, drug.genericName);
    
    sitemap += `  <url>
`;
    sitemap += `    <loc>${baseUrl}/drugs/${slug}</loc>
`;
    sitemap += `    <lastmod>${currentDate}</lastmod>
`;
    sitemap += `    <changefreq>weekly</changefreq>
`;
    sitemap += `    <priority>0.8</priority>
`;
    sitemap += `  </url>
`;
  });
  
  sitemap += `</urlset>`;
  return sitemap;
};

// Generate drug index for search engines
export const generateDrugIndex = () => {
  return combinedDrugsData.map(drug => ({
    id: drug.id,
    name: drug.name,
    genericName: drug.genericName,
    brandNames: drug.brandNames,
    category: drug.category,
    drugClass: drug.drugClass,
    manufacturer: drug.manufacturer,
    slug: generateDrugSlug(drug.name, drug.genericName),
    urls: {
      primary: `/drug/${drug.id}`,
      seo: [
        `/drugs/${generateDrugSlug(drug.name, drug.genericName)}`,
        `/medication/${generateDrugSlug(drug.name, drug.genericName)}`,
        `/medicine/${generateDrugSlug(drug.name, drug.genericName)}`
      ]
    },
    searchTerms: [
      drug.name.toLowerCase(),
      drug.genericName?.toLowerCase(),
      ...(drug.brandNames?.map(brand => brand.toLowerCase()) || []),
      drug.category?.toLowerCase(),
      drug.drugClass?.toLowerCase()
    ].filter(Boolean)
  }));
};

// Generate meta tags for drug pages
export const generateDrugMetaTags = (drug: any) => {
  const slug = generateDrugSlug(drug.name, drug.genericName);
  const baseUrl = 'https://pharmalens.com';
  
  return {
    title: `${drug.name} (${drug.genericName || drug.name}) - Complete Drug Information | PharmaLens`,
    description: `Comprehensive information about ${drug.name}${drug.genericName ? ` (${drug.genericName})` : ''}. Find dosage, side effects, interactions, contraindications, and safety information.`,
    keywords: [
      drug.name.toLowerCase(),
      drug.genericName?.toLowerCase(),
      ...(drug.brandNames?.map(brand => brand.toLowerCase()) || []),
      `${drug.name.toLowerCase()} information`,
      `${drug.name.toLowerCase()} side effects`,
      `${drug.name.toLowerCase()} dosage`,
      `${drug.name.toLowerCase()} interactions`,
      drug.category?.toLowerCase(),
      drug.drugClass?.toLowerCase(),
      'drug information',
      'medication details',
      'pharmaceutical reference'
    ].filter(Boolean),
    canonical: `${baseUrl}/drugs/${slug}`,
    alternateUrls: [
      `${baseUrl}/drug/${drug.id}`,
      `${baseUrl}/medication/${slug}`,
      `${baseUrl}/medicine/${slug}`
    ],
    openGraph: {
      title: `${drug.name} - Drug Information`,
      description: `Complete information about ${drug.name}${drug.genericName ? ` (${drug.genericName})` : ''} including dosage, side effects, and interactions.`,
      url: `${baseUrl}/drugs/${slug}`,
      type: 'article',
      image: `${baseUrl}/images/drugs/${slug}-og.jpg`
    },
    twitter: {
      card: 'summary_large_image',
      title: `${drug.name} - Drug Information`,
      description: `Complete information about ${drug.name}${drug.genericName ? ` (${drug.genericName})` : ''} including dosage, side effects, and interactions.`,
      image: `${baseUrl}/images/drugs/${slug}-twitter.jpg`
    },
    structuredData: generateDrugStructuredData(drug)
  };
};

// Export total drug count for SEO
export const getTotalDrugCount = (): number => {
  return combinedDrugsData.length;
};

// Export categories for SEO
export const getAllDrugCategories = (): string[] => {
  const categories = new Set(combinedDrugsData.map(drug => drug.category).filter(Boolean));
  return Array.from(categories).sort();
};

// Export drug classes for SEO
export const getAllDrugClasses = (): string[] => {
  const drugClasses = new Set(combinedDrugsData.map(drug => drug.drugClass).filter(Boolean));
  return Array.from(drugClasses).sort();
};