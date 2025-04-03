
import React from 'react';
import { X, Coffee, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DonationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDonate: () => void;
}

const DonationPopup: React.FC<DonationPopupProps> = ({ isOpen, onClose, onDonate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn(
        "w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden",
        "transform transition-all duration-300",
        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>
        <div className="relative p-6">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-pharma-100 dark:bg-pharma-900/30 rounded-full flex items-center justify-center mb-4">
              <Coffee className="h-8 w-8 text-pharma-600" />
            </div>
            
            <h3 className="text-xl font-bold mb-2">Support PharmaLens</h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If you find this tool helpful, consider buying me a coffee to support the ongoing development and maintenance of PharmaLens.
            </p>
            
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Maybe Later
              </Button>
              
              <Button
                onClick={onDonate}
                className="flex-1 bg-pharma-600 hover:bg-pharma-700"
              >
                <Heart className="h-4 w-4 mr-2" /> 
                Buy Me a Coffee
              </Button>
            </div>

            <button 
              onClick={onClose}
              className="mt-4 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPopup;
