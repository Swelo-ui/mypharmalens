
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

const DrugPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drug, setDrug] = useState<DetailedDrugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (id) {
      const drugData = getDetailedDrugData(id);
      if (drugData) {
        setDrug(drugData);
      }
      setLoading(false);
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-4">
            {drug.image && (
              <div className="hidden sm:block w-1/4 rounded-lg overflow-hidden">
                <img 
                  src={drug.image} 
                  alt={drug.name} 
                  className="w-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {drug.prescriptionStatus === 'Prescription Only' && (
                  <div className="inline-flex items-center bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                    <Clock className="h-3 w-3 text-blue-600 mr-1" />
                    <span className="text-xs font-medium text-blue-600">Prescription Only</span>
                  </div>
                )}
                
                {drug.verified && (
                  <div className="inline-flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <Shield className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-green-600">Verified</span>
                  </div>
                )}
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{drug.name}</h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <span className="font-medium">Generic Name:</span> {drug.genericName}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  {drug.category}
                </span>
                
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                  {drug.manufacturer}
                </span>
              </div>
              
              {drug.image && (
                <div className="sm:hidden mt-4 rounded-lg overflow-hidden">
                  <img 
                    src={drug.image} 
                    alt={drug.name} 
                    className="w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full mb-2 flex overflow-x-auto bg-transparent p-0 no-scrollbar">
            <TabsTrigger value="general" className="flex-1 text-center">
              <span className="block text-[13px] sm:text-sm">General Information</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex-1 text-center">
              <span className="block text-[13px] sm:text-sm">Usage & Precautions</span>
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="flex-1 text-center">
              <span className="block text-[13px] sm:text-sm">Alternatives & Brands</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {drug.description}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Dosage & Administration</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {drug.dosageAndAdmin}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Mechanism of Action</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {drug.mechanism}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Side Effects</h3>
              <ul className="space-y-2">
                {drug.sideEffects.map((effect, i) => (
                  <li key={i} className="flex items-start">
                    <div className="min-w-5 mt-0.5 mr-2">
                      <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{effect}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Drug Interactions</h3>
              <ul className="space-y-2">
                {drug.interactions.map((interaction, i) => (
                  <li key={i} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-pharma-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{interaction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="usage" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Indications</h3>
              <ul className="space-y-2">
                {drug.indications.map((indication, i) => (
                  <li key={i} className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{indication}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Contraindications</h3>
              <ul className="space-y-2">
                {drug.contraindications.map((contraindication, i) => (
                  <li key={i} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{contraindication}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Pregnancy & Lactation</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {drug.pregnancy}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Storage Information</h3>
              <div className="flex items-start">
                <History className="h-4 w-4 text-pharma-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-sm">{drug.storage}</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Warnings & Precautions</h3>
              <ul className="space-y-3">
                {drug.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200 text-sm">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="alternatives" className="space-y-4">
            {drug.brandNames && drug.brandNames.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium mb-3">Brand Names</h3>
                <div className="flex flex-wrap gap-2">
                  {drug.brandNames.map((brand, index) => (
                    <div key={index} className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-pharma-50 dark:bg-pharma-900/20 text-pharma-600 dark:text-pharma-300 text-xs font-medium">
                      {brand}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {drug.similarDrugs && drug.similarDrugs.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium mb-3">Similar Medications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {drug.similarDrugs.map((similar) => (
                    <div 
                      key={similar.id} 
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                      onClick={() => navigate(`/drug/${similar.id}`)}
                    >
                      <div className="w-8 h-8 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-3">
                        <Pill className="h-4 w-4 text-pharma-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{similar.name}</h4>
                        <span className="text-xs text-pharma-600">View details</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                <PanelLeftOpen className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No alternatives found for this medication.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </>
  );
};

export default DrugPage;
