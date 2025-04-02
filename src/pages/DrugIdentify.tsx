import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from '@/integrations/supabase/client';

const DrugIdentify = () => {
  const { isAuthenticated, user } = useAuthStatus();
  const [imageData, setImageData] = useState<string | null>(null);
  const [drugName, setDrugName] = useState('');
  const [drugDetails, setDrugDetails] = useState<any>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is authenticated and redirect if not
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const openCamera = () => {
    setIsCameraOpen(true);
    startCamera();
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check your permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraRef.current && cameraRef.current.srcObject) {
      const stream = cameraRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      cameraRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (cameraRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = cameraRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageData(dataUrl);
      stopCamera();
      setIsCameraOpen(false);
    }
  };

  const identifyImage = async () => {
    if (!imageData) {
      toast.error("Please capture an image first.");
      return;
    }

    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();

      if (result.success) {
        setDrugName(result.drugName);
        setDrugDetails(result.drugDetails);
      } else {
        toast.error(result.error || "Failed to identify medication.");
      }
    } catch (error) {
      console.error("Error identifying image:", error);
      toast.error("Failed to identify medication. Please try again.");
    }
  };

  const resetIdentification = () => {
    setImageData(null);
    setDrugName('');
    setDrugDetails(null);
  };

  const saveIdentificationData = async (drugName: string, drugDetails: any) => {
    if (!isAuthenticated) {
      toast.warning("Sign in to save your identification history");
      return;
    }

    try {
      setIsSaving(true);
      
      // Create an object with the correct types for Supabase
      const identificationData = {
        drug_name: drugName,
        details: drugDetails,
        image_url: imageData || undefined,
        user_id: user?.id
      };
      
      // Cast to Record<string, any> to satisfy TypeScript
      const { data, error } = await supabase
        .from('drug_identifications')
        .insert(identificationData as Record<string, any>);
        
      if (error) {
        throw error;
      }
      
      toast.success("Identification saved to history");
    } catch (error) {
      console.error('Error saving identification:', error);
      toast.error("Failed to save identification");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container max-w-3xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-center mb-8">Medication Identification</h1>

        {/* Camera Access Dialog */}
        <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Capture Medication Image</DialogTitle>
              <DialogDescription>
                Position the medication clearly within the camera view.
              </DialogDescription>
            </DialogHeader>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <video ref={cameraRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button type="button" variant="secondary" onClick={captureImage}>
                Capture
              </Button>
              <Button type="button" variant="destructive" onClick={closeCamera}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="mb-6">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            {!imageData ? (
              <>
                <div className="relative w-64 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <Camera className="h-10 w-10" />
                  </div>
                </div>
                <Button onClick={openCamera}>
                  Open Camera
                </Button>
              </>
            ) : (
              <>
                <div className="relative w-64 h-48 rounded-lg overflow-hidden mb-4">
                  <img src={imageData} alt="Medication" className="w-full h-full object-cover" />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={identifyImage} disabled={!imageData}>
                    Identify Medication
                  </Button>
                  <Button variant="outline" onClick={resetIdentification}>
                    Retake
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {drugName && drugDetails && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Identification Result</h2>
            <div className="mb-2">
              <span className="font-bold">Medication Name:</span> {drugName}
            </div>
            {drugDetails.genericName && (
              <div className="mb-2">
                <span className="font-bold">Generic Name:</span> {drugDetails.genericName}
              </div>
            )}
            {drugDetails.manufacturer && (
              <div className="mb-2">
                <span className="font-bold">Manufacturer:</span> {drugDetails.manufacturer}
              </div>
            )}
            {drugDetails.description && (
              <div className="mb-4">
                <span className="font-bold">Description:</span> {drugDetails.description}
              </div>
            )}
            <Button onClick={() => saveIdentificationData(drugName, drugDetails)} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save to History"
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default DrugIdentify;
