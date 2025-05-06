
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDetailedDrugData } from '@/data/mockDrugsData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DrugDetails, { DetailedDrugData } from '@/components/DrugDetails';
import BottomNavigation from '@/components/BottomNavigation';
import { fetchDrugById } from '@/integrations/supabase/client';
import { useDrugDetail } from '@/hooks/useDrugDetail';
import { useToast } from '@/hooks/use-toast';

// Interface to match the database structure while supporting camelCase for component props
interface DatabaseDrugData {
  id: string;
  name?: string;
  drug_name?: string; // For history records
  generic_name?: string;
  genericName?: string; // Camel case version
  manufacturer?: string;
  category?: string;
  description?: string;
  dosage_and_admin?: string;
  dosageAndAdmin?: string; // Camel case version
  side_effects?: string[];
  sideEffects?: string[]; // Camel case version
  warnings?: string[];
  interactions?: string[];
  storage?: string;
  mechanism?: string;
  indications?: string[];
  contraindications?: string[];
  prescription_status?: string;
  prescriptionStatus?: string; // Camel case version
  pregnancy?: string;
  verified?: boolean;
  image_url?: string;
  image?: string; // Camel case version
  package_image_url?: string;
  packageImage?: string; // Camel case version
  drug_class?: string;
  drugClass?: string; // Camel case version
  brand_names?: string[];
  brandNames?: string[]; // Camel case version
  similarDrugs?: { id: string; name: string }[]; // Only in camelCase
  details?: any; // For nested details
  created_at?: string;
}

const DrugPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drug, setDrug] = useState<DetailedDrugData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { fetchDrugDetail } = useDrugDetail();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchDrug = async () => {
      try {
        setLoading(true);
        console.log("Fetching drug details for ID:", id);

        // First, try to fetch from the drug database
        let drugData: DatabaseDrugData | null = await fetchDrugById(id);
        console.log("Drug database result:", drugData);
        
        // If not found in the drugs table, it might be a history record
        if (!drugData) {
          // Try to fetch the drug from identification history
          console.log("Not found in database, trying history record");
          const historyRecord = await fetchDrugDetail(id);
          console.log("History record:", historyRecord);
          
          if (historyRecord) {
            drugData = historyRecord;
          }
        }

        // If still not found, try mock data as a fallback (for development)
        if (!drugData) {
          console.log("Not found in history, trying mock data");
          drugData = getDetailedDrugData(id) as unknown as DatabaseDrugData;
        }
        
        if (drugData) {
          console.log("Final drug data:", drugData);
          
          // Transform database format to DetailedDrugData format
          // Prioritize camelCase versions if they exist (from history), otherwise use snake_case
          const formattedDrug: DetailedDrugData = {
            id: drugData.id || id,
            name: drugData.name || drugData.drug_name || "Unknown Medication",
            genericName: drugData.genericName || drugData.generic_name || "",
            manufacturer: drugData.manufacturer || "",
            category: drugData.category || "",
            description: drugData.description || "No description available.",
            dosageAndAdmin: drugData.dosageAndAdmin || drugData.dosage_and_admin || "Information not available.",
            sideEffects: drugData.sideEffects || drugData.side_effects || ["Information not available."],
            warnings: drugData.warnings || ["No specific warnings available."],
            interactions: drugData.interactions || ["No known drug interactions."],
            storage: drugData.storage || "Store at room temperature away from moisture, heat, and light.",
            mechanism: drugData.mechanism || "Mechanism of action information not available.",
            indications: drugData.indications || ["Information not available."],
            contraindications: drugData.contraindications || ["Information not available."],
            prescriptionStatus: (drugData.prescriptionStatus || drugData.prescription_status || "OTC") as 'OTC' | 'Prescription Only' | 'Controlled',
            pregnancy: drugData.pregnancy || "Consult your doctor before use if pregnant or breastfeeding.",
            verified: drugData.verified || false,
            image: drugData.image || drugData.image_url || "",
            packageImage: drugData.packageImage || drugData.package_image_url || "",
            drugClass: drugData.drugClass || drugData.drug_class || "",
            brandNames: drugData.brandNames || drugData.brand_names || [],
            similarDrugs: drugData.similarDrugs || []
          };
          
          setDrug(formattedDrug);
        }
      } catch (error) {
        console.error('Error fetching drug data:', error);
        toast({
          title: "Error",
          description: "Failed to load drug information"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDrug();
  }, [id, fetchDrugDetail, toast]);

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
          <div className="text-center">
            <h1 className="text-2xl font-bold text-center mb-2">Medication Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The medication you're looking for could not be found.</p>
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

  return (
    <>
      <Header />
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-24 mb-16 sm:pb-12 sm:mb-0">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <DrugDetails drug={drug} />
      </div>
      <BottomNavigation />
      <Footer />
    </>
  );
};

export default DrugPage;
