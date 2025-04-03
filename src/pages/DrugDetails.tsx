
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DrugDetails, { DetailedDrugData } from '@/components/DrugDetails';

const DrugDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { drugData, imageUrl, drugName } = location.state || {};

  // If no data is provided, show error state
  if (!drugData) {
    return (
      <>
        <Header />
        <div className="container max-w-4xl mx-auto px-4 pt-24 pb-8 min-h-[70vh] flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-center mb-2">Medication Details Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">We couldn't find the details for this medication.</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Format the drug data for display
  const formattedDrugData: DetailedDrugData = {
    id: drugData.id || 'unknown',
    name: drugName || drugData.name || 'Unknown Medication',
    genericName: drugData.genericName || drugData.generic_name || '',
    manufacturer: drugData.manufacturer || '',
    category: drugData.category || '',
    description: drugData.description || '',
    dosageAndAdmin: drugData.dosageAndAdmin || '',
    sideEffects: Array.isArray(drugData.sideEffects) ? drugData.sideEffects : [],
    warnings: Array.isArray(drugData.warnings) ? drugData.warnings : [],
    interactions: Array.isArray(drugData.interactions) ? drugData.interactions : [],
    storage: drugData.storage || '',
    mechanism: drugData.mechanism || '',
    indications: Array.isArray(drugData.indications) ? drugData.indications : [],
    contraindications: Array.isArray(drugData.contraindications) ? drugData.contraindications : [],
    prescriptionStatus: drugData.prescriptionStatus || 'Unknown',
    pregnancy: drugData.pregnancy || '',
    verified: drugData.verified || false,
    image: imageUrl || drugData.image || '',
    drugClass: drugData.drugClass || drugData.drug_class || '',
    similarDrugs: drugData.similarDrugs || [],
    brandNames: drugData.brandNames || [],
  };

  return (
    <>
      <Header />
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <DrugDetails drug={formattedDrugData} />
      </div>
      <Footer />
    </>
  );
};

export default DrugDetailsPage;
