
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ZoomIn, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DetailedDrugData } from '@/components/DrugDetails';
import DrugDetails from '@/components/DrugDetails';
import CameraCapture from '@/components/CameraCapture';
import ImageUpload from '@/components/ImageUpload';
import { mockDrugsData, getDetailedDrugData } from '@/data/mockDrugsData';
import Header from '@/components/Header';
import { supabase, saveDrugIdentification } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DrugIdentify = () => {
  const [identificationMode, setIdentificationMode] = useState<'upload' | 'camera'>('upload');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedDrug, setIdentifiedDrug] = useState<DetailedDrugData | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [blurryMode, setBlurryMode] = useState(false);
  const [isImageLowRes, setIsImageLowRes] = useState(false);

  // Function to identify drug using the Supabase edge function
  const identifyDrugFromImage = async (base64Image: string): Promise<any> => {
    try {
      // Call the identify-drug function
      const { data, error } = await supabase.functions.invoke('identify-drug', {
        body: { 
          imageBase64: base64Image,
          blurryMode: blurryMode || isImageLowRes
        }
      });

      if (error) {
        console.error('Error calling identify-drug function:', error);
        throw new Error(error.message || 'Failed to identify medication');
      }

      return data;
    } catch (error: any) {
      console.error('Error identifying drug:', error);
      throw error;
    }
  };

  // Function to check if an image is likely low resolution or blurry
  const checkImageQuality = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check file size first - small files are likely low quality
      if (file.size < 50 * 1024) {
        setIsImageLowRes(true);
        return resolve(true);
      }

      // Create an Image object to check dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        // If image dimensions are small, consider it low quality
        const isLowRes = img.width < 400 || img.height < 400;
        setIsImageLowRes(isLowRes);
        resolve(isLowRes);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setIsImageLowRes(false);
        resolve(false);
      };
      
      img.src = objectUrl;
    });
  };

  const handleImageCapture = async (file: File) => {
    try {
      setIsIdentifying(true);
      setErrorDetails(null);
      toast.info("Processing your image...");
      
      // Check image quality
      await checkImageQuality(file);
      
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Image = event.target.result.toString();
          setCapturedImage(base64Image);
          
          try {
            // Identify the drug
            const drugData = await identifyDrugFromImage(base64Image);
            
            if (drugData.error) {
              throw new Error(drugData.error);
            }
            
            if (drugData) {
              // Format the drug data to match our DetailedDrugData interface
              const formattedDrugData: DetailedDrugData = {
                id: drugData.id,
                name: drugData.name,
                genericName: drugData.genericName || drugData.name,
                manufacturer: drugData.manufacturer,
                category: drugData.category || 'Unknown',
                description: drugData.description,
                dosageAndAdmin: drugData.dosageAndAdmin || 'Take as directed by your healthcare provider.',
                sideEffects: drugData.sideEffects || [],
                warnings: drugData.warnings || [],
                interactions: drugData.interactions || [],
                storage: drugData.storage || 'Store at room temperature away from moisture, heat, and light.',
                mechanism: drugData.mechanism || 'Mechanism of action not specified.',
                indications: drugData.indications || [],
                contraindications: drugData.contraindications || [],
                prescriptionStatus: drugData.prescriptionStatus as 'OTC' | 'Prescription Only' | 'Controlled',
                pregnancy: drugData.pregnancy || 'Consult your healthcare provider before using during pregnancy.',
                verified: false,
                image: drugData.image,
                drugClass: drugData.drugClass || 'Not specified',
              };
              
              // Save the identification to Supabase
              try {
                await saveDrugIdentification({
                  drug_name: drugData.name,
                  image_url: drugData.image,
                  details: drugData
                });
                console.log('Saved drug identification to Supabase');
              } catch (saveError) {
                console.error('Failed to save drug identification:', saveError);
                // Don't block the UI for database errors
              }
              
              setIdentifiedDrug(formattedDrugData);
              toast.success(`Medication ${drugData.blurryModeUsed ? 'possibly' : 'successfully'} identified as ${drugData.name}!`);
              
              // Show different message based on confidence
              if (drugData.blurryModeUsed || drugData.confidence === 'low') {
                toast.info("Note: Image quality was low. Identification may not be fully accurate.", { duration: 5000 });
              }
            } else {
              setErrorDetails("Could not identify medication from the image. Try uploading an image with clearer text or labeling.");
              toast.error("Could not identify the medication. Please try again with a clearer image.");
            }
          } catch (error: any) {
            console.error('Error processing image:', error);
            setErrorDetails(`Error: ${error.message || "Unknown error"}`);
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
    setIsImageLowRes(false);
  };

  // Function for manual search as fallback
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
              
              <div className="mb-4 flex items-center justify-center space-x-2">
                <Switch 
                  id="blur-mode" 
                  checked={blurryMode}
                  onCheckedChange={setBlurryMode}
                />
                <Label htmlFor="blur-mode" className="cursor-pointer">
                  Enhanced mode for blurry images
                </Label>
                {isImageLowRes && (
                  <span className="text-xs text-amber-500 ml-2">
                    (Recommended for this image)
                  </span>
                )}
              </div>
              
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
                <li className="flex items-start">
                  <ZoomIn className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-pharma-600" />
                  <span>Use good lighting and ensure the pill is clearly visible</span>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 mr-2 mt-1 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded" />
                  <span>Place the medication against a plain, contrasting background</span>
                </li>
                <li className="flex items-start">
                  <RotateCw className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-pharma-600" />
                  <span>Try multiple angles if identification fails initially</span>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 mr-2 mt-1 flex-shrink-0 rounded-full border border-pharma-600" />
                  <span>Make sure any markings, logos, or text are visible</span>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 mr-2 mt-1 flex-shrink-0 bg-pharma-100 rounded-sm" />
                  <span>Include the packaging if available for better accuracy</span>
                </li>
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
