
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailedDrugData } from '@/components/DrugDetails';
import DrugDetails from '@/components/DrugDetails';
import CameraCapture from '@/components/CameraCapture';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DrugIdentify = () => {
  const [identificationMode, setIdentificationMode] = useState<'upload' | 'camera'>('upload');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedDrug, setIdentifiedDrug] = useState<DetailedDrugData | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleImageCapture = async (file: File) => {
    try {
      setIsIdentifying(true);
      setErrorDetails(null);
      toast.info("Processing your image...");
      
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Image = event.target.result.toString();
          setCapturedImage(base64Image);
          
          try {
            console.log("Sending image to identify-drug function...");
            const { data, error } = await supabase.functions.invoke('identify-drug', {
              body: { imageBase64: base64Image },
            });
            
            if (error) {
              console.error('Error calling identify-drug function:', error);
              setErrorDetails(`API Error: ${error.message}`);
              toast.error("Failed to identify medication. Please try again.");
              setIsIdentifying(false);
              return;
            }
            
            console.log("Received response:", data);
            
            if (data && data.name && data.name !== "Unknown Medication") {
              try {
                const { error: saveError } = await supabase
                  .from('drug_identifications')
                  .insert([
                    {
                      image_url: base64Image,
                      drug_name: data.name,
                      details: data
                    }
                  ]);
                
                if (saveError) {
                  console.error('Error saving identification result:', saveError);
                }
              } catch (dbError) {
                console.error('Database error:', dbError);
              }
              
              setIdentifiedDrug(data);
              toast.success("Medication successfully identified!");
            } else if (data && data.error) {
              setErrorDetails(`Analysis Error: ${data.error}`);
              toast.error("Failed to analyze the image. Please try again.");
            } else {
              setErrorDetails("The AI could not identify this medication with confidence. Try a clearer image or different angle.");
              toast.error("Could not identify the medication. Please try again.");
            }
          } catch (apiError: any) {
            console.error('API error:', apiError);
            setErrorDetails(`API Error: ${apiError.message || "Unknown error"}`);
            toast.error("Failed to process the image. Please try another image.");
          } finally {
            setIsIdentifying(false);
          }
        }
      };
      
      reader.onerror = () => {
        toast.error("Failed to read the image file. Please try another image.");
        setIsIdentifying(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error: any) {
      console.error("Error identifying medication:", error);
      setErrorDetails(`Unexpected Error: ${error.message || "Unknown error"}`);
      toast.error("An unexpected error occurred. Please try again.");
      setIsIdentifying(false);
    }
  };

  const handleRetry = () => {
    setIdentifiedDrug(null);
    setErrorDetails(null);
    setCapturedImage(null);
  };

  // Add a function for manual entry as fallback
  const handleManualSearch = () => {
    // For now, we'll just reset the state and let the user try again
    handleRetry();
    toast.info("Please try uploading a clearer image or a different angle");
  };

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold text-center mb-8">Identify Medication</h1>
        
        {!identifiedDrug ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <Button
                  variant={identificationMode === 'upload' ? 'default' : 'outline'}
                  onClick={() => setIdentificationMode('upload')}
                  className="rounded-l-md rounded-r-none"
                >
                  Upload Image
                </Button>
                <Button
                  variant={identificationMode === 'camera' ? 'default' : 'outline'}
                  onClick={() => setIdentificationMode('camera')}
                  className="rounded-r-md rounded-l-none"
                >
                  Use Camera
                </Button>
              </div>
            </div>
            
            {errorDetails && capturedImage && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Identification Failed</AlertTitle>
                <AlertDescription>
                  {errorDetails}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Button size="sm" onClick={handleRetry}>Try Again</Button>
                    <Button size="sm" variant="outline" onClick={handleManualSearch}>
                      Try a Different Image
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-8">
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                {identificationMode === 'upload' 
                  ? "Upload a clear image of the medication for identification" 
                  : "Take a clear photo of the medication for identification"}
              </p>
              
              {identificationMode === 'upload' ? (
                <ImageUpload onImageCapture={handleImageCapture} />
              ) : (
                <CameraCapture onImageCapture={handleImageCapture} />
              )}
              
              {isIdentifying && (
                <div className="mt-4 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Analyzing medication image...</span>
                </div>
              )}
            </div>
            
            <div className="bg-pharma-50 dark:bg-pharma-900/20 rounded-2xl p-6">
              <h3 className="font-medium text-lg mb-4">Tips for better identification:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Ensure good lighting when taking the photo</li>
                <li>Position the medication against a plain background</li>
                <li>Make sure any text, logos, or markings are visible</li>
                <li>If the medication has a unique shape or color, capture it clearly</li>
                <li>Include the packaging if available for better accuracy</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Identification Result</h2>
              <Button variant="outline" onClick={handleRetry}>
                Identify Another
              </Button>
            </div>
            <DrugDetails drug={identifiedDrug} />
          </div>
        )}
      </div>
    </>
  );
};

export default DrugIdentify;
