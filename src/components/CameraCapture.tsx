
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCw, Camera as CameraIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onImageCapture?: (file: File) => void;
  className?: string;
}

const CameraCapture = ({ onImageCapture, className }: CameraCaptureProps) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const initializeCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const facingMode = isFrontCamera ? 'user' : 'environment';
        const constraints = {
          video: { facingMode }
        };
        
        // Stop any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Get access to the camera
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Check if device has multiple cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
        
        // Set the stream as the video element's source
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Store the stream reference for later cleanup
        streamRef.current = stream;
        setHasPermission(true);
        setCameraActive(true);
      } else {
        toast({
          title: "Camera not supported",
          description: "Your browser doesn't support camera access.",
          variant: "destructive",
        });
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please grant permission to access your camera.",
        variant: "destructive",
      });
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame onto the canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL and then to a Blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File object from the Blob
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            
            // Update state with the captured image
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            
            // Stop the camera since we've captured our image
            stopCamera();
            
            // Process the captured image if a handler was provided
            if (onImageCapture) {
              setIsLoading(true);
              setTimeout(() => {
                onImageCapture(file);
                setIsLoading(false);
              }, 1000);
            }
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
  };

  const retakePhoto = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    initializeCamera();
  };

  const handleStartCamera = () => {
    if (!cameraActive && !capturedImage) {
      initializeCamera();
    }
  };

  useEffect(() => {
    return () => {
      // Clean up on component unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);

  useEffect(() => {
    // Reinitialize camera when switching between front/back
    if (cameraActive) {
      initializeCamera();
    }
  }, [isFrontCamera]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {!cameraActive && !capturedImage ? (
        <div 
          className="w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center p-6 border-gray-300 dark:border-gray-700 hover:border-pharma-400 hover:bg-gray-50 dark:hover:bg-gray-900"
          onClick={handleStartCamera}
        >
          <div className="w-16 h-16 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-4">
            <CameraIcon className="h-8 w-8 text-pharma-600" />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
            Click to activate your camera
          </p>
          
          <Button onClick={handleStartCamera} className="bg-pharma-600 hover:bg-pharma-700">
            <Camera className="h-4 w-4 mr-2" />
            Open Camera
          </Button>
        </div>
      ) : null}

      {cameraActive && !capturedImage ? (
        <div className="relative w-full max-w-lg rounded-xl overflow-hidden shadow-lg">
          <video 
            ref={videoRef} 
            className="w-full h-auto"
            autoPlay 
            playsInline 
            muted
          />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <Button 
              onClick={captureImage} 
              size="lg" 
              className="rounded-full h-16 w-16 bg-white text-pharma-600 hover:bg-gray-100 border-2 border-pharma-600"
            >
              <Camera className="h-8 w-8" />
            </Button>
            
            {hasMultipleCameras && (
              <Button 
                onClick={switchCamera} 
                size="sm" 
                variant="secondary" 
                className="rounded-full h-10 w-10 absolute right-4 top-4"
              >
                <RotateCw className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          <Button 
            onClick={stopCamera} 
            size="sm" 
            variant="destructive" 
            className="absolute top-4 left-4 rounded-full h-10 w-10 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
          
          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : null}

      {capturedImage && (
        <div className="w-full max-w-lg relative rounded-xl overflow-hidden shadow-lg transition-all animate-scale-in">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className={cn(
              "w-full object-cover transition-opacity duration-300",
              isLoading ? "opacity-60" : "opacity-100"
            )}
            style={{ maxHeight: '400px' }}
          />
          
          <div className="absolute top-4 right-4 flex space-x-2">
            {!isLoading && (
              <Button 
                onClick={retakePhoto}
                size="sm" 
                variant="secondary" 
                className="rounded-full"
              >
                <Camera className="h-4 w-4 mr-1" />
                Retake
              </Button>
            )}
          </div>
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
                <div className="flex items-center">
                  <div className="mr-3 h-8 w-8 animate-spin rounded-full border-2 border-pharma-600 border-t-transparent" />
                  <span className="text-sm font-medium">Processing image...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
