import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ZoomIn, RotateCw, Zap, LogIn, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DetailedDrugData } from '@/components/DrugDetails';
import DrugDetails from '@/components/DrugDetails';
import CameraCapture from '@/components/CameraCapture';
import ImageUpload from '@/components/ImageUpload';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const extractImageFeatures = (base64Image: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 16;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        let featureHash = '';
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
          featureHash += gray > 128 ? '1' : '0';
        }
        
        resolve(featureHash);
      } else {
        resolve('');
      }
    };
    
    img.src = base64Image;
  });
};

const calculateSimilarity = (hash1: string, hash2: string): number => {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 0;
  
  let matchingBits = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) {
      matchingBits++;
    }
  }
  
  return matchingBits / hash1.length;
};

const DrugIdentify = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStatus();
  const [identificationMode, setIdentificationMode] = useState<'upload' | 'camera'>('upload');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedDrug, setIdentifiedDrug] = useState<DetailedDrugData | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [blurryMode, setBlurryMode] = useState(false);
  const [isImageLowRes, setIsImageLowRes] = useState(false);
  const [enhancedMode, setEnhancedMode] = useState(true);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState("");
  const [previousIdentifications, setPreviousIdentifications] = useState<any[]>([]);
  const [imageFeatures, setImageFeatures] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPreviousIdentifications();
      checkSubscription();
    }
  }, [isAuthenticated, user]);

  const checkSubscription = async () => {
    try {
      setCheckingSubscription(true);
      const { data, error } = await supabase.functions.invoke('subscription-management/check-subscription-status');
      
      if (error) {
        console.error('Error checking subscription status:', error);
        return;
      }
      
      setSubscriptionStatus(data);
      
      if (!data.canIdentify) {
        toast.warning(data.message, {
          action: {
            label: "Upgrade",
            onClick: () => navigate('/subscription')
          }
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const fetchPreviousIdentifications = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('drug_identifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching previous identifications:', error);
        return;
      }
      
      setPreviousIdentifications(data || []);
      console.log('Loaded previous identifications for learning:', data?.length || 0);
    } catch (err) {
      console.error('Error in fetchPreviousIdentifications:', err);
    }
  };

  const findMatchInHistory = async (base64Image: string): Promise<any | null> => {
    if (!previousIdentifications.length) return null;
    
    try {
      const features = await extractImageFeatures(base64Image);
      setImageFeatures(features);
      
      const SIMILARITY_THRESHOLD = 0.85;
      
      for (const prevIdentification of previousIdentifications) {
        if (!prevIdentification.image_features) continue;
        
        const similarity = calculateSimilarity(features, prevIdentification.image_features);
        
        if (similarity >= SIMILARITY_THRESHOLD) {
          console.log(`Found match in history with similarity: ${similarity}`, prevIdentification);
          return {
            ...prevIdentification.details,
            confidence: 'high',
            fromHistory: true,
            matchSimilarity: similarity
          };
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error in findMatchInHistory:', err);
      return null;
    }
  };

  const saveDrugIdentification = async (drugData: any) => {
    try {
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping history save');
        return;
      }

      if (subscriptionStatus && !subscriptionStatus.canIdentify) {
        console.log('User subscription limit reached, skipping save');
        return;
      }

      const drug_name = drugData.name || drugData.drug_name || "Unknown Medication";
      
      const image_url = drugData.image || drugData.image_url || null;
      
      let details = drugData;
      if (!drugData.details) {
        details = {
          ...drugData,
          name: drug_name,
          image: image_url,
        };
      } else {
        details = drugData.details;
      }

      details.identified_at = new Date().toISOString();
      
      console.log('Saving identification with details:', {
        drug_name,
        image_url,
        details,
        image_features: imageFeatures
      });

      const { data, error } = await supabase
        .from('drug_identifications')
        .insert([
          {
            user_id: user.id,
            drug_name: drug_name,
            image_url: image_url,
            details: details,
            image_features: imageFeatures
          }
        ])
        .select();

      if (error) {
        console.error("Error saving drug identification:", error);
        throw error;
      }

      console.log("Successfully saved drug identification to history:", data);
      
      checkSubscription();
      
      toast.success("Identification saved to your history");
      
      return data;
    } catch (error) {
      console.error("Error in saveDrugIdentification:", error);
      toast.error("Could not save to history. Please try again later.");
      throw error;
    }
  };

  const identifyDrugFromImage = async (base64Image: string): Promise<any> => {
    try {
      setProcessingPhase("Initializing image analysis");
      setProcessingProgress(10);
      
      setProcessingPhase("Checking against previously identified medications");
      setProcessingProgress(20);
      const historicalMatch = await findMatchInHistory(base64Image);
      
      if (historicalMatch) {
        setProcessingPhase("Match found in your history");
        setProcessingProgress(100);
        return {
          ...historicalMatch,
          fromHistory: true
        };
      }
      
      setProcessingPhase("Sending image for analysis");
      setProcessingProgress(30);
      
      const { data, error } = await supabase.functions.invoke('identify-drug', {
        body: { 
          imageBase64: base64Image,
          blurryMode: blurryMode || isImageLowRes || enhancedMode
        }
      });

      setProcessingPhase("Processing AI response");
      setProcessingProgress(60);

      if (error) {
        console.error('Error calling identify-drug function:', error);
        throw new Error(error.message || 'Failed to identify medication');
      }
      
      setProcessingPhase("Finalizing results");
      setProcessingProgress(80);

      return data;
    } catch (error: any) {
      console.error('Error identifying drug:', error);
      throw error;
    }
  };

  const checkImageQuality = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.size < 50 * 1024) {
        setIsImageLowRes(true);
        return resolve(true);
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
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
      if (!isAuthenticated) {
        toast.info("Sign in to use drug identification", {
          action: {
            label: "Sign In",
            onClick: () => navigate('/auth')
          }
        });
        return;
      }
      
      if (subscriptionStatus && !subscriptionStatus.canIdentify) {
        toast.error(subscriptionStatus.message, {
          action: {
            label: "Upgrade",
            onClick: () => navigate('/subscription')
          }
        });
        return;
      }
      
      setIsIdentifying(true);
      setErrorDetails(null);
      setProcessingProgress(0);
      setProcessingPhase("Preparing image");
      toast.info("Processing your image...");
      
      await checkImageQuality(file);
      
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Image = event.target.result.toString();
          setCapturedImage(base64Image);
          
          try {
            const drugData = await identifyDrugFromImage(base64Image);
            setProcessingProgress(90);
            
            if (drugData.error) {
              throw new Error(drugData.error);
            }
            
            if (drugData) {
              setProcessingProgress(95);
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
                brandNames: drugData.brandNames || []
              };
              
              if (isAuthenticated && user) {
                try {
                  await saveDrugIdentification({
                    drug_name: drugData.name,
                    image_url: drugData.image,
                    details: drugData
                  });
                  console.log('Saved drug identification to Supabase');
                } catch (saveError) {
                  console.error('Failed to save drug identification:', saveError);
                }
              }
              
              setIdentifiedDrug(formattedDrugData);
              setProcessingProgress(100);
              
              if (drugData.fromHistory) {
                toast.success(`Matched with previously identified ${drugData.name}!`, { 
                  description: "Using your history helped identify this medication faster."
                });
              } else if (drugData.multiModelAnalysisUsed || drugData.blurryModeUsed) {
                if (drugData.confidence === 'high') {
                  toast.success(`Medication successfully identified as ${drugData.name}!`, { 
                    description: "Enhanced analysis provided high confidence results."
                  });
                } else if (drugData.confidence === 'medium') {
                  toast.success(`Medication identified as ${drugData.name}`, { 
                    description: "The identification has medium confidence. Consider the alternatives listed."
                  });
                } else {
                  toast.info(`Medication possibly identified as ${drugData.name}`, { 
                    description: "Low confidence identification. Consider consulting a healthcare professional.",
                    duration: 5000
                  });
                }
              } else {
                toast.success(`Medication successfully identified as ${drugData.name}!`);
              }
              
              if (isImageLowRes || drugData.blurryModeUsed) {
                toast.info("For better accuracy, consider uploading a higher quality image.", { 
                  duration: 5000 
                });
              }
              
              if (!isAuthenticated) {
                toast.info("Sign in to save this identification to your history", {
                  duration: 8000,
                  action: {
                    label: "Sign In",
                    onClick: () => navigate('/auth')
                  }
                });
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
    setProcessingProgress(0);
    setProcessingPhase("");
  };

  const handleManualSearch = () => {
    handleRetry();
    toast.info("Please try uploading a clearer image or a different angle");
  };

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Identify Medication</h1>
          
          {!isAuthenticated && !authLoading && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="h-4 w-4" />
              <span>Sign in to save history</span>
            </Button>
          )}
          
          {isAuthenticated && (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/history')}
              >
                View History
              </Button>
              <Button 
                variant="default" 
                onClick={() => navigate('/subscription')}
              >
                Subscription
              </Button>
            </div>
          )}
        </div>
        
        {isAuthenticated && subscriptionStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            subscriptionStatus.canIdentify 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900' 
              : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {subscriptionStatus.canIdentify ? (
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                ) : (
                  <Lock className="h-5 w-5 mr-2 text-amber-600" />
                )}
                <div>
                  <p className="font-medium">
                    {subscriptionStatus.canIdentify ? 'Subscribed' : 'Upgrade Needed'}
                  </p>
                  <p className="text-sm">
                    {subscriptionStatus.message}
                  </p>
                </div>
              </div>
              
              {subscriptionStatus.usage && (
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">
                    {subscriptionStatus.usage.used} / {subscriptionStatus.usage.total} identifications
                  </p>
                  <Progress 
                    value={subscriptionStatus.usage.percentage} 
                    className="h-2 w-32 mt-1" 
                  />
                </div>
              )}
              
              {!subscriptionStatus.canIdentify && (
                <Button 
                  size="sm"
                  onClick={() => navigate('/subscription')}
                >
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        )}
        
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
              
              <Tabs defaultValue="standard" className="mb-4">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-2">
                  <TabsTrigger value="standard">Standard Mode</TabsTrigger>
                  <TabsTrigger value="enhanced">Enhanced Mode</TabsTrigger>
                </TabsList>
                
                <TabsContent value="standard" className="space-y-4">
                  <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">Basic Analysis</span>
                      </div>
                      <Switch 
                        id="blur-mode" 
                        checked={blurryMode}
                        onCheckedChange={setBlurryMode}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Standard mode works best with clear, well-lit images. Enable blur mode for lower-quality images.
                    </p>
                    {isImageLowRes && (
                      <p className="text-xs text-amber-500 mt-2">
                        Your image appears to be low resolution. Blur mode is recommended.
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="enhanced" className="space-y-4">
                  <div className="rounded-lg border p-4 bg-pharma-50 dark:bg-pharma-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-pharma-600" />
                        <span className="text-sm font-medium">Advanced Analysis</span>
                      </div>
                      <Switch 
                        id="enhanced-mode" 
                        checked={enhancedMode}
                        onCheckedChange={setEnhancedMode}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Enhanced mode uses multiple AI models to analyze the image from different angles, 
                      improving accuracy for blurry or difficult-to-identify medications.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              {identificationMode === 'upload' ? (
                <ImageUpload onImageCapture={handleImageCapture} />
              ) : (
                <CameraCapture onImageCapture={handleImageCapture} />
              )}
              
              {isIdentifying && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{processingPhase || "Analyzing medication..."}</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                    {enhancedMode 
                      ? "Using enhanced multi-model analysis for optimal results" 
                      : "Using standard analysis"}
                  </p>
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
                <li className="flex items-start">
                  <Zap className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-pharma-600" />
                  <span>Use Enhanced Mode for blurry images or hard-to-identify medications</span>
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
