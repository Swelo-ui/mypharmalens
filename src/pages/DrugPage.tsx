import React, { useEffect, useState } from 'react';
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

const DrugPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drug, setDrug] = useState<DetailedDrugData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log("DrugPage loaded with ID:", id);
    if (id) {
      // Add a small delay to ensure data is loaded properly
      const timer = setTimeout(async () => {
        try {
          const drugData = await getDrugById(id);
          
          console.log("Drug data retrieved:", drugData?.name);
          console.log("Drug data laymanExplanations:", drugData?.laymanExplanations ? "EXISTS" : "MISSING");
          if (drugData) {
            // Convert DrugData to DetailedDrugData by ensuring required fields
            const detailedDrugData: DetailedDrugData = {
              ...drugData,
              genericName: drugData.genericName || drugData.name, // Use name as fallback if genericName is missing
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

  if (loading) {
    return (
      <>
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
