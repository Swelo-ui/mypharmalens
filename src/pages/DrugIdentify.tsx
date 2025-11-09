
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [analysisMode, setAnalysisMode] = useState<'standard' | 'enhanced'>('standard');
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Helper function to check if user is Special Access based on email
  const isSpecialAccessAccount = () => {
    const specialAccessEmails = ['imgamer.ms@gmail.com'];
    return user?.email && specialAccessEmails.includes(user.email.toLowerCase());
  };
  const [identifiedDrug, setIdentifiedDrug] = useState<DetailedDrugData | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [blurryMode, setBlurryMode] = useState(false);
  const [isImageLowRes, setIsImageLowRes] = useState(false);
  const [enhancedMode, setEnhancedMode] = useState(true);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState("");
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [processingStartTime, setProcessingStartTime] = useState<number>(0);
  const [previousIdentifications, setPreviousIdentifications] = useState<any[]>([]);
  const [imageFeatures, setImageFeatures] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [processingMeta, setProcessingMeta] = useState<{ confidence?: string; fallbackUsed?: boolean; processingStages?: any[]; enhancedProcessing?: boolean } | null>(null);
  const navigate = useNavigate();

  // PharmaLens-branded progress messages - Professional & User-Friendly
  // Optimized for both Standard Mode (fast) and Enhanced Mode (comprehensive)
  const stageMapping: Record<string, { message: string; progress: number; duration: number }> = {
    // === ENHANCED MODE STAGES (11 stages: 0-100%) ===
    'image-quality-analysis': { message: 'Analyzing medication image', progress: 10, duration: 2000 },
    'dual-ocr-extraction': { message: 'Reading medication details', progress: 20, duration: 3000 },
    'text-extraction': { message: 'Reading medication details', progress: 20, duration: 3000 },
    'gemini-analysis': { message: 'Analyzing medication features', progress: 30, duration: 4000 },
    'openrouter-vision-fallback': { message: 'Processing medication image', progress: 40, duration: 3500 },
    'cache-hit': { message: 'Found in PharmaLens database', progress: 50, duration: 500 },
    'cache-miss': { message: 'Searching pharmaceutical databases', progress: 50, duration: 1000 },
    'multi-source-enrichment': { message: 'Gathering medication information', progress: 60, duration: 8000 },
    'data-consolidation': { message: 'Verifying medication details', progress: 70, duration: 2500 },
    'imprint-search': { message: 'Searching by pill markings', progress: 80, duration: 3000 },
    'gemini-backup': { message: 'Completing medication profile', progress: 90, duration: 4500 },
    'critical-vision-analysis': { message: 'Deep analysis for challenging image', progress: 92, duration: 6000 },
    'cross-reference-verification': { message: 'Validating information accuracy', progress: 95, duration: 2000 },
    'final-cross-verification': { message: 'Final quality verification', progress: 98, duration: 1500 },
    'smart-fallback-system': { message: 'Finalizing results', progress: 100, duration: 1000 },

    // === STANDARD MODE STAGES (7 stages: 0-100%) ===
    'gemini-ocr': { message: 'Reading medication label', progress: 15, duration: 2000 },
    'ocr-cross-validation': { message: 'Verifying medication name', progress: 25, duration: 1000 },
    'multi-source-comprehensive-fallback': { message: 'Searching pharmaceutical databases', progress: 40, duration: 3500 },
    'cache-search': { message: 'Checking PharmaLens database', progress: 55, duration: 1500 },
    'local-database-smart-search': { message: 'Searching local medication records', progress: 70, duration: 2500 },
    '1mg-fallback': { message: 'Searching online pharmaceutical databases', progress: 85, duration: 4000 },
    'drugs-com-fallback': { message: 'Searching online pharmaceutical databases', progress: 85, duration: 4000 },
    'multi-source-api-fallback': { message: 'Gathering medication details', progress: 95, duration: 5000 },
    'ai-powered-fallback': { message: 'Completing identification', progress: 98, duration: 3000 },
    'safe-failure': { message: 'Identification complete', progress: 100, duration: 500 }
  };

  // Smooth progress interpolation state
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  const [targetProgress, setTargetProgress] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Calculate estimated time remaining and smoothly interpolate progress
  const updateProgress = (stage: string) => {
    const stageInfo = stageMapping[stage];
    if (stageInfo) {
      setProcessingPhase(stageInfo.message);
      setTargetProgress(stageInfo.progress);
      
      // Clear any existing interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Smoothly interpolate to target progress over the stage duration
      const startProgress = currentProgress;
      const progressDiff = stageInfo.progress - startProgress;
      const steps = stageInfo.duration / 50; // Update every 50ms
      const progressPerStep = progressDiff / steps;
      
      let stepCount = 0;
      const interval = setInterval(() => {
        stepCount++;
        const newProgress = Math.min(
          stageInfo.progress,
          startProgress + (progressPerStep * stepCount)
        );
        
        setCurrentProgress(newProgress);
        setProcessingProgress(Math.floor(newProgress));
        
        // Calculate time remaining
        if (processingStartTime > 0) {
          const elapsed = Date.now() - processingStartTime;
          const remainingProgress = 100 - newProgress;
          
          if (newProgress > 0) {
            const avgTimePerPercent = elapsed / newProgress;
            const estimatedRemaining = Math.ceil((avgTimePerPercent * remainingProgress) / 1000);
            setEstimatedTimeRemaining(Math.max(1, estimatedRemaining));
          }
        }
        
        // Stop when target reached
        if (stepCount >= steps || newProgress >= stageInfo.progress) {
          clearInterval(interval);
          setProgressInterval(null);
        }
      }, 50);
      
      setProgressInterval(interval);
    }
  };

  // Simulate progressive updates for smooth UX
  const simulateProgressUpdates = (stages: string[]) => {
    stages.forEach((stage, index) => {
      const stageInfo = stageMapping[stage];
      if (stageInfo) {
        setTimeout(() => {
          updateProgress(stage);
        }, index * 500); // Stagger updates by 500ms
      }
    });
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

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

  // Function to manually save drug identification to cache
  const handleSaveToCache = async () => {
    try {
      if (!identifiedDrug) return;
      if (!isAuthenticated) {
        toast.info("Please sign in to save to cache", {
          action: {
            label: "Sign In",
            onClick: () => navigate('/auth')
          }
        });
        return;
      }

      setIsSaving(true);
      
      console.log('🔄 Attempting manual cache save for:', identifiedDrug.name);
      
      // Call the manual cache save function
      const { data: cacheResult, error: cacheError } = await supabase.functions.invoke('manual-cache-save', {
        body: { 
          drugData: identifiedDrug
        }
      });

      // Handle true invocation errors (network issues, auth failures, etc.)
      if (cacheError) {
        console.error('Cache save invocation error:', cacheError);
        toast.error("Failed to save to cache", {
          description: "Network error. Please check your connection and try again."
        });
        return;
      }

      // Handle function response (success or application-level errors)
      if (cacheResult?.success) {
        console.log('✅ Manual cache save successful:', cacheResult);
        toast.success("Saved to cache successfully!", {
          description: `${identifiedDrug.name} will be instantly recognized in future scans`
        });
        setIsSaved(true);
      } else {
        const errorMessage = cacheResult?.message || "Unknown error occurred";
        const completenessScore = cacheResult?.details?.completenessScore;
        
        if (cacheResult?.error === 'already_cached') {
          console.log('ℹ️ Drug already in cache:', cacheResult?.details);
          toast.info("Already cached!", {
            description: `"${identifiedDrug.name}" is already in the cache library. No need to save again.`
          });
          setIsSaved(true); // Mark as saved since it's already in cache
        } else if (cacheResult?.error === 'incomplete_data') {
          toast.warning("Information incomplete for caching", {
            description: `Drug data is ${completenessScore}% complete. Cache requires 100% complete information for quality assurance.`
          });
        } else {
          toast.error("Failed to save to cache", {
            description: errorMessage
          });
        }
      }
    } catch (error) {
      console.error("Error saving to cache:", error);
      toast.error("Failed to save to cache", {
        description: "An unexpected error occurred"
      });
    } finally {
      setIsSaving(false);
    }
  };


  // Enhanced function to identify drug using the new fault-tolerant system
  const identifyDrugFromImage = async (base64Image: string): Promise<any> => {
    try {
      // Start tracking time
      const startTime = Date.now();
      setProcessingStartTime(startTime);
      
      // Track progress for better UX
      setProcessingPhase("Preparing image for analysis");
      setProcessingProgress(3);
      setEstimatedTimeRemaining(35); // Initial estimate: 35 seconds
      
      // First check if this medication was previously identified
      setProcessingPhase("Checking your previous scans");
      setProcessingProgress(8);
      setEstimatedTimeRemaining(30);
      
      const historicalMatch = await findMatchInHistory(base64Image);
      
      if (historicalMatch) {
        setProcessingPhase("✓ Match found in your history!");
        setProcessingProgress(100);
        setEstimatedTimeRemaining(0);
        return {
          ...historicalMatch,
          fromHistory: true
        };
      }
      
      // No match found, proceed with enhanced multi-stage identification
      setProcessingPhase("Starting advanced AI analysis");
      setProcessingProgress(12);
      setEstimatedTimeRemaining(28);
      
      // Try enhanced drug identification first
      let result = null;
      let fallbackUsed = false;
      let progressSimulator: NodeJS.Timeout | null = null;
      
      try {
        // Log which mode we're using
        console.log(`🚀 Identifying drug using ${analysisMode.toUpperCase()} mode`);
        console.log(`Mode details:`, {
          analysisMode,
          enhancedMode,
          blurryMode: blurryMode || isImageLowRes,
          bypassCache: analysisMode === 'enhanced'
        });
        
        // Start simulated progress updates during API call
        let simulatedProgress = 10;
        progressSimulator = setInterval(() => {
          simulatedProgress += 5;
          if (simulatedProgress <= 85) {
            setProcessingProgress(simulatedProgress);
            setCurrentProgress(simulatedProgress);
            
            // Update phase based on progress
            if (simulatedProgress <= 30) {
              setProcessingPhase("Analyzing medication image");
            } else if (simulatedProgress <= 50) {
              setProcessingPhase(analysisMode === 'enhanced' ? "Gathering medication information" : "Checking PharmaLens database");
            } else if (simulatedProgress <= 70) {
              setProcessingPhase(analysisMode === 'enhanced' ? "Verifying medication details" : "Searching local medication records");
            } else {
              setProcessingPhase("Finalizing identification");
            }
          }
        }, 1000); // Update every 1 second
        
        // Use the appropriate function based on analysis mode
        const functionName = analysisMode === 'enhanced' ? 'enhanced-drug-identify' : 'standard-drug-identify';
        console.log(`🚀 Calling function: ${functionName} for ${analysisMode} mode`);
        
        const { data: drugData, error: drugError } = await supabase.functions.invoke(functionName, {
          body: { 
            imageBase64: base64Image,
            options: {
              blurryMode: blurryMode || isImageLowRes,
              advancedAnalysis: analysisMode === 'enhanced'
            }
          }
        });

        // Handle true invocation errors (network, auth, server crash)
        if (drugError) {
          console.error(`${functionName} invocation failed:`, drugError);
          throw new Error(`Network error. Please check your connection and try again.`);
        }

        // Clear the progress simulator
        clearInterval(progressSimulator);
        
        // Handle successful identification
        if (drugData?.success) {
          // Clear any existing progress intervals
          if (progressInterval) {
            clearInterval(progressInterval);
            setProgressInterval(null);
          }
          
          // Immediately jump to 100% when result is received
          setProcessingPhase("Identification complete");
          setProcessingProgress(100);
          setCurrentProgress(100);
          setTargetProgress(100);
          
          result = drugData.data;
          result.enhancedProcessing = analysisMode === 'enhanced';
          result.processingStages = drugData.processingStages || [];
          result.confidence = drugData.confidence || 'medium';
          result.fallbackUsed = drugData.fallbackUsed || false;
          
          // If there's an error message, log it but don't fail
          if (drugData.error) {
            console.warn(`${analysisMode} identification completed with issues:`, drugData.error);
          }
          
          setProcessingMeta({
            confidence: result.confidence,
            fallbackUsed: result.fallbackUsed,
            processingStages: drugData.processingStages || [],
            enhancedProcessing: analysisMode === 'enhanced'
          });
          
          console.log(`${analysisMode} identification completed:`, result.name);
        } else if (drugData?.success === false) {
          // Function executed but couldn't identify the drug
          console.warn(`${analysisMode} identification failed:`, drugData.error);
          throw new Error(drugData.error || 'Unable to identify this medication. Please try again with a clearer image.');
        } else {
          // Unexpected response format
          throw new Error(`${analysisMode} system returned invalid response`);
        }
      } catch (drugError) {
        // Clear the progress simulator on error
        if (progressSimulator) {
          clearInterval(progressSimulator);
        }
        console.error('Drug identification failed:', drugError);
        throw new Error(`Identification failed: ${drugError.message || 'Please try again with a clearer image.'}`);
      }

      // Final validation and processing
      setProcessingPhase("Preparing your results");
      setProcessingProgress(92);
      setEstimatedTimeRemaining(3);

      if (!result || !result.name || result.name === "Unknown Medication") {
        // Last resort: try direct Drugs.com search if we have any text
        if (result?.imprint || result?.description) {
          try {
            setProcessingPhase("Searching additional databases");
            setProcessingProgress(96);
            setEstimatedTimeRemaining(2);
            
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
      
      // Mark as complete
      setProcessingPhase("✓ Analysis complete!");
      setProcessingProgress(100);
      setEstimatedTimeRemaining(0);
      
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
      
      console.log('🔍 Identification check:', { used, limit, isUnlimited, planName: usageStats?.planName });
      
      // Strict enforcement: block if at or above limit
      if (!isUnlimited && used >= limit) {
        toast.error(`You've reached your AI identification limit (${used}/${limit}). Please upgrade your plan to continue.`, {
          description: `Current plan: ${usageStats?.planName || 'Free'}`
        });
        return;
      }

      // Double-check with canPerformIdentification for safety
      if (!canPerformIdentification()) {
        toast.error(`You've reached your identification limit. Please upgrade to continue.`, {
          description: `Used: ${used}/${limit === -1 ? 'Unlimited' : limit}`
        });
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

            // Always check if we have usable data, even if success is false
            const hasUsableData = drugData && drugData.name && (
              drugData.name === "Unknown Medication" || 
              drugData.name === "Unidentified Medication" ||
              drugData.name === "Partially Identified Medication" ||
              drugData.name !== "Unknown Medication"
            );

            if (hasUsableData) {
              setProcessingProgress(95);
              
              // Check if this is an unidentified medication with recommendations
              const isUnidentified = drugData.name === "Unidentified Medication" || 
                                     drugData.name === "Unknown Medication" ||
                                     drugData.name === "Partially Identified Medication";
              
              // Format the drug data to match our DetailedDrugData interface
              const formattedDrugData: DetailedDrugData = {
                id: drugData.id || crypto.randomUUID(),
                name: drugData.name,
                genericName: drugData.genericName || (isUnidentified ? "Not Identified" : drugData.name),
                manufacturer: drugData.manufacturer || (isUnidentified ? "Unknown" : "Not specified"),
                category: drugData.category || (isUnidentified ? "Unknown" : 'Unknown'),
                description: drugData.description || (isUnidentified ? "Unable to identify this medication from the provided image." : "No description available."),
                dosageAndAdmin: drugData.dosageAndAdmin || 'Take as directed by your healthcare provider.',
                sideEffects: drugData.sideEffects || (isUnidentified ? [] : ["No side effect information available"]),
                warnings: drugData.warnings || (isUnidentified ? [] : ["Consult a healthcare provider before use"]),
                interactions: drugData.interactions || [],
                storage: drugData.storage || 'Store at room temperature away from moisture, heat, and light. Keep out of reach of children.',
                mechanism: drugData.mechanism || (isUnidentified ? "" : "Mechanism of action not specified."),
                indications: drugData.indications || (drugData.recommendations || []),
                contraindications: drugData.contraindications || [],
                prescriptionStatus: drugData.prescriptionStatus || 'Unknown',
                pregnancy: drugData.pregnancy || 'Consult your healthcare provider before using during pregnancy.',
                verified: drugData.verified || false,
                image: drugData.image,
                drugClass: drugData.drugClass || (isUnidentified ? "" : 'Not specified'),
                brandNames: drugData.brandNames || [],
                imprint: drugData.imprint,
                color: drugData.color,
                shape: drugData.shape,
                possibleNames: drugData.possibleNames
              };
              
              setIdentifiedDrug(formattedDrugData);
              setIsSaved(false);
              setProcessingProgress(100);
              
              // Increment usage count for successful identification
              await incrementIdentificationUsage();
              
              // Play drug identification completion sound
              playDrugIdentificationSound();
              
              // Enhanced messaging based on identification result
              if (isUnidentified) {
                // Show helpful message for unidentified medications
                toast.warning(`Unable to identify medication`, { 
                  description: "We've provided recommendations to help you. Please see the details below.",
                  duration: 6000
                });
                
                // Show tips for better identification
                if (drugData.possibleNames && drugData.possibleNames.length > 0) {
                  setTimeout(() => {
                    toast.info(`Possible matches found`, {
                      description: `Consider: ${drugData.possibleNames.slice(0, 3).join(', ')}. Verify with a healthcare provider.`,
                      duration: 8000
                    });
                  }, 1000);
                }
              } else if (drugData.fromHistory) {
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
                  'high': "Enhanced analysis provided high confidence results. ✓",
                  'medium': "Enhanced analysis completed. Data from AI backup system.",
                  'low': "Enhanced analysis completed with low confidence. Verify with a healthcare professional."
                };
                
                const isBackupData = Array.isArray(drugData.processingStages) && drugData.processingStages.includes('gemini-backup');
                
                toast.success(`Medication identified: ${drugData.name}!`, { 
                  description: isBackupData ? "Data generated by AI backup system. Verify accuracy." : (confidenceMessage[drugData.confidence] || "Enhanced analysis completed."),
                  duration: drugData.confidence === 'low' || isBackupData ? 6000 : 4000
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
              if (Array.isArray(drugData.processingStages) && drugData.processingStages.length > 0) {
                console.log('Processing stages used:', drugData.processingStages);
              }
              
              // Additional information about image quality if relevant
              if (isImageLowRes || drugData.blurryModeUsed) {
                toast.info("For better accuracy, consider uploading a higher quality image.", { 
                  duration: 5000 
                });
              }
            } else {
              // Complete failure - no usable data at all
              console.error('No usable data returned from identification');
              
              // Create minimal error result to prevent blank screen
              const errorData: DetailedDrugData = {
                id: crypto.randomUUID(),
                name: "Identification Failed",
                genericName: "Unable to Process",
                manufacturer: "N/A",
                category: "Error",
                description: "We were unable to process this image. This could be due to:",
                dosageAndAdmin: "",
                sideEffects: [
                  "Image quality is too poor for identification",
                  "No visible text or markings detected",
                  "Medication type not recognized",
                  "Technical error during processing"
                ],
                warnings: [
                  "DO NOT consume any unidentified medication",
                  "Take the medication to a pharmacy for professional identification",
                  "Contact your healthcare provider if you have questions"
                ],
                interactions: [],
                storage: "",
                mechanism: "",
                indications: [
                  "Take a new photo with better lighting",
                  "Ensure text and markings are visible and in focus",
                  "Try capturing the medication from different angles",
                  "Clean the medication/packaging before photographing",
                  "Visit a pharmacy or healthcare provider for in-person identification"
                ],
                contraindications: [],
                prescriptionStatus: "Unknown",
                pregnancy: "",
                verified: false,
                drugClass: "",
                brandNames: []
              };
              
              setIdentifiedDrug(errorData);
              setErrorDetails("Could not identify medication from the image. Please see recommendations below.");
              toast.error("Could not identify the medication", {
                description: "We've provided guidance on next steps. See details below.",
                duration: 5000
              });
            }
          } catch (error: any) {
            console.error('Error processing image:', error);
            
            // Even on error, provide helpful information instead of blank screen
            const errorData: DetailedDrugData = {
              id: crypto.randomUUID(),
              name: "Processing Error",
              genericName: "Error Occurred",
              manufacturer: "N/A",
              category: "Error",
              description: `An error occurred during processing: ${error.message || "Unknown error"}`,
              dosageAndAdmin: "",
              sideEffects: [],
              warnings: [
                "DO NOT take any unidentified medication",
                "Seek professional help for medication identification",
                "Keep medication in original packaging for identification"
              ],
              interactions: [],
              storage: "",
              mechanism: "",
              indications: [
                "Try uploading a different, clearer image",
                "Check your internet connection",
                "If the problem persists, contact support",
                "Visit a pharmacy for in-person identification"
              ],
              contraindications: [],
              prescriptionStatus: "Unknown",
              pregnancy: "",
              verified: false,
              drugClass: "",
              brandNames: []
            };
            
            setIdentifiedDrug(errorData);
            setErrorDetails(`Error: ${error.message || "Unknown error"}`);
            toast.error("Failed to process the image", {
              description: "Please see recommendations and try again.",
              duration: 5000
            });
          } finally {
            setIsIdentifying(false);
            setProcessingProgress(100);
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
    // Clear any active progress interval
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    
    setIdentifiedDrug(null);
    setErrorDetails(null);
    setCapturedImage(null);
    setIsImageLowRes(false);
    setProcessingProgress(0);
    setCurrentProgress(0);
    setTargetProgress(0);
    setProcessingPhase("");
    setEstimatedTimeRemaining(null);
    setProcessingStartTime(0);
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
              onClick={() => navigate('/symptom-checker')}
            >
              Check Symptoms
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
                        Current plan: <span className={`font-medium ${isSpecialAccessAccount() ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                          {isSpecialAccessAccount() ? '✨ Special Access' : usageStats?.planName}
                        </span>
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
              
              <Tabs value={analysisMode} onValueChange={(value) => setAnalysisMode(value as 'standard' | 'enhanced')} className="mb-6">
                <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-4">
                  <TabsTrigger value="standard">Standard Mode</TabsTrigger>
                  <TabsTrigger value="enhanced">Enhanced Mode</TabsTrigger>
                </TabsList>
                
                <TabsContent value="standard" className="space-y-4">
                  <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">Quick Search</span>
                      </div>
                      <Switch 
                        id="blur-mode" 
                        checked={true}
                        disabled={false}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Fast identification for common medications. Good for clear images.
                    </p>
                    {isImageLowRes && (
                      <p className="text-xs text-amber-500 mt-2">
                        Your image appears to be low resolution. Enhanced Mode is recommended.
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="enhanced" className="space-y-4">
                  <div className="rounded-lg border p-4 bg-pharma-50 dark:bg-pharma-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-pharma-600" />
                        <span className="text-sm font-medium">Deep Analysis</span>
                      </div>
                      <Switch 
                        id="enhanced-mode" 
                        checked={enhancedMode}
                        onCheckedChange={setEnhancedMode}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Thorough analysis with complete information. Takes longer but more detailed.
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
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-gray-900 dark:text-white drop-shadow-md">
                      {processingPhase || "Analyzing medication..."}
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold drop-shadow-md">
                      {processingProgress}%
                    </span>
                  </div>
                  <Progress value={processingProgress} className="h-2.5" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 dark:text-white/90">
                      {enhancedMode 
                        ? "PharmaLens Deep Analysis" 
                        : "PharmaLens Quick Search"}
                    </span>
                    {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                      <span className="text-gray-700 dark:text-white/90 font-medium">
                        ~{estimatedTimeRemaining}s remaining
                      </span>
                    )}
                    {processingProgress === 100 && (
                      <span className="text-green-600 dark:text-green-400 font-medium drop-shadow-md">
                        ✓ Complete
                      </span>
                    )}
                  </div>
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
            
            {/* Medical Disclaimer & Important Warnings - Matching Tips Section Style */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto">
              <h3 className="font-medium text-lg sm:text-xl mb-4 sm:mb-6 text-amber-900 dark:text-amber-100">Important Medical Disclaimer:</h3>
              <ul className="list-disc list-inside space-y-3 sm:space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 text-amber-600" />
                  <span className="text-sm sm:text-base"><strong>99% Accuracy:</strong> Our AI achieves 99% identification accuracy, but no system is perfect. Always verify results with a healthcare professional.</span>
                </li>
                <li className="flex items-start">
                  <RotateCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 text-amber-600" />
                  <span className="text-sm sm:text-base"><strong>Cross-Check Results:</strong> If you receive an unexpected or incorrect result, switch to Enhanced Mode for deeper analysis and verification.</span>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 bg-amber-100 dark:bg-amber-800 rounded" />
                  <span className="text-sm sm:text-base"><strong>Not Medical Advice:</strong> This tool provides drug information only. It does not diagnose conditions or recommend treatments.</span>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 rounded-full border-2 border-amber-600" />
                  <span className="text-sm sm:text-base"><strong>Consult Healthcare Professionals:</strong> Always consult a doctor or pharmacist before taking any medication, especially if you have concerns.</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-1 flex-shrink-0 text-amber-600" />
                  <span className="text-sm sm:text-base"><strong>Emergency Situations:</strong> In case of poisoning or adverse reactions, contact emergency services immediately. Do not rely solely on this app.</span>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 mr-2 mt-1 flex-shrink-0 bg-amber-200 dark:bg-amber-700 rounded-sm" />
                  <span className="text-sm sm:text-base"><strong>Prescription Medications:</strong> Never take prescription medications without a valid prescription from a licensed healthcare provider.</span>
                </li>
                <li className="flex items-start">
                  <Zap className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-amber-600" />
                  <span className="text-sm sm:text-base"><strong>Use Both Modes:</strong> For critical decisions, use both Standard and Enhanced modes to compare results and ensure accuracy.</span>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={handleSaveToCache}
                          disabled={isSaving || analysisMode === 'standard'}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="h-4 w-4" />
                              <span>Save to Cache</span>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {analysisMode === 'standard' && (
                        <TooltipContent>
                          <p>Cache saving is only available in Enhanced Mode</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
                  <span>Saved to cache - will be instantly recognized next time</span>
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
