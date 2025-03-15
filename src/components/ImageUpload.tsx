
import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface ImageUploadProps {
  onImageCapture?: (file: File) => void;
  className?: string;
}

const ImageUpload = ({ onImageCapture, className }: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Simulate processing
    setIsLoading(true);
    setTimeout(() => {
      if (onImageCapture) {
        onImageCapture(file);
      }
      setIsLoading(false);
    }, 1500);
  };
  
  const clearImage = () => {
    setPreviewImage(null);
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
    <div className={cn("flex flex-col items-center", className)}>
      {!previewImage ? (
        <div
          className={cn(
            "w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center p-6",
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
          
          <div className="w-16 h-16 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-4">
            <ImageIcon className="h-8 w-8 text-pharma-600" />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
            Drag and drop your medication image here, or click to browse
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={triggerFileInput}
              className="px-4 py-2 rounded-lg bg-pharma-600 text-white text-sm font-medium hover:bg-pharma-700 transition-colors shadow-sm flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </button>
            
            <button
              type="button"
              onClick={triggerFileInput}
              className="px-4 py-2 rounded-lg bg-white text-pharma-800 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm flex items-center dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take a Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full relative rounded-xl overflow-hidden shadow-lg transition-all animate-scale-in">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <button 
              onClick={clearImage}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
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
            style={{ maxHeight: '400px' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
                <Loader2 className="h-5 w-5 text-pharma-600 animate-spin mr-2" />
                <span className="text-sm font-medium">Analyzing image...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
