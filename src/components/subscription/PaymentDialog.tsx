
import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import RazorpayScriptLoader from './RazorpayScriptLoader';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  monthly_identifications: number;
  features: string[];
  subscription_button_id?: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: Plan | null;
}

const PaymentDialog = ({ open, onOpenChange, selectedPlan }: PaymentDialogProps) => {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  
  useEffect(() => {
    if (open && selectedPlan && buttonContainerRef.current && scriptLoaded) {
      try {
        // Clear any existing content
        buttonContainerRef.current.innerHTML = '';
        
        if (selectedPlan.subscription_button_id) {
          // Create HTML for the button exactly as provided by Razorpay
          const buttonHtml = `
            <form>
              <script 
                src="https://cdn.razorpay.com/static/widget/subscription-button.js" 
                data-subscription_button_id="${selectedPlan.subscription_button_id}" 
                data-button_theme="brand-color" 
                async>
              </script>
            </form>
          `;
          
          // Set the HTML
          buttonContainerRef.current.innerHTML = buttonHtml;
          
          console.log(`Rendering Razorpay button for plan: ${selectedPlan.name} with ID: ${selectedPlan.subscription_button_id}`);
        }
      } catch (error) {
        console.error("Error rendering Razorpay button:", error);
        setScriptError(true);
      }
    }
  }, [open, selectedPlan, scriptLoaded]);

  const handleScriptLoaded = () => {
    setScriptLoaded(true);
    setScriptError(false);
  };

  const handleScriptError = () => {
    setScriptError(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Subscription</DialogTitle>
          <DialogDescription>
            Make a secure payment using Razorpay to activate your subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {selectedPlan && (
            <>
              <div className="flex justify-between">
                <span className="font-medium">{selectedPlan.name} Plan</span>
                <span>₹{selectedPlan.price_inr}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{selectedPlan.price_inr}</span>
                </div>
              </div>
              
              <RazorpayScriptLoader onLoaded={handleScriptLoaded} onError={handleScriptError}>
                {/* Razorpay button container */}
                <div className="mt-6">
                  {!scriptLoaded && !scriptError && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading payment options...</span>
                    </div>
                  )}
                  
                  {scriptError && (
                    <div className="text-center text-red-500 py-2">
                      Failed to load payment options. Please use the direct links below.
                    </div>
                  )}
                  
                  <div ref={buttonContainerRef} className="razorpay-button-container py-2"></div>
                  
                  {/* Direct payment links as fallback */}
                  <div className="text-center mt-4 border-t pt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      {scriptError ? "Please use the direct link below:" : "You can also use the direct link:"}
                    </p>
                    {selectedPlan.name === 'Advanced' && (
                      <a 
                        href="https://rzp.io/l/pl_QF1itg7gdfQFbF" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block bg-green-500 hover:bg-green-600 text-white rounded px-4 py-2 transition"
                      >
                        Pay for Advanced Plan (₹299/month)
                      </a>
                    )}
                    {selectedPlan.name === 'Elite' && (
                      <a 
                        href="https://rzp.io/l/pl_QFGGMMuM37x0Sp" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block bg-green-500 hover:bg-green-600 text-white rounded px-4 py-2 transition"
                      >
                        Pay for Elite Plan (₹599/month)
                      </a>
                    )}
                  </div>
                </div>
              </RazorpayScriptLoader>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
