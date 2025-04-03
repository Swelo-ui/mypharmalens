
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageUpload from '@/components/ImageUpload';
import CameraCapture from '@/components/CameraCapture';
import DrugDetails from '@/components/DrugDetails';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DonationPopup from '@/components/DonationPopup';

const DrugIdentify = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const { user, isAuthenticated } = useAuthStatus();
  const navigate = useNavigate();

  const handleImageCapture = async (imageBase64: string) => {
    setImageSrc(imageBase64);
    await processImage(imageBase64);
  };

  const processImage = async (imageBase64: string) => {
    try {
      setIsLoading(true);
      toast.info("Analyzing medication...", { duration: 2000 });
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('identify-drug', {
        body: { imageBase64 }
      });
      
      if (error) {
        console.error("Error calling identify-drug function:", error);
        toast.error("Failed to analyze the medication. Please try again.");
        return;
      }
      
      console.log("Identification results:", data);
      
      // Set results
      setResult(data);
      
      // If user is authenticated, save to history
      if (isAuthenticated && user) {
        await saveToHistory(data, imageBase64);
      }
      
      // Show success toast
      toast.success("Medication analysis complete!");
      
      // Show donation popup with 25% probability after successful identification
      if (Math.random() < 0.25) {
        setShowDonationPopup(true);
      }
      
    } catch (error) {
      console.error("Error in processImage:", error);
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = async (drugData: any, imageBase64: string) => {
    try {
      if (!user) return;
      
      // Store the identification data in Supabase
      const { data, error } = await supabase
        .from('drug_identifications')
        .insert([
          {
            user_id: user.id,
            drug_name: drugData.name,
            image_url: imageBase64,
            details: drugData
          }
        ]);
      
      if (error) {
        console.error("Error saving to history:", error);
        toast.error("Failed to save to history.");
      } else {
        console.log("Saved to history:", data);
      }
    } catch (error) {
      console.error("Error in saveToHistory:", error);
    }
  };

  const reset = () => {
    setImageSrc(null);
    setResult(null);
  };

  const handleDonate = () => {
    window.open('https://buymeacoffee.com/_himanshusharma', '_blank');
    setShowDonationPopup(false);
  };

  return (
    <>
      <Header />
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-2">Identify a Medication</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Upload an image or take a photo of a pill, tablet, or medication packaging
        </p>
        
        {!result ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  className={`flex-1 py-3 text-center ${
                    activeTab === 'upload'
                      ? 'bg-gray-100 dark:bg-gray-900 font-medium'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="h-4 w-4 inline-block mr-2" />
                  Upload Image
                </button>
                <button
                  className={`flex-1 py-3 text-center ${
                    activeTab === 'camera'
                      ? 'bg-gray-100 dark:bg-gray-900 font-medium'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                  onClick={() => setActiveTab('camera')}
                >
                  <Camera className="h-4 w-4 inline-block mr-2" />
                  Use Camera
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'upload' ? (
                  <ImageUpload 
                    onImageSelected={handleImageCapture} 
                    isLoading={isLoading} 
                  />
                ) : (
                  <CameraCapture 
                    onImageCaptured={handleImageCapture} 
                    isLoading={isLoading} 
                  />
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex">
                <div className="mr-3 flex-shrink-0">
                  <Check className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Tips for best results</h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Ensure good lighting conditions</li>
                      <li>Place the medication against a plain, contrasting background</li>
                      <li>Make sure any text or imprints on the medication are visible</li>
                      <li>Include packaging if available for more accurate results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg text-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Sign in to save your identification history and access it later
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/auth')}
                >
                  Sign In / Register
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {imageSrc && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                  <img 
                    src={imageSrc} 
                    alt="Uploaded medication" 
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>
            )}
            
            <DrugDetails drug={result} />
            
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={reset}
              >
                Identify Another Medication
              </Button>
              
              {isAuthenticated && (
                <Button
                  variant="default"
                  onClick={() => navigate('/history')}
                >
                  View History
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <DonationPopup 
        isOpen={showDonationPopup}
        onClose={() => setShowDonationPopup(false)}
        onDonate={handleDonate}
      />
      
      <Footer />
    </>
  );
};

export default DrugIdentify;
