
import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const advancedButtonRef = useRef<HTMLDivElement>(null);
  const eliteButtonRef = useRef<HTMLDivElement>(null);
  
  // Effect to load the Razorpay button script when the dialog opens
  useEffect(() => {
    if (open && selectedPlan) {
      // Clear any existing scripts first
      const existingScript = document.querySelector('script[src="https://cdn.razorpay.com/static/widget/subscription-button.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Add the new script
      const script = document.createElement('script');
      script.src = 'https://cdn.razorpay.com/static/widget/subscription-button.js';
      script.async = true;
      document.body.appendChild(script);
      
      // Return cleanup function
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [open, selectedPlan]);

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
              
              {/* Render the appropriate Razorpay button */}
              <div className="mt-6">
                {selectedPlan.name === 'Advanced' && (
                  <div ref={advancedButtonRef} className="advanced-button">
                    <form>
                      <script 
                        src="https://cdn.razorpay.com/static/widget/subscription-button.js" 
                        data-subscription_button_id="pl_QF1itg7gdfQFbF" 
                        data-button_theme="brand-color"
                        async
                      ></script>
                    </form>
                  </div>
                )}
                
                {selectedPlan.name === 'Elite' && (
                  <div ref={eliteButtonRef} className="elite-button">
                    <form>
                      <script 
                        src="https://cdn.razorpay.com/static/widget/subscription-button.js" 
                        data-subscription_button_id="pl_QFGGMMuM37x0Sp" 
                        data-button_theme="brand-color"
                        async
                      ></script>
                    </form>
                  </div>
                )}
                
                {/* Fallback if button doesn't load properly */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    If the payment button doesn't appear, please try the direct link below:
                  </p>
                  {selectedPlan.name === 'Advanced' && (
                    <a 
                      href="https://rzp.io/l/pl_QF1itg7gdfQFbF" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Pay for Advanced Plan (₹299/month)
                    </a>
                  )}
                  {selectedPlan.name === 'Elite' && (
                    <a 
                      href="https://rzp.io/l/pl_QFGGMMuM37x0Sp" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Pay for Elite Plan (₹599/month)
                    </a>
                  )}
                </div>
              </div>
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
