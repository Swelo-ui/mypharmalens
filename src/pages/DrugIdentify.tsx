
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import CameraCapture from '@/components/CameraCapture';
import ImageUpload from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// Define the DrugIdentification interface
interface DrugIdentification {
  id?: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  markings?: string;
  color?: string;
  shape?: string;
  imprint?: string;
  confidence?: string | number;
  verified?: boolean;
  image?: string;
  drugClass?: string;
}

const DrugIdentify = () => {
  const [activeTab, setActiveTab] = useState<string>('camera');
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [identificationResult, setIdentificationResult] = useState<DrugIdentification | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const { isAuthenticated } = useAuthStatus();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Reset state when component mounts
  useEffect(() => {
    setIdentificationResult(null);
    setCapturedImage(null);
    setShowResults(false);
  }, []);

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const resetIdentification = () => {
    setCapturedImage(null);
    setIdentificationResult(null);
    setShowResults(false);
  };

  const identifyDrug = async () => {
    if (!capturedImage) {
      toast.error('Please capture or upload an image first');
      return;
    }

    setIsIdentifying(true);
    setShowResults(false);

    try {
      const formData = new FormData();
      
      // Convert base64 to blob
      const byteCharacters = atob(capturedImage.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      // Append the file to formData
      formData.append('image', blob, 'drug-image.jpg');

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('identify-drug', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      // Process and set identification result
      if (data) {
        setIdentificationResult(data);
        setShowResults(true);
        
        // Save to history if user is authenticated
        if (isAuthenticated) {
          try {
            await saveToHistory(data, capturedImage);
          } catch (historyError) {
            console.error('Error saving to history:', historyError);
            // Continue showing results even if history save fails
          }
        }
      }
    } catch (err) {
      console.error('Error identifying drug:', err);
      toast.error('Failed to identify medication. Please try again.');
    } finally {
      setIsIdentifying(false);
    }
  };

  const saveToHistory = async (drugData: DrugIdentification, imageUrl: string) => {
    try {
      // Upload image to storage if needed
      let finalImageUrl = imageUrl;
      
      // If the image is a data URL, upload it to storage
      if (imageUrl.startsWith('data:')) {
        const fileName = `drug-images/${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('drug-images')
          .upload(fileName, decode(imageUrl), {
            contentType: 'image/jpeg',
            upsert: false,
          });
          
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('drug-images')
          .getPublicUrl(fileName);
          
        finalImageUrl = publicUrl;
      }
      
      // Save to drug_identifications table
      const { error } = await supabase
        .from('drug_identifications')
        .insert({
          drug_name: drugData.name,
          image_url: finalImageUrl,
          details: drugData,
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error saving to history:', error);
      throw error;
    }
  };
  
  // Helper function to decode base64 data URL
  const decode = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const viewDrugDetails = () => {
    if (identificationResult && identificationResult.id) {
      navigate(`/drug/${identificationResult.id}`);
    } else {
      toast.error('Detailed information not available for this medication');
    }
  };

  return (
    <>
      <Header />
      <div className={`min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 pt-16 ${isMobile ? 'pb-20' : 'pb-10'}`}>
        <div className="container mx-auto px-4 py-8">
          {/* Content Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Identify Medication</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Take or upload a photo of your medication to identify it
            </p>
          </div>

          {/* Main content area */}
          <div className="max-w-2xl mx-auto">
            {showResults ? (
              // Results view
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Identification Results
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetIdentification}
                    className="text-gray-500 dark:text-gray-400"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                </div>
                
                {identificationResult ? (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {capturedImage && (
                        <div className="w-full md:w-1/3">
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img 
                              src={capturedImage} 
                              alt="Captured medication" 
                              className="w-full h-auto object-cover"
                              onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="w-full md:w-2/3 space-y-3">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {identificationResult.name}
                          </h3>
                          {identificationResult.genericName && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {identificationResult.genericName}
                            </p>
                          )}
                        </div>
                        
                        {identificationResult.manufacturer && (
                          <p className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Manufacturer:</span>
                            <span className="ml-2">{identificationResult.manufacturer}</span>
                          </p>
                        )}
                        
                        {identificationResult.category && (
                          <p className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Category:</span>
                            <span className="ml-2">{identificationResult.category}</span>
                          </p>
                        )}
                        
                        {identificationResult.drugClass && (
                          <p className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Drug Class:</span>
                            <span className="ml-2">{identificationResult.drugClass}</span>
                          </p>
                        )}
                        
                        <div className="pt-3">
                          <Button onClick={viewDrugDetails}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {identificationResult.description && (
                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{identificationResult.description}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Info className="h-4 w-4 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Always verify medication information with a healthcare professional
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Identification Failed
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      We couldn't identify this medication. Please try again with a clearer image.
                    </p>
                    <Button onClick={resetIdentification}>Try Again</Button>
                  </div>
                )}
              </div>
            ) : (
              // Capture view
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="camera" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span>Camera</span>
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="camera" className="p-0">
                    <CameraCapture onCapture={handleImageCapture} />
                  </TabsContent>
                  
                  <TabsContent value="upload" className="p-4">
                    <ImageUpload onUpload={handleImageCapture} />
                  </TabsContent>
                </Tabs>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={identifyDrug}
                    disabled={isIdentifying || !capturedImage}
                    className="w-full"
                  >
                    {isIdentifying ? 'Identifying...' : 'Identify Medication'}
                  </Button>
                  
                  {!isAuthenticated && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
                      <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                      <p className="text-gray-600 dark:text-gray-300">
                        <a href="/auth" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign in</a> to save your identification history
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DrugIdentify;
