
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailedDrugData } from '@/components/DrugDetails';
import DrugDetails from '@/components/DrugDetails';
import CameraCapture from '@/components/CameraCapture';
import ImageUpload from '@/components/ImageUpload';

const mockIdentificationResponse = (delay: number = 2000): Promise<DetailedDrugData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: "para-123",
        name: "Paracetamol 500mg",
        genericName: "Acetaminophen",
        manufacturer: "Generic Pharmaceuticals",
        category: "Analgesic",
        description: "Paracetamol is used to treat pain and fever. It's one of the most widely used medications globally for these purposes.",
        dosageAndAdmin: "Adults and children 12 years and over: 1-2 tablets every 4-6 hours as needed, not exceeding 8 tablets in 24 hours. Children under 12: consult a doctor.",
        sideEffects: [
          "Nausea or vomiting",
          "Stomach pain",
          "Loss of appetite",
          "Headache",
          "Skin rash or itching",
          "Allergic reactions (rare)"
        ],
        warnings: [
          "Do not exceed the recommended dose",
          "Do not use with other products containing paracetamol",
          "May cause liver damage if taken in excess",
          "Consult doctor if symptoms persist for more than 3 days",
          "Avoid alcohol consumption while taking this medication"
        ],
        interactions: [
          "Warfarin and other blood thinners",
          "Certain epilepsy medications",
          "Metoclopramide and domperidone",
          "Cholestyramine"
        ],
        storage: "Store below 25°C in a dry place, away from direct sunlight and heat. Keep out of reach of children.",
        mechanism: "Paracetamol works by inhibiting the production of prostaglandins in the central nervous system and peripherally blocks pain impulse generation. It has antipyretic effects by acting on the hypothalamic heat-regulating center.",
        indications: [
          "Mild to moderate pain",
          "Fever",
          "Headache",
          "Muscular aches",
          "Toothache",
          "Cold and flu symptoms"
        ],
        contraindications: [
          "Hypersensitivity to paracetamol",
          "Severe liver impairment",
          "Alcohol dependence"
        ],
        prescriptionStatus: "OTC",
        pregnancy: "Considered safe for use during pregnancy and breastfeeding when used as directed. Consult healthcare provider before use.",
        verified: true,
        image: "/placeholder.svg",
        similarDrugs: [
          {
            id: "ibu-456",
            name: "Ibuprofen 400mg"
          },
          {
            id: "asp-789",
            name: "Aspirin 325mg"
          }
        ]
      });
    }, delay);
  });
};

const DrugIdentify = () => {
  const [identificationMode, setIdentificationMode] = useState<'upload' | 'camera'>('upload');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedDrug, setIdentifiedDrug] = useState<DetailedDrugData | null>(null);

  const handleImageCapture = async (file: File) => {
    try {
      setIsIdentifying(true);
      toast.info("Processing your image...");
      
      // In a real app, we would upload the image to a server for processing
      // For now, we'll use a mock response
      const drugData = await mockIdentificationResponse(3000);
      
      setIdentifiedDrug(drugData);
      toast.success("Drug successfully identified!");
    } catch (error) {
      console.error("Error identifying drug:", error);
      toast.error("Failed to identify the drug. Please try again.");
    } finally {
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
