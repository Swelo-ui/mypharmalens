
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailedDrugData } from '@/components/DrugDetails';
import DrugDetails from '@/components/DrugDetails';
import CameraCapture from '@/components/CameraCapture';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';

const DrugIdentify = () => {
  const [identificationMode, setIdentificationMode] = useState<'upload' | 'camera'>('upload');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedDrug, setIdentifiedDrug] = useState<DetailedDrugData | null>(null);

  const handleImageCapture = async (file: File) => {
    try {
      setIsIdentifying(true);
      toast.info("Processing your image...");
      
      // Convert the image file to base64
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Image = event.target.result.toString();
          
          try {
            // Call the Supabase Edge Function for AI-powered drug identification
            const { data, error } = await supabase.functions.invoke('identify-drug', {
              body: { imageBase64: base64Image },
            });
            
            if (error) {
              console.error('Error calling identify-drug function:', error);
              toast.error("Failed to identify medication. Please try again.");
              setIsIdentifying(false);
              return;
            }
            
            if (data) {
              // Save the identification result to Supabase
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
                // Continue even if database save fails
              }
              
              setIdentifiedDrug(data);
              toast.success("Medication successfully identified!");
            } else {
              toast.error("Could not get identification results. Please try again.");
            }
          } catch (apiError) {
            console.error('API error:', apiError);
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
      
    } catch (error) {
      console.error("Error identifying medication:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsIdentifying(false);
    }
  };

  const handleRetry = () => {
    setIdentifiedDrug(null);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
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
      
      {isIdentifying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md shadow-2xl text-center">
            <Loader2 className="h-12 w-12 animate-spin text-pharma-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Analyzing Image</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI is scanning the image to identify the medication...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrugIdentify;
