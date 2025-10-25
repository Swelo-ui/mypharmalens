
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ZoomIn, RotateCw, Zap, LogIn, BookmarkPlus } from 'lucide-react';
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
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { playDrugIdentificationSound } from '@/utils/audioService';

// Helper function to extract image features for similarity comparison
const extractImageFeatures = (base64Image: string): Promise<string> => {
  return new Promise((resolve) => {
    // This is a simplified feature extraction
    // In a real implementation, this would use more advanced image processing
    const img = new Image();
    img.onload = () => {
      // Create a small thumbnail to use as a feature vector
      const canvas = document.createElement('canvas');
      const size = 16; // Small size for feature comparison
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        // Get grayscale pixel data as a simple feature vector
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Create a feature hash from the downsampled image
        let featureHash = '';
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale and threshold
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

// Function to calculate similarity between two feature hashes
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
  const { canPerformIdentification, incrementIdentificationUsage, usageStats, loading } = useSubscription();
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  // Fetch user's previous identifications when component loads
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPreviousIdentifications();
    }
  }, [isAuthenticated, user]);

  // Function to fetch user's previous identifications
  const fetchPreviousIdentifications = async () => {
    try {
      if (!user) return;
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke('manage-drug-history', {
        body: { 
          action: 'getIdentificationHistory',
          data: { userId: user.id }
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch history");
      }

      console.log("Loaded previous identifications for learning:", response.data.data?.length || 0);
      setPreviousIdentifications(response.data.data || []);
    } catch (err) {
      console.error('Error fetching previous identifications:', err);
    }
  };

  // Function to check if the current image matches any previously identified medications
  const findMatchInHistory = async (base64Image: string): Promise<any | null> => {
    if (!previousIdentifications.length) return null;
    
    try {
      // Extract features from current image
      const features = await extractImageFeatures(base64Image);
      setImageFeatures(features);
      
      // Set minimum similarity threshold
      const SIMILARITY_THRESHOLD = 0.85;
      
      // Check each previous identification for a match
      for (const prevIdentification of previousIdentifications) {
        // Skip if no image features stored
        if (!prevIdentification.image_features) continue;
        
        const similarity = calculateSimilarity(features, prevIdentification.image_features);
        
        // If similarity is above threshold, we have a match
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

  // Function to manually save drug identification to the database
  const handleSaveToHistory = async () => {
    try {
      if (!identifiedDrug) return;
      if (!isAuthenticated) {
        toast.info("Please sign in to save to history", {
          action: {
            label: "Sign In",
            onClick: () => navigate('/auth')
          }
        });
        return;
      }

      setIsSaving(true);
      const result = await saveDrugIdentification({
        name: identifiedDrug.name,
        drug_name: identifiedDrug.name,
        image: identifiedDrug.image,
        image_url: identifiedDrug.image,
        details: identifiedDrug
      });

      if (result) {
        toast.success("Added to your history");
        setIsSaved(true);
      } else {
        toast.error("Failed to save to history");
      }
    } catch (error) {
      console.error("Error saving to history:", error);
      toast.error("Failed to save to history");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to save drug identification to the database
  const saveDrugIdentification = async (drugData: any) => {
    try {
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping history save');
        return null;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke('manage-drug-history', {
        body: { 
          action: 'addIdentification',
          data: {
            userId: user.id,
            drugName: drugData.drug_name || drugData.name,
            imageUrl: drugData.image_url || drugData.image,
            details: drugData,
            imageFeatures: imageFeatures
          }
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to save identification");
      }

      console.log("Successfully saved drug identification to history:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error in saveDrugIdentification:", error);
      throw error;
    }
  };

  // Enhanced function to identify drug using the new fault-tolerant system
  const identifyDrugFromImage = async (base64Image: string): Promise<any> => {
    try {
      // Track progress for better UX
      setProcessingPhase("Initializing enhanced analysis pipeline");
      setProcessingProgress(5);
      
      // First check if this medication was previously identified
      setProcessingPhase("Checking against previously identified medications");
      setProcessingProgress(10);
      const historicalMatch = await findMatchInHistory(base64Image);
      
      if (historicalMatch) {
        setProcessingPhase("Match found in your history");
        setProcessingProgress(100);
        return {
          ...historicalMatch,
          fromHistory: true
        };
      }
      
      // No match found, proceed with enhanced multi-stage identification
      setProcessingPhase("Starting multi-stage analysis");
      setProcessingProgress(15);
      
      // Try enhanced drug identification first
      let result = null;
      let fallbackUsed = false;
      
      try {
        setProcessingPhase("Stage 1: Enhanced text extraction");
        setProcessingProgress(25);
        
        const { data: enhancedData, error: enhancedError } = await supabase.functions.invoke('enhanced-drug-identify', {
          body: { 
            imageBase64: base64Image,
            options: {
              enhancedMode: enhancedMode,
              blurryMode: blurryMode || isImageLowRes
            }
          }
        });

        setProcessingPhase("Stage 2: AI vision analysis");
        setProcessingProgress(50);

        if (enhancedError) {
          console.warn('Enhanced identification failed, trying fallback:', enhancedError);
          throw new Error('Enhanced system unavailable');
        }

        if (enhancedData && enhancedData.success) {
          setProcessingPhase("Stage 3: Data enrichment");
          setProcessingProgress(75);
          
          result = enhancedData.data;
          result.enhancedProcessing = true;
          result.processingStages = enhancedData.processingStages || [];
          result.confidence = enhancedData.confidence || 'medium';
          result.fallbackUsed = enhancedData.fallbackUsed || false;
          
          console.log('Enhanced identification successful:', result.name);
        } else {
          throw new Error('Enhanced system returned no results');
        }
      } catch (enhancedError) {
        console.warn('Enhanced system failed, using fallback:', enhancedError);
        fallbackUsed = true;
        
        // Fallback to original system
        setProcessingPhase("Using fallback identification system");
        setProcessingProgress(40);
        
        const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('identify-drug', {
          body: { 
            imageBase64: base64Image,
            blurryMode: blurryMode || isImageLowRes || enhancedMode
          }
        });

        setProcessingPhase("Processing fallback results");
        setProcessingProgress(70);

        if (fallbackError) {
          console.error('Fallback system also failed:', fallbackError);
          throw new Error('All identification systems failed. Please try again with a clearer image.');
        }

        if (fallbackData && fallbackData.success !== false) {
          result = fallbackData?.data || fallbackData;
          result.enhancedProcessing = false;
          result.fallbackUsed = true;
          result.confidence = result.confidence || 'low';
          
          console.log('Fallback identification successful:', result.name);
        } else {
          throw new Error(fallbackData?.message || fallbackData?.error || 'Failed to identify medication');
        }
      }

      // Final validation and processing
      setProcessingPhase("Finalizing results and validation");
      setProcessingProgress(90);

      if (!result || !result.name || result.name === "Unknown Medication") {
        // Last resort: try direct Drugs.com search if we have any text
        if (result?.imprint || result?.description) {
          try {
            setProcessingPhase("Attempting direct database search");
            setProcessingProgress(95);
            
            const searchTerm = result.imprint || result.description.substring(0, 50);
            const { data: directSearchData } = await supabase.functions.invoke('drugs-com-api', {
              body: { drugName: searchTerm }
            });

            if (directSearchData && directSearchData.success && directSearchData.data) {
              result = {
                ...result,
                ...directSearchData.data,
                directSearchUsed: true,
                confidence: 'medium'
              };
              console.log('Direct search successful:', result.name);
            }
          } catch (directSearchError) {
            console.warn('Direct search failed:', directSearchError);
          }
        }
      }

      // Add processing metadata
      result.processingTime = Date.now();
      result.enhancedMode = enhancedMode;
      result.blurryMode = blurryMode || isImageLowRes;
      
      setProcessingProgress(100);
      
      return result;
    } catch (error: any) {
      console.error('Error in enhanced drug identification:', error);
      
      // Provide more specific error messages
      if (error.message.includes('All identification systems failed')) {
        throw new Error('Unable to identify this medication. Please ensure the image is clear and try again.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(error.message || 'An unexpected error occurred during identification.');
      }
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
      // Check subscription limits before processing, guard loading first
      if (loading) {
        toast.info("Loading your subscription details... please wait a moment.");
        return;
      }

      // Use unified usageStats for consistency with the top usage bar
      const used = usageStats?.identificationsUsed ?? 0;
      const limit = usageStats?.monthlyLimit ?? 5;
      const isUnlimited = limit === -1;
      if (!isUnlimited && used >= limit) {
        toast.error("You've reached your AI identification limit for this month. Please upgrade your plan to continue.");
        return;
      }

      // Fallback to canPerformIdentification if usageStats are not ready
      if (!usageStats && !canPerformIdentification()) {
        toast.error("You've reached your AI identification limit for this month. Please upgrade your plan to continue.");
        return;
      }

      setIsIdentifying(true);
      setErrorDetails(null);
      setProcessingProgress(0);
      setProcessingPhase("Preparing image");
      toast.info("Processing your image...");

      // Check image quality
      await checkImageQuality(file);

      const reader = new FileReader();

      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Image = event.target.result.toString();
          setCapturedImage(base64Image);

          try {
            // Identify the drug with advanced processing
            const drugData = await identifyDrugFromImage(base64Image);
            setProcessingProgress(90);

            // Check if the response indicates an error
            if (drugData && drugData.success === false) {
              throw new Error(drugData.message || drugData.error || 'Failed to identify medication');
            }

            if (drugData && drugData.success !== false) {
              setProcessingProgress(95);
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
                prescriptionStatus: drugData.prescriptionStatus || 'Unknown',
                pregnancy: drugData.pregnancy || 'Consult your healthcare provider before using during pregnancy.',
                verified: false,
                image: drugData.image,
                drugClass: drugData.drugClass || 'Not specified',
                brandNames: drugData.brandNames || []
              };
              
              setIdentifiedDrug(formattedDrugData);
              setIsSaved(false);
              setProcessingProgress(100);
              
              // Increment usage count for successful identification
              await incrementIdentificationUsage();
              
              // Play drug identification completion sound
              playDrugIdentificationSound();
              
              // Enhanced success messaging based on processing method
              if (drugData.fromHistory) {
                toast.success(`Matched with previously identified ${drugData.name}!`, { 
                  description: "Using your history helped identify this medication faster."
                });
              } else if (drugData.prescriptionStatus === 'Non-pharmaceutical product') {
                toast.info(`Non-pharmaceutical product identified: ${drugData.name}`, { 
                  description: "This appears to be a cosmetic, lotion, or other non-medication product.",
                  duration: 5000
                });
              } else if (drugData.enhancedProcessing) {
                const confidenceMessage = {
                  'high': "Enhanced analysis provided high confidence results.",
                  'medium': "Enhanced analysis completed. Consider the alternatives listed if available.",
                  'low': "Enhanced analysis completed with low confidence. Consider consulting a healthcare professional."
                };
                
                toast.success(`Medication identified: ${drugData.name}!`, { 
                  description: confidenceMessage[drugData.confidence] || "Enhanced analysis completed.",
                  duration: drugData.confidence === 'low' ? 6000 : 4000
                });
              } else if (drugData.fallbackUsed) {
                toast.success(`Medication identified using backup system: ${drugData.name}`, { 
                  description: "Backup identification system was used. Results may have lower confidence.",
                  duration: 5000
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
              
              // Show processing stages if available
              if (drugData.processingStages && drugData.processingStages.length > 0) {
                console.log('Processing stages used:', drugData.processingStages);
              }
              
              // Additional information about image quality if relevant
              if (isImageLowRes || drugData.blurryModeUsed) {
                toast.info("For better accuracy, consider uploading a higher quality image.", { 
                  duration: 5000 
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
    setIsSaved(false);
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
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-24">
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
            <Button 
              variant="outline" 
              onClick={() => navigate('/history')}
            >
              View Identification History
            </Button>
          )}
        </div>
        
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
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8 lg:p-10 mb-8 max-w-4xl mx-auto">
              {/* Subscription Usage Display */}

              {isAuthenticated && (
                loading ? (
                  <div className="mb-6 p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/20 flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading usage...
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gradient-to-r from-pharma-50 to-blue-50 dark:from-pharma-900/20 dark:to-blue-900/20 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">AI Identifications Usage</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate('/subscription-manager')}
                        className="text-xs"
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used this month:</span>
                        <span className="font-medium">
                          {usageStats?.identificationsUsed} / {usageStats?.monthlyLimit === -1 ? '∞' : usageStats?.monthlyLimit}
                        </span>
                      </div>
                      {usageStats?.monthlyLimit !== -1 && (
                        <Progress 
                          value={((usageStats?.identificationsUsed || 0) / (usageStats?.monthlyLimit || 1)) * 100} 
                          className="h-2"
                        />
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Current plan: <span className="font-medium">{usageStats?.planName}</span>
                      </p>
                    </div>
                  </div>
                )
              )}
              
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6 text-base sm:text-lg">
                {identificationMode === 'upload' 
                  ? "Upload a clear image of the medication for identification" 
                  : "Take a clear photo of the medication for identification"}
              </p>
              
              <Tabs defaultValue="standard" className="mb-6">
                <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-4">
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
            
            <div className="bg-pharma-50 dark:bg-pharma-900/20 rounded-2xl p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto">
              <h3 className="font-medium text-lg sm:text-xl mb-4 sm:mb-6">Tips for better identification:</h3>
              <ul className="list-disc list-inside space-y-3 sm:space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 text-pharma-600" />
                  <span className="text-sm sm:text-base">Use good lighting and ensure the pill is clearly visible</span>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded" />
                  <span className="text-sm sm:text-base">Place the medication against a plain, contrasting background</span>
                </li>
                <li className="flex items-start">
                  <RotateCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 text-pharma-600" />
                  <span className="text-sm sm:text-base">Try multiple angles if identification fails initially</span>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 rounded-full border border-pharma-600" />
                  <span className="text-sm sm:text-base">Make sure any markings, logos, or text are visible</span>
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
            <div className="flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-2xl font-semibold">Identification Result</h2>
              <div className="flex gap-3">
                {isAuthenticated && !isSaved && (
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleSaveToHistory}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-4 w-4" />
                        <span>Save to History</span>
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={handleRetry}>
                  Identify Another
                </Button>
              </div>
            </div>
            {isSaved && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <BookmarkPlus className="h-4 w-4" />
                  <span>Saved to your identification history</span>
                </div>
              </Alert>
            )}
            <DrugDetails drug={identifiedDrug} />
          </div>
        )}
      </div>
    </>
  );
};

export default DrugIdentify;