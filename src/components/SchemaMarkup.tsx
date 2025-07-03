
import { Helmet } from 'react-helmet-async';

interface SchemaMarkupProps {
  type: 'WebApplication' | 'FAQPage' | 'Article' | 'Organization' | 'Drug' | 'MedicalWebPage' | 'SearchResultsPage' | 'WebSite';
  data: any;
}

const SchemaMarkup = ({ type, data }: SchemaMarkupProps) => {
  const getSchemaData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type,
      ...data
    };

    // Add healthcare-specific properties for WebApplication
    if (type === 'WebApplication') {
      return {
        ...baseData,
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Web",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "permissions": "camera",
        "featureList": data.featureList || [
          "AI-powered medication identification",
          "Comprehensive drug database",
          "Side effects and interactions information",
          "Dosage guidelines",
          "Visual pill identification"
        ]
      };
    }
    
    // Add specific properties for Drug schema
    if (type === 'Drug') {
      return {
        ...baseData,
        "@type": "Drug",
        "name": data.name,
        "activeIngredient": data.genericName || data.name,
        "description": data.description,
        "drugClass": data.drugClass,
        "manufacturer": {
          "@type": "Organization",
          "name": data.manufacturer
        },
        "prescriptionStatus": data.prescriptionStatus,
        "dosageForm": data.category,
        "indication": data.indications,
        "contraindication": data.contraindications,
        "sideEffect": data.sideEffects,
        "drugInteraction": data.interactions,
        "url": data.url,
        "isPartOf": {
          "@type": "WebSite",
          "name": "PharmaLens",
          "url": "https://pharmalens.com"
        }
      };
    }
    
    // Add specific properties for MedicalWebPage schema
    if (type === 'MedicalWebPage') {
      return {
        ...baseData,
        "@type": "MedicalWebPage",
        "about": {
          "@type": "Drug",
          "name": data.drugName,
          "activeIngredient": data.genericName
        },
        "specialty": "Pharmacy",
        "audience": {
          "@type": "Audience",
          "audienceType": "Patient"
        },
        "lastReviewed": new Date().toISOString().split('T')[0]
      };
    }
    
    // Add specific properties for SearchResultsPage schema
    if (type === 'SearchResultsPage') {
      return {
        ...baseData,
        "@type": "SearchResultsPage",
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": data.numberOfItems,
          "itemListElement": data.results
        },
        "specialty": "Pharmacy",
        "audience": {
          "@type": "Audience",
          "audienceType": "Patient"
        }
      };
    }
    
    // Add specific properties for WebSite schema
    if (type === 'WebSite') {
      return {
        ...baseData,
        "@type": "WebSite",
        "potentialAction": {
          "@type": "SearchAction",
          "target": data.searchAction?.target || "https://pharmalens.tech/search?q={search_term_string}",
          "query-input": data.searchAction?.queryInput || "required name=search_term_string"
        }
      };
    }

    return baseData;
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(getSchemaData())}
      </script>
    </Helmet>
  );
};

export default SchemaMarkup;
