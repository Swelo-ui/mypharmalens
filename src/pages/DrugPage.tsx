
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Pill, Shield, AlertCircle, History, ThumbsUp, 
  ThumbsDown, Clock, ArrowLeft, PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDetailedDrugData } from '@/data/mockDrugsData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DetailedDrugData } from '@/components/DrugDetails';
import { cn } from '@/lib/utils';
import BottomNavigation from '@/components/BottomNavigation';
import { fetchDrugById } from '@/integrations/supabase/client';
import { useDrugDetail } from '@/hooks/useDrugDetail';
import { useToast } from '@/hooks/use-toast';

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

        // First, try to fetch from the drug database
        let drugData = await fetchDrugById(id);
        
        // If not found in the drugs table, it might be a history record
        if (!drugData) {
          // Try to fetch the drug from identification history
          const historyRecord = await fetchDrugDetail(id);
          
          if (historyRecord) {
            // Could have details directly or nested in a details property
            if (historyRecord.details) {
              // Could be stored as a string (JSON)
              if (typeof historyRecord.details === 'string') {
                try {
                  drugData = JSON.parse(historyRecord.details);
                } catch (e) {
                  console.error('Failed to parse drug details:', e);
                }
              } else if (typeof historyRecord.details === 'object') {
                // Or directly as an object
                drugData = historyRecord.details;
              }
            } else {
              // Or the history record itself might have all the data
              drugData = historyRecord;
            }
          }
        }

        // If still not found, try mock data as a fallback (for development)
        if (!drugData) {
          drugData = getDetailedDrugData(id);
        }
        
        if (drugData) {
          // Transform to DetailedDrugData format, mapping snake_case to camelCase
          const formattedDrug: DetailedDrugData = {
            id: drugData.id || id,
            name: drugData.name || drugData.drug_name || "Unknown Medication",
            genericName: drugData.generic_name || drugData.genericName || "",
            manufacturer: drugData.manufacturer || "",
            category: drugData.category || "",
            description: drugData.description || "No description available.",
            dosageAndAdmin: drugData.dosage_and_admin || drugData.dosageAndAdmin || "Information not available.",
            sideEffects: drugData.side_effects || drugData.sideEffects || ["Information not available."],
            warnings: drugData.warnings || ["No specific warnings available."],
            interactions: drugData.interactions || ["No known drug interactions."],
            storage: drugData.storage || "Store at room temperature away from moisture, heat, and light.",
            mechanism: drugData.mechanism || "Mechanism of action information not available.",
            indications: drugData.indications || ["Information not available."],
            contraindications: drugData.contraindications || ["Information not available."],
            prescriptionStatus: drugData.prescription_status || drugData.prescriptionStatus || "OTC",
            pregnancy: drugData.pregnancy || "Consult your doctor before use if pregnant or breastfeeding.",
            verified: drugData.verified || false,
            image: drugData.image_url || drugData.image || "",
            packageImage: drugData.package_image_url || drugData.packageImage || "",
            drugClass: drugData.drug_class || drugData.drugClass || "",
            brandNames: drugData.brand_names || drugData.brandNames || [],
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
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-24 mb-16 sm:pb-12 sm:mb-0">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to search
        </Button>

        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {drug.verified && (
                  <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    <Shield className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-green-600">Verified</span>
                  </div>
                )}
                
                <div className="flex items-center bg-pharma-50 dark:bg-pharma-900/20 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3 text-pharma-600 mr-1" />
                  <span className="text-xs font-medium text-pharma-600">{drug.prescriptionStatus}</span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-1">{drug.name}</h1>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                <span className="font-medium">Generic Name:</span> {drug.genericName}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  {drug.category}
                </span>
                
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                  {drug.manufacturer}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Description</h2>
            <p className="text-gray-700 dark:text-gray-300">
              {drug.description}
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full mb-8">
          {/* Updated tabs layout to prevent overlap on mobile */}
          <TabsList className="flex w-full mb-6 overflow-x-auto">
            <TabsTrigger value="general" className="flex-1 px-2 py-2 text-center font-medium text-sm sm:text-base whitespace-normal">
              General Information
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex-1 px-2 py-2 text-center font-medium text-sm sm:text-base whitespace-normal">
              Usage & Precautions
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="flex-1 px-2 py-2 text-center font-medium text-sm sm:text-base whitespace-normal">
              Alternatives & Brands
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-4">Dosage & Administration</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {drug.dosageAndAdmin}
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-4">Mechanism of Action</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {drug.mechanism}
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-4">Side Effects</h3>
              <ul className="space-y-2">
                {drug.sideEffects.map((effect, i) => (
                  <li key={i} className="flex items-start">
                    <ThumbsDown className="h-4 w-4 text-amber-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{effect}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-4">Drug Interactions</h3>
              <ul className="space-y-2">
                {drug.interactions.map((interaction, i) => (
                  <li key={i} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-pharma-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{interaction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="usage" className="space-y-4">
            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-4">Indications</h3>
              <ul className="space-y-2">
                {drug.indications.map((indication, i) => (
                  <li key={i} className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{indication}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-4">Contraindications</h3>
              <ul className="space-y-2">
                {drug.contraindications.map((contraindication, i) => (
                  <li key={i} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{contraindication}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-4">Pregnancy & Lactation</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {drug.pregnancy}
              </p>
            </div>
            
            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-medium text-lg mb-4">Storage Information</h3>
              <div className="flex items-start">
                <History className="h-4 w-4 text-pharma-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-sm">{drug.storage}</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="alternatives" className="space-y-4">
            {drug.similarDrugs && drug.similarDrugs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {drug.similarDrugs.map((similar) => (
                  <div 
                    key={similar.id} 
                    className="glass-card p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/drug/${similar.id}`)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-3">
                        <Pill className="h-4 w-4 text-pharma-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{similar.name}</h4>
                        <span 
                          className="text-xs text-pharma-600 hover:text-pharma-700 transition-colors hover:underline"
                        >
                          View details
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-6 text-center rounded-xl">
                <PanelLeftOpen className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No alternatives found for this medication.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="glass-card p-6 rounded-xl">
          <h3 className="font-medium text-lg mb-4">Warnings & Precautions</h3>
          <ul className="space-y-3">
            {drug.warnings.map((warning, i) => (
              <li key={i} className="flex items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-800 dark:text-gray-200">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <BottomNavigation />
      <Footer />
    </>
  );
};

export default DrugPage;
