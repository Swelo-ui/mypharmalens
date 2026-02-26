import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Pill, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDrugById } from '@/data/drugDataLoader';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DrugDetails, { DetailedDrugData } from '@/components/DrugDetails';
import { toast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';

const DrugPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drug, setDrug] = useState<DetailedDrugData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      const timer = setTimeout(async () => {
        try {
          const drugData = await getDrugById(id);
          
          if (drugData) {
            const detailedDrugData: DetailedDrugData = {
              ...drugData,
              genericName: drugData.genericName || drugData.name,
              manufacturer: drugData.manufacturer || 'Unknown',
              category: drugData.category || 'Uncategorized',
              description: drugData.description || '',
              dosageAndAdmin: drugData.dosageAndAdmin || '',
              sideEffects: drugData.sideEffects || [],
              warnings: drugData.warnings || [],
              interactions: drugData.interactions || [],
              storage: drugData.storage || '',
              mechanism: drugData.mechanism || '',
              indications: drugData.indications || [],
              contraindications: drugData.contraindications || [],
              prescriptionStatus: drugData.prescriptionStatus || 'OTC',
              pregnancy: drugData.pregnancy || '',
              verified: drugData.verified || false
            };
            setDrug(detailedDrugData);
          } else {
            toast("Failed to load medication data.");
          }
        } catch (error) {
          console.error("Error loading drug data:", error);
          toast("Failed to load medication data.");
        }
        setLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [id]);

  // Build structured data for Drug schema markup
  const drugStructuredData = useMemo(() => {
    if (!drug) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Drug",
      "name": drug.name,
      "alternateName": drug.genericName !== drug.name ? drug.genericName : undefined,
      "description": drug.description,
      "url": `https://pharmalens.tech/drug/${id}`,
      "medicineSystem": "WesternConventional",
      "nonProprietaryName": drug.genericName,
      "manufacturer": {
        "@type": "Organization",
        "name": drug.manufacturer
      },
      "drugClass": drug.drugClass || drug.category,
      "prescriptionStatus": drug.prescriptionStatus === 'OTC' ? 'OTC' : 'PrescriptionOnly',
      "warning": drug.warnings?.length ? drug.warnings.join('. ') : undefined,
      "administrationRoute": drug.dosageAndAdmin || undefined,
      "isAvailableGenerically": true,
      "mechanismOfAction": drug.mechanism || undefined,
      "pregnancyWarning": drug.pregnancy || undefined,
    };
  }, [drug, id]);

  // Generate SEO description from drug data
  const seoDescription = useMemo(() => {
    if (!drug) return '';
    const desc = drug.description || '';
    const truncated = desc.length > 155 ? desc.substring(0, 152) + '...' : desc;
    return `${drug.name} (${drug.genericName}) - ${truncated} Learn about dosage, side effects, interactions, and warnings on PharmaLens.`;
  }, [drug]);

  // Generate SEO keywords
  const seoKeywords = useMemo(() => {
    if (!drug) return '';
    const keywords = [
      drug.name,
      drug.genericName,
      drug.category,
      drug.manufacturer,
      `${drug.name} side effects`,
      `${drug.name} dosage`,
      `${drug.name} uses`,
      `${drug.genericName} information`,
      'medication information',
      'drug details',
      'PharmaLens'
    ];
    return keywords.filter(Boolean).join(', ');
  }, [drug]);

  if (loading) {
    return (
      <>
        <SEOHead
          title="Loading Medication Information"
          description="Loading detailed medication information on PharmaLens - your AI-powered medication identification platform."
          canonicalUrl={`/drug/${id}`}
        />
        <Header />
        <div className="container max-w-4xl mx-auto px-4 pt-24 pb-8 min-h-[70vh] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!drug) {
    return (
      <>
        <SEOHead
          title="Medication Not Found"
          description="The medication you're looking for could not be found on PharmaLens."
          canonicalUrl={`/drug/${id}`}
          noIndex={true}
        />
        <Header />
        <div className="container max-w-4xl mx-auto px-4 pt-24 pb-8 min-h-[70vh] flex flex-col items-center justify-center">
          <Pill className="h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-center mb-2">Medication Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The medication you're looking for could not be found.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={`${drug.name} (${drug.genericName}) - Drug Information`}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={`/drug/${id}`}
        ogType="article"
        structuredData={drugStructuredData}
      />
      <Header />
      <div className="container max-w-4xl mx-auto px-4 pt-20 pb-28 sm:pb-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <DrugDetails drug={drug} />
      </div>
      <Footer />
    </>
  );
};

export default DrugPage;
