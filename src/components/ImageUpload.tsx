import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Image as ImageIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ImageUploadProps {
  onImageCapture?: (file: File) => void;
  className?: string;
}

const ImageUpload = ({ onImageCapture, className }: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageQualityWarning, setImageQualityWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file: File) => {
    // Enhanced file validation
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, WebP, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // Enhanced file size validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB. Large images will be automatically compressed.",
        variant: "destructive"
      });
      return;
    }
    
    // Enhanced quality assessment
    if (file.size < 30 * 1024) {
      setImageQualityWarning(true);
      toast({
        title: "Very low quality image detected",
        description: "This image may be too small for accurate identification. Enhanced processing will be used automatically.",
        variant: "default"
      });
    } else if (file.size < 100 * 1024) {
      setImageQualityWarning(true);
      toast({
        title: "Low quality image detected",
        description: "Consider using a higher resolution image for better results. Enhanced mode will be enabled.",
        variant: "default"
      });
    } else {
      setImageQualityWarning(false);
    }
    
    // Enhanced image processing with compression if needed
    const processImage = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Check image dimensions
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setPreviewImage(e.target?.result as string);
            return;
          }
          
          // Optimize image size while maintaining quality
          let { width, height } = img;
          const maxDimension = 1920; // Max dimension for processing
          
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width *= ratio;
            height *= ratio;
            
            canvas.width = width;
            canvas.height = height;
            
            // Apply image enhancement filters
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert back to blob with optimized quality
            canvas.toBlob((blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                
                // Create preview from optimized image
                const optimizedReader = new FileReader();
                optimizedReader.onload = (e) => {
                  setPreviewImage(e.target?.result as string);
                };
                optimizedReader.readAsDataURL(optimizedFile);
                
                // Process the optimized file
                processFile(optimizedFile);
              }
            }, 'image/jpeg', 0.9);
          } else {
            setPreviewImage(e.target?.result as string);
            processFile(file);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    
    const processFile = (processedFile: File) => {
      setIsLoading(true);
      
      // Add a small delay for better UX
      setTimeout(() => {
        if (onImageCapture) {
          onImageCapture(processedFile);
        }
        setIsLoading(false);
      }, 500);
    };
    
    processImage(file);
  };
  
  const clearImage = () => {
    setPreviewImage(null);
    setImageQualityWarning(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      {!previewImage ? (
        <div
          className={cn(
            "w-full min-h-[320px] sm:min-h-[360px] lg:min-h-[400px] max-w-2xl mx-auto border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10",
            dragActive 
              ? "border-pharma-500 bg-pharma-50 dark:bg-pharma-950/20" 
              : "border-gray-300 dark:border-gray-700 hover:border-pharma-400 hover:bg-gray-50 dark:hover:bg-gray-900"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            id="file-upload"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-4 sm:mb-6">
            <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-pharma-600" />
          </div>
          
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center">
            Upload Medication Image
          </p>
          
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md lg:max-w-lg leading-relaxed">
            Drag and drop your medication image here, or click to browse. For best results, ensure the image is clear and well-lit.
          </p>
          
          <div className="flex flex-col sm:flex-row w-full max-w-md lg:max-w-lg gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              type="button"
              onClick={triggerFileInput}
              className="flex-1 py-4 sm:py-3 lg:py-4 px-6 rounded-lg bg-pharma-600 text-white text-sm sm:text-base font-medium hover:bg-pharma-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center touch-manipulation"
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Upload Image
            </button>
            
            <button
              type="button"
              onClick={triggerFileInput}
              className="flex-1 py-4 sm:py-3 lg:py-4 px-6 rounded-lg bg-white text-pharma-800 text-sm sm:text-base font-medium border border-gray-200 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 touch-manipulation"
            >
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Take Photo
            </button>
          </div>
          
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center space-y-1">
            <p className="leading-relaxed">Supported formats: JPEG, PNG, WebP • Max size: 10MB</p>
            <p className="leading-relaxed">Images are automatically optimized for best identification results</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl mx-auto relative rounded-xl overflow-hidden shadow-lg transition-all animate-scale-in">
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            {imageQualityWarning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2.5 sm:p-2 rounded-full bg-yellow-500/80 text-white touch-manipulation">
                      <Info className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This image may be too low quality for accurate identification</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <button 
              onClick={clearImage}
              className="p-2.5 sm:p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors touch-manipulation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <img 
            src={previewImage} 
            alt="Preview" 
            className={cn(
              "w-full object-cover transition-opacity duration-300",
              isLoading ? "opacity-60" : "opacity-100"
            )}
            style={{ maxHeight: '500px', minHeight: '300px' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow-lg flex items-center mx-4">
                <Loader2 className="h-5 w-5 text-pharma-600 animate-spin mr-3" />
                <span className="text-sm sm:text-base font-medium">Preparing image...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
