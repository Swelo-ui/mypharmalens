
import { Helmet } from 'react-helmet-async';

interface SchemaMarkupProps {
  type: 'WebApplication' | 'FAQPage' | 'Article' | 'Organization';
  data: Record<string, unknown>;
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
